"""Finish only the two accepted builds; no source, identity, signing or upload access."""
import json
import os
import pathlib
import sys
import time

from asc import Apple, Stop, existing_targets


ACCEPTED = {'SWAG': '1007', 'WALK': '8'}
REVIEWED_MANIFEST = '0ab5c02cbf3ea9011da8a762d5f81bab65ae24c3fd953e30ac948f7690c0dde5'


def groups_for_build(api, build_id):
    return api.rows('/betaGroups', {'filter[builds]': build_id,
                    'filter[isInternalGroup]': 'true', 'limit': 200})


def finish(api, target, number, deadline):
    rows = api.rows('/builds', {'filter[app]': target['appId'],
                    'filter[version]': number, 'limit': 10})
    if len(rows) != 1:
        raise Stop('ACCEPTED_BUILD_NOT_UNIQUE')
    build = rows[0]
    attrs = build['attributes']
    if attrs.get('processingState') != 'VALID' or attrs.get('expired') is not False:
        raise Stop('ACCEPTED_BUILD_NOT_VALID')
    if attrs.get('usesNonExemptEncryption') not in (None, False):
        raise Stop('ENCRYPTION_DECLARATION_DIFFERS_FROM_REVIEW')
    detail_path = '/builds/' + build['id'] + '/buildBetaDetail'
    state = api.request(detail_path)['data']['attributes'].get('internalBuildState')
    if attrs.get('usesNonExemptEncryption') is None:
        if state != 'MISSING_EXPORT_COMPLIANCE':
            raise Stop('ENCRYPTION_STATE_DIFFERS_FROM_DIAGNOSIS')
        # The exact accepted source uses OS HTTPS and SHA-256 integrity hashes.
        # No application or linked third-party non-exempt encryption was found.
        api.request('/builds/' + build['id'], method='PATCH', body={'data': {
            'type': 'builds', 'id': build['id'],
            'attributes': {'usesNonExemptEncryption': False}}})
        print('SUG_EXISTING_BUILD_EXEMPTION_SAVED=' + number, flush=True)
    assignment_attempted = False
    while time.monotonic() < deadline:
        state = api.request(detail_path)['data']['attributes'].get('internalBuildState')
        if state in ('EXPIRED', 'PROCESSING_EXCEPTION'):
            raise Stop('APPLE_INTERNAL_' + state)
        if state in ('READY_FOR_BETA_TESTING', 'IN_BETA_TESTING'):
            associated = any(g['id'] == target['groupId'] for g in groups_for_build(api, build['id']))
            if not associated and not assignment_attempted:
                api.request('/builds/' + build['id'] + '/relationships/betaGroups', body={
                    'data': [{'type': 'betaGroups', 'id': target['groupId']}]})
                assignment_attempted = True
                associated = any(g['id'] == target['groupId'] for g in groups_for_build(api, build['id']))
            if associated and state == 'IN_BETA_TESTING':
                group_builds = api.rows('/betaGroups/' + target['groupId'] + '/builds', {'limit': 200})
                current = api.request('/builds/' + build['id'])['data']['attributes']
                if (any(b['id'] == build['id'] for b in group_builds) and
                        current.get('usesNonExemptEncryption') is False and
                        current.get('processingState') == 'VALID' and current.get('expired') is False):
                    return {'build': number, 'state': state, 'processing': 'VALID',
                            'existingInternalGroupConfirmed': True,
                            'existingUserMembershipVerified': bool(target['memberEmails']),
                            'usesNonExemptEncryption': False}
        time.sleep(20)
    return {'build': number, 'state': 'APPLE_PROCESSING_PENDING'}


def main():
    policy = json.loads(pathlib.Path(__file__).with_name('policy.json').read_text())
    if (os.environ.get('GITHUB_REPOSITORY') != policy['repository'] or
            os.environ.get('GITHUB_REF_NAME') != policy['branch'] or
            policy['additionalPayment'] != 0 or
            policy['currentInput']['manifestSHA256'] != REVIEWED_MANIFEST):
        raise Stop('APPROVED_CURRENT_DELIVERY_CONTEXT_REQUIRED')
    api = Apple()
    targets = existing_targets(api, policy)
    if set(ACCEPTED) - set(targets):
        raise Stop('EXISTING_INTERNAL_TARGET_NOT_VERIFIED')
    results = {}
    deadline = time.monotonic() + 14 * 60
    for app, number in ACCEPTED.items():
        try:
            results[app] = finish(api, targets[app], number, deadline)
        except Stop as error:
            results[app] = {'build': number, 'state': str(error)}
    print('SUG_COMPLETED_INTERNAL_DELIVERY=' + json.dumps(results, separators=(',', ':')), flush=True)
    if any(row['state'] != 'IN_BETA_TESTING' for row in results.values()):
        raise Stop('INTERNAL_TESTFLIGHT_NOT_CONFIRMED_FOR_BOTH')


if __name__ == '__main__':
    try:
        main()
    except Stop as error:
        print('SUG_STOP=' + str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('SUG_STOP=PRIVATE_COMPLETION_DIAGNOSTIC_WITHHELD', file=sys.stderr)
        sys.exit(1)
