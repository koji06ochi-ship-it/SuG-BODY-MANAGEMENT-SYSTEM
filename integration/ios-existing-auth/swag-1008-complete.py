"""Finish processing of accepted SWAG 1008 on free Ubuntu, without signing/upload."""
import importlib.util
import json
import pathlib
import sys
import time

from asc import Apple, Stop, existing_targets


def main():
    here = pathlib.Path(__file__).resolve().parent
    policy = json.loads((here / 'swag-1008-policy.json').read_text())
    api = Apple()
    targets = existing_targets(api, policy)
    if set(targets) != {'SWAG'}:
        raise Stop('EXISTING_SWAG_INTERNAL_TARGET_NOT_VERIFIED')
    target = targets['SWAG']
    deadline = time.monotonic() + 14 * 60
    while time.monotonic() < deadline:
        rows = api.rows('/builds', {'filter[app]': target['appId'], 'filter[version]': '1008', 'limit': 10})
        if len(rows) > 1:
            raise Stop('ACCEPTED_BUILD1008_NOT_UNIQUE')
        if rows:
            state = rows[0]['attributes'].get('processingState')
            if state in ('INVALID', 'FAILED'):
                raise Stop('APPLE_PROCESSING_' + state)
            if state == 'VALID':
                spec = importlib.util.spec_from_file_location('complete_internal', here / 'complete-internal.py')
                complete = importlib.util.module_from_spec(spec); spec.loader.exec_module(complete)
                result = complete.finish(api, target, '1008', deadline)
                print('SUG_SWAG1008_INTERNAL_DELIVERY=' + json.dumps(result, separators=(',', ':')), flush=True)
                if result['state'] != 'IN_BETA_TESTING':
                    raise Stop('APPLE_PROCESSING_PENDING_NO_REBUILD')
                return
        time.sleep(20)
    raise Stop('ACCEPTED_BUILD1008_PROCESSING_PENDING_NO_REBUILD')


if __name__ == '__main__':
    try:
        main()
    except Stop as error:
        print('SUG_STOP=' + str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('SUG_STOP=PRIVATE_SWAG1008_COMPLETION_DIAGNOSTIC_WITHHELD', file=sys.stderr)
        sys.exit(1)
