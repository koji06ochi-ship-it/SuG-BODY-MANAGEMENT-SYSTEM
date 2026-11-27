"""Read only SWAG1008 receipt/upload state; never print IDs, descriptions or files."""
import json
import os
import pathlib
import re
import sys

from asc import Apple, Stop


STATES = {'AWAITING_UPLOAD', 'PROCESSING', 'FAILED', 'COMPLETE', 'VALID', 'INVALID'}


def safe_state(value):
    states, codes = set(), set()
    if isinstance(value, dict):
        for name, child in value.items():
            if name == 'code' and isinstance(child, str) and re.fullmatch(r'[A-Z0-9_.-]{1,80}', child):
                codes.add(child)
            more_states, more_codes = safe_state(child)
            states.update(more_states); codes.update(more_codes)
    elif isinstance(value, list):
        for child in value:
            more_states, more_codes = safe_state(child)
            states.update(more_states); codes.update(more_codes)
    elif isinstance(value, str) and value in STATES:
        states.add(value)
    return states, codes


def main():
    policy = json.loads(pathlib.Path(__file__).with_name('swag-1008-policy.json').read_text())
    if (os.environ.get('GITHUB_REPOSITORY') != policy['repository'] or
            os.environ.get('GITHUB_REF_NAME') != policy['branch'] or policy['additionalPayment'] != 0):
        raise Stop('SWAG1008_APPROVED_READ_CONTEXT_REQUIRED')
    api = Apple()
    target = policy['apps']['SWAG']
    app = api.request('/apps/' + target['appId'])['data']['attributes']
    if app.get('bundleId') != target['bundle']:
        raise Stop('SWAG1008_APP_ID_BUNDLE_DIFFERS')
    builds = api.rows('/builds', {'filter[app]': target['appId'], 'filter[version]': '1008', 'limit': 10})
    build_states, _ = safe_state([b.get('attributes', {}).get('processingState') for b in builds])
    print('SUG_SWAG1008_APPLE_RECEIPT=' + json.dumps({
        'build': '1008', 'acceptedBuildCount': len(builds), 'processing': sorted(build_states)
    }, separators=(',', ':')), flush=True)
    uploads = api.rows('/apps/' + target['appId'] + '/buildUploads', {'limit': 100})
    uploads = [u for u in uploads if str(u.get('attributes', {}).get('cfBundleVersion')) == '1008'
               and u.get('attributes', {}).get('cfBundleShortVersionString') == '1.0.0']
    states, codes = safe_state([u.get('attributes', {}).get('state') for u in uploads])
    print('SUG_SWAG1008_APPLE_UPLOAD_HISTORY=' + json.dumps({
        'build': '1008', 'matchingUploadCount': len(uploads),
        'states': sorted(states), 'errorCodes': sorted(codes)
    }, separators=(',', ':')), flush=True)


if __name__ == '__main__':
    try:
        main()
    except Stop as error:
        print('SUG_STOP=' + str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('SUG_STOP=SWAG1008_UPLOAD_STATUS_PRIVATE_DETAIL_WITHHELD', file=sys.stderr)
        sys.exit(1)
