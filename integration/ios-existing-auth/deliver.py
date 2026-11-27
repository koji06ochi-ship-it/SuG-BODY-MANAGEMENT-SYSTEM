"""Existing BODY runtime; signed IPAs go directly to approved internal TestFlight."""
import base64
import importlib
import json
import os
import pathlib
import platform
import plistlib
import secrets
import shutil
import subprocess
import sys
import time

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.serialization import pkcs12

from asc import Apple, Stop, existing_targets, next_build
from hydrate import hydrate
from identity import recover, live_certificate, existing_profiles


HERE = pathlib.Path(__file__).resolve().parent


def assemble_current(root, apps):
    pipeline = root / 'pipeline'
    walk = root / '.sources/walk/WALK-BUILD3/iOS'
    swag = root / '.sources/swag/ios-delivery/BODY/iOS'
    swag_web = swag / 'Resources/BodyFormal/apps/body/daily-preview'
    baby = swag_web / 'assets/baby-gold.jpeg'
    if not baby.is_file():
        raise Stop('CURRENT_SWAG_ORIGINAL_BABY_MISSING')
    projects = {}
    if 'WALK' in apps:
        web = walk / 'Resources/Web/five'
        upstream = root / '.sources/web/walk-r7-preview'
        if not upstream.is_dir() or not (walk / 'Resources/Web/five-host.js').is_file():
            raise Stop('CURRENT_WALK_NATIVE_INTEGRATION_MISSING')
        shutil.rmtree(web)
        shutil.copytree(upstream, web)
        projects['WALK'] = {'project': walk / 'SuGWALK.xcodeproj', 'resource': 'Web',
                            'entitlements': walk / 'Sources/SuGWALK.entitlements', 'web': web}
    if 'SWAG' in apps:
        projects['SWAG'] = {'project': swag / 'SuGBODY.xcodeproj', 'resource': 'BodyFormal',
                            'entitlements': swag / 'Sources/SuGMember.entitlements', 'web': swag_web}
    for app, row in projects.items():
        common = row['web'] / 'common'; common.mkdir(exist_ok=True)
        shutil.copy2(pipeline / 'pinkman-baby-zone.js', common / 'pinkman-baby-zone.js')
        shutil.copy2(baby, common / 'baby-gold.jpeg')
        entry = row['web'] / 'index.html'
        html = entry.read_text(encoding='utf-8')
        if html.lower().count('</body>') != 1 or 'data-sug-baby-zone' in html:
            raise Stop('CURRENT_ENTRY_DOCUMENT_DIFFERS')
        offset = html.lower().rindex('</body>')
        script = '<script data-sug-baby-zone data-app="' + app + '" src="common/pinkman-baby-zone.js"></script>'
        entry.write_text(html[:offset] + script + html[offset:], encoding='utf-8')
    return projects


def assign_internal(api, target, number, deadline):
    assigned = False
    while time.monotonic() < deadline:
        rows = api.rows('/builds', {'filter[app]': target['appId'], 'filter[version]': number, 'limit': 10})
        if rows:
            build = rows[0]
            state = build['attributes']['processingState']
            if state in ('FAILED', 'INVALID'):
                raise Stop('APPLE_PROCESSING_' + state)
            if state == 'VALID':
                if not assigned:
                    api.request('/builds/' + build['id'] + '/relationships/betaGroups',
                                body={'data': [{'type': 'betaGroups', 'id': target['groupId']}]})
                    assigned = True
                groups = api.rows('/betaGroups', {'filter[builds]': build['id'],
                                                  'filter[isInternalGroup]': 'true', 'limit': 200})
                if not any(g['id'] == target['groupId'] for g in groups):
                    raise Stop('EXISTING_INTERNAL_ASSIGNMENT_NOT_CONFIRMED')
                detail = api.request('/builds/' + build['id'] + '/buildBetaDetail')['data']['attributes']
                state = detail.get('internalBuildState')
                if state == 'IN_BETA_TESTING':
                    return state
                if state in ('MISSING_EXPORT_COMPLIANCE', 'EXPIRED'):
                    raise Stop('APPLE_INTERNAL_' + state)
        time.sleep(20)
    return 'PROCESSING_PENDING'


def main():
    policy = json.loads((HERE / 'policy.json').read_text())
    if (platform.system() != 'Darwin' or os.environ.get('GITHUB_REPOSITORY') != policy['repository'] or
            os.environ.get('GITHUB_REF_NAME') != policy['branch'] or policy['additionalPayment'] != 0):
        raise Stop('APPROVED_FREE_RUNTIME_REQUIRED')
    temp = pathlib.Path(os.environ['RUNNER_TEMP']).resolve()
    root = temp / 'sug-current-ios-input'
    identity = temp / 'sug-current-ios-identity'
    output = temp / 'sug-current-ios-output'
    if any(p.exists() for p in (root, identity, output)):
        raise Stop('DO_NOT_OVERWRITE_EXISTING_RUNNER_WORK')
    keychain = identity / 'signing.keychain-db'
    key_path = None
    deadline = time.monotonic() + 24 * 60
    results, uploaded = {}, {}
    helper = None
    try:
        api = Apple()
        private, leaf, chain, password = recover(policy)
        live_certificate(api, policy, leaf)
        targets = existing_targets(api, policy)
        profiles = existing_profiles(api, policy)
        if 'SWAG' not in targets:
            raise Stop('SWAG_EXISTING_INTERNAL_TARGET_NOT_VERIFIED')
        apps = ['SWAG']
        if 'WALK' in targets and 'WALK' in profiles:
            apps.append('WALK')
        else:
            print('SUG_WALK_DEFERRED=EXISTING_TARGET_OR_PROFILE_NOT_VERIFIED', flush=True)
        hydrate(private, policy, root)
        projects = assemble_current(root, apps)
        sys.path.insert(0, str(root / 'pipeline'))
        helper = importlib.import_module('release')
        helper.CONFIG = {**policy, 'allowNewProfiles': policy['maximumNewSWAGProfiles'] == 1}
        helper.toolchain()
        public_token = (root / 'pipeline/mapbox-public-token').read_text().strip()
        if 'WALK' in apps:
            if not public_token.startswith('pk.'):
                raise Stop('EXISTING_MAPBOX_PUBLIC_TOKEN_MISSING')
            os.environ['SUG_MAPBOX_PUBLIC_TOKEN'] = public_token
        identity.mkdir(mode=0o700); output.mkdir(mode=0o700)
        compatible = pkcs12.serialize_key_and_certificates(b'S.u.G existing distribution', private, leaf, chain,
            serialization.PrivateFormat.PKCS12.encryption_builder().kdf_rounds(50000)
            .key_cert_algorithm(pkcs12.PBES.PBESv1SHA1And3KeyTripleDESCBC).hmac_hash(hashes.SHA1()).build(password))
        for name, raw in [('distribution.p12', compatible), ('p12-password', password),
                          ('keychain-password', secrets.token_urlsafe(32).encode())]:
            path = identity / name; path.write_bytes(raw); path.chmod(0o600)
        signing = {}
        for app in apps:
            if app in profiles:
                raw, profile = profiles[app]
                path = identity / (app + '.mobileprovision'); path.write_bytes(raw); path.chmod(0o600)
                signing[app] = (path, profile, False)
        if 'SWAG' not in signing:
            signing['SWAG'] = helper.swag_profile(api, identity,
                plistlib.loads(projects['SWAG']['entitlements'].read_bytes()))
        helper.install_identity(identity, signing, output / 'keychain.log')
        key_dir = pathlib.Path.home() / '.appstoreconnect/private_keys'
        key_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        candidate = key_dir / ('AuthKey_' + os.environ['ASC_API_KEY_ID'] + '.p8')
        if candidate.exists():
            raise Stop('DO_NOT_OVERWRITE_EXISTING_RUNNER_KEY')
        key_path = candidate
        key_path.write_bytes(api.pem); key_path.chmod(0o600)
        for app in apps:
            if app == 'WALK' and deadline - time.monotonic() < 7 * 60:
                results[app] = {'state': 'DEFERRED_TO_PRESERVE_SWAG_DELIVERY'}
                continue
            stage = 'ARCHIVE'
            try:
                number = next_build(api, targets[app]['appId'], policy['apps'][app]['minimumBuild'])
                print('SUG_SIGNING_START=' + app + ':' + str(number), flush=True)
                record = helper.archive(app, projects[app], signing[app], number, temp, output)
                print('SUG_SIGNED_IPA_SHA256=' + app + ':' + str(number) + ':' + record['sha256'], flush=True)
                stage = 'UPLOAD'
                if api.rows('/builds', {'filter[app]': targets[app]['appId'], 'filter[version]': str(number), 'limit': 10}):
                    raise Stop('BUILD_NUMBER_ALREADY_EXISTS_DO_NOT_RESEND')
                helper.run(['xcrun', 'altool', '--upload-app', '--type', 'ios', '--file', output / record['ipa'],
                            '--apiKey', os.environ['ASC_API_KEY_ID'], '--apiIssuer', os.environ['ASC_API_ISSUER_ID']],
                           output / (app + '-upload.log'))
                uploaded[app] = str(number)
                results[app] = {'build': str(number), 'state': 'UPLOAD_ACCEPTED', 'sha256': record['sha256']}
                print('SUG_UPLOAD_ACCEPTED=' + app + ':' + str(number), flush=True)
            except Exception:
                # No raw compiler/altool output, command arguments, tester data or credentials leave the runner.
                results[app] = {'state': stage + '_FAILED_PRIVATE_DIAGNOSTICS_WITHHELD'}
                print('SUG_APP_STAGE_FAILED=' + app + ':' + stage, flush=True)
        for app, number in uploaded.items():
            try:
                results[app]['state'] = assign_internal(api, targets[app], number, deadline)
            except Stop as error:
                results[app]['state'] = str(error)
        print('SUG_INTERNAL_DELIVERY=' + json.dumps(results, separators=(',', ':')), flush=True)
        if not any(r.get('state') == 'IN_BETA_TESTING' for r in results.values()):
            raise Stop('NO_APP_CONFIRMED_IN_INTERNAL_TESTFLIGHT')
    finally:
        if keychain.exists():
            subprocess.run(['security', 'list-keychains', '-d', 'user', '-s', 'login.keychain-db'], capture_output=True)
            subprocess.run(['security', 'delete-keychain', str(keychain)], capture_output=True)
        if key_path is not None:
            key_path.unlink(missing_ok=True)
        for folder in (root, identity, output):
            if folder.parent == temp and folder.is_dir():
                shutil.rmtree(folder)


if __name__ == '__main__':
    try:
        main()
    except Stop as error:
        print('SUG_STOP=' + str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('SUG_STOP=DELIVERY_PRIVATE_DIAGNOSTICS_WITHHELD', file=sys.stderr)
        sys.exit(1)
