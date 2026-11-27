"""One approved SWAG 1008 startup fix; no WALK build and no reuse of old app payloads."""
import importlib
import importlib.util
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

from asc import Apple, Stop, existing_targets
from deliver import assemble_current
from hydrate import hydrate, digest
from identity import recover, live_certificate, existing_profiles


HERE = pathlib.Path(__file__).resolve().parent


def main():
    policy = json.loads((HERE / 'swag-1008-policy.json').read_text())
    if (platform.system() != 'Darwin' or os.environ.get('SUG_SWAG1008_APPROVED') != 'true' or
            os.environ.get('GITHUB_REPOSITORY') != policy['repository'] or
            os.environ.get('GITHUB_REF_NAME') != policy['branch'] or
            set(policy['apps']) != {'SWAG'} or policy['source']['build'] != '1008' or
            policy['additionalPayment'] != 0 or policy['maximumNewSWAGProfiles'] != 0):
        raise Stop('NEW_SWAG1008_EXECUTION_AND_INTERNAL_DELIVERY_APPROVAL_REQUIRED')
    temp = pathlib.Path(os.environ['RUNNER_TEMP']).resolve()
    root, identity, output = [temp / ('sug-swag1008-' + name) for name in ('input', 'identity', 'output')]
    if any(path.exists() for path in (root, identity, output)):
        raise Stop('DO_NOT_OVERWRITE_EXISTING_SWAG1008_RUNNER_WORK')
    keychain = identity / 'signing.keychain-db'
    key_path = None
    stage = 'EXISTING_AUTH_AND_SOURCE'
    try:
        api = Apple()
        targets = existing_targets(api, policy)
        if set(targets) != {'SWAG'}:
            raise Stop('EXISTING_SWAG_INTERNAL_GROUP_AND_USER_NOT_VERIFIED')
        target = targets['SWAG']
        if api.rows('/builds', {'filter[app]': target['appId'], 'filter[version]': '1008', 'limit': 10}):
            raise Stop('BUILD1008_ALREADY_EXISTS_DO_NOT_REBUILD_OR_RESEND')
        private, leaf, chain, password = recover(policy)
        live_certificate(api, policy, leaf)
        profiles = existing_profiles(api, policy)
        if set(profiles) != {'SWAG'}:
            raise Stop('EXISTING_SWAG_PROFILE_MUST_BE_REUSED_NO_CREATION_ALLOWED')
        source = pathlib.Path(os.environ['GITHUB_WORKSPACE']) / 'swag-1008-source'
        sha = subprocess.check_output(['git', '-C', source, 'rev-parse', 'HEAD'], text=True).strip()
        tree = subprocess.check_output(['git', '-C', source, 'rev-parse', 'HEAD:' + policy['source']['nativePrefix']], text=True).strip()
        if sha != policy['source']['ref'] or tree != policy['source']['nativeTree']:
            raise Stop('SWAG1008_EXACT_GITHUB_ORIGINAL_DIFFERS')
        native = source / policy['source']['nativePrefix']
        if digest((native / 'Sources/BundleHTTPServer.swift').read_bytes()) != policy['source']['serverSHA256']:
            raise Stop('SWAG1008_LISTENER_FIX_SHA256_DIFFERS')
        hydrate(private, policy, root)
        destination = root / '.sources/swag' / policy['source']['nativePrefix']
        shutil.copytree(native, destination)
        projects = assemble_current(root, ['SWAG'])
        info_path = destination / 'Sources/Info.plist'
        info = plistlib.loads(info_path.read_bytes())
        info['ITSAppUsesNonExemptEncryption'] = False
        info_path.write_bytes(plistlib.dumps(info, sort_keys=False))
        sys.path.insert(0, str(root / 'pipeline'))
        helper = importlib.import_module('release')
        helper.CONFIG = policy
        helper.toolchain()
        identity.mkdir(mode=0o700); output.mkdir(mode=0o700)
        stage = 'VERIFIED_ACTUAL_IOS_STARTUP_PROVENANCE'
        if os.environ.get('SUG_SWAG1008_REUSE_VERIFIED_STARTUP') != 'true':
            raise Stop('SWAG1008_UPLOAD_RESUMPTION_REQUIRES_PRIOR_ACTUAL_STARTUP_PROOF')
        proof = json.loads((HERE / 'swag-1008-runtime-proof.json').read_text())
        if (proof['runId'] != 45989334005 or proof['macJobId'] != 140472887802 or
                proof['pipelineSHA'] != 'd5fe35721ae8e797dd7ea9343cce2122d35f6eed' or
                proof['sourceSHA'] != sha or proof['nativeTree'] != tree or
                proof['serverSHA256'] != policy['source']['serverSHA256'] or
                proof['manifestSHA256'] != policy['currentInput']['manifestSHA256'] or
                proof['build'] != '1008' or proof['realAppLaunched'] is not True or
                proof['topHTTP'] != 200 or proof['babyZoneResourcesServed'] is not True or
                proof['fixedIPv4LoopbackOnly'] is not True or
                proof['topSHA256'] != digest((projects['SWAG']['web'] / 'index.html').read_bytes()) or
                proof['babyZoneSHA256'] != digest((root / 'pipeline/pinkman-baby-zone.js').read_bytes())):
            raise Stop('SWAG1008_PRIOR_ACTUAL_STARTUP_PROOF_DIFFERS_DO_NOT_REBUILD')
        print('SUG_SWAG1008_PREVIOUS_ACTUAL_STARTUP_REUSED=45989334005:SAME_SOURCE_TOP_AND_BABY_ZONE', flush=True)
        stage = 'EXISTING_IDENTITY_IMPORT'
        compatible = pkcs12.serialize_key_and_certificates(b'S.u.G existing distribution', private, leaf, chain,
            serialization.PrivateFormat.PKCS12.encryption_builder().kdf_rounds(50000)
            .key_cert_algorithm(pkcs12.PBES.PBESv1SHA1And3KeyTripleDESCBC).hmac_hash(hashes.SHA1()).build(password))
        for name, raw in [('distribution.p12', compatible), ('p12-password', password),
                          ('keychain-password', secrets.token_urlsafe(32).encode())]:
            path = identity / name; path.write_bytes(raw); path.chmod(0o600)
        raw_profile, profile = profiles['SWAG']
        profile_path = identity / 'SWAG.mobileprovision'
        profile_path.write_bytes(raw_profile); profile_path.chmod(0o600)
        signing = {'SWAG': (profile_path, profile, False)}
        helper.install_identity(identity, signing, output / 'keychain.log')
        stage = 'SIGNED_ARCHIVE_1008'
        record = helper.archive('SWAG', projects['SWAG'], signing['SWAG'], 1008, temp, output)
        print('SUG_SIGNED_IPA_SHA256=SWAG:1008:' + record['sha256'], flush=True)
        stage = 'APPROVED_INTERNAL_UPLOAD_1008'
        if api.rows('/builds', {'filter[app]': target['appId'], 'filter[version]': '1008', 'limit': 10}):
            raise Stop('BUILD1008_ALREADY_EXISTS_DO_NOT_RESEND')
        key_dir = pathlib.Path.home() / '.appstoreconnect/private_keys'
        key_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        candidate = key_dir / ('AuthKey_' + os.environ['ASC_API_KEY_ID'] + '.p8')
        if candidate.exists():
            raise Stop('DO_NOT_OVERWRITE_EXISTING_RUNNER_KEY')
        key_path = candidate; key_path.write_bytes(api.pem); key_path.chmod(0o600)
        spec = importlib.util.spec_from_file_location('swag_upload', HERE / 'swag-1008-upload.py')
        upload_helper = importlib.util.module_from_spec(spec); spec.loader.exec_module(upload_helper)
        upload_helper.upload(output / record['ipa'], record['sha256'], output / 'SWAG-upload.log')
        print('SUG_UPLOAD_ACCEPTED=SWAG:1008', flush=True)
        stage = 'EXISTING_INTERNAL_GROUP_PROPAGATION'
        # Apple processing must not consume another macOS run. Continue on free Ubuntu.
        print('SUG_SWAG1008_NEXT=FREE_UBUNTU_COMPLETE_ONLY_NO_REBUILD', flush=True)
    except Stop:
        raise
    except Exception:
        raise Stop('SWAG1008_' + stage + '_FAILED_PRIVATE_DIAGNOSTICS_WITHHELD') from None
    finally:
        if keychain.exists():
            subprocess.run(['security', 'list-keychains', '-d', 'user', '-s', 'login.keychain-db'], capture_output=True)
            subprocess.run(['security', 'delete-keychain', str(keychain)], capture_output=True)
        if key_path is not None:
            key_path.unlink(missing_ok=True)
        for path in (root, identity, output, temp / 'swag-1008-simulator'):
            if path.parent == temp and path.is_dir():
                shutil.rmtree(path)


if __name__ == '__main__':
    try:
        main()
    except Stop as error:
        print('SUG_STOP=' + str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('SUG_STOP=PRIVATE_SWAG1008_DIAGNOSTIC_WITHHELD', file=sys.stderr)
        sys.exit(1)
