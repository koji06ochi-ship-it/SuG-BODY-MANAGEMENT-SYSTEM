"""Read the two accepted builds without exposing tester or group information."""
import json
import pathlib
import sys

from asc import Apple, Stop, existing_targets


def main():
    policy = json.loads(pathlib.Path(__file__).with_name('policy.json').read_text())
    api = Apple()
    targets = existing_targets(api, policy)
    results = {}
    for app, number in (('SWAG', '1007'), ('WALK', '8')):
        if app not in targets:
            raise Stop('EXISTING_INTERNAL_TARGET_NOT_VERIFIED')
        target = targets[app]
        builds = api.rows('/builds', {'filter[app]': target['appId'],
                                    'filter[version]': number, 'limit': 10})
        if len(builds) != 1:
            raise Stop('ACCEPTED_BUILD_NOT_UNIQUE')
        build = builds[0]
        attrs = build['attributes']
        detail = api.request('/builds/' + build['id'] + '/buildBetaDetail')['data']['attributes']
        group = api.request('/betaGroups/' + target['groupId'])['data']['attributes']
        associated = api.rows('/betaGroups', {'filter[builds]': build['id'],
                              'filter[isInternalGroup]': 'true', 'limit': 200})
        group_builds = api.rows('/betaGroups/' + target['groupId'] + '/builds', {'limit': 200})
        results[app] = {
            'build': number,
            'processing': attrs.get('processingState'),
            'expired': attrs.get('expired'),
            'usesNonExemptEncryption': attrs.get('usesNonExemptEncryption'),
            'audience': attrs.get('buildAudienceType'),
            'internalState': detail.get('internalBuildState'),
            'externalState': detail.get('externalBuildState'),
            'existingGroupInternal': group.get('isInternalGroup'),
            'existingGroupAllBuilds': group.get('hasAccessToAllBuilds'),
            'existingGroupAutoNotify': group.get('autoNotifyEnabled'),
            'groupAssociatedFromBuild': any(g['id'] == target['groupId'] for g in associated),
            'buildAssociatedFromGroup': any(b['id'] == build['id'] for b in group_builds),
            'existingUserMembershipVerified': bool(target['memberEmails']),
        }
    print('SUG_ACCEPTED_BUILD_STATUS=' + json.dumps(results, separators=(',', ':')), flush=True)


if __name__ == '__main__':
    try:
        main()
    except Stop as error:
        print('SUG_STOP=' + str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('SUG_STOP=PRIVATE_STATUS_DIAGNOSTIC_WITHHELD', file=sys.stderr)
        sys.exit(1)
