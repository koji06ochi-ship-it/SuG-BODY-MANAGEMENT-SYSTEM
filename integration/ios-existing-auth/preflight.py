"""One real read-only Apple preflight; no tester data or artifacts are published."""
import base64
import json
import pathlib
import sys

from asc import Apple, Stop, existing_targets
from identity import recover, live_certificate, existing_profiles


HERE = pathlib.Path(__file__).resolve().parent


def main():
    policy = json.loads((HERE / 'policy.json').read_text())
    api = Apple()
    _, leaf, _, _ = recover(policy)
    der = live_certificate(api, policy, leaf)
    targets = existing_targets(api, policy)
    profiles = existing_profiles(api, policy)
    # An X.509 certificate is public; its distribution private key never leaves the runner.
    print('SUG_EXISTING_PUBLIC_CERTIFICATE_DER=' + base64.b64encode(der).decode(), flush=True)
    status = {'authentication': 'EXISTING_BODY_SECRET_OK', 'existingKeyPair': 'MATCH',
              'newCertificates': 0, 'newProfiles': 0, 'uploads': 0,
              'apps': {app: {'existingTargetVerified': app in targets, 'existingProfileReusable': app in profiles}
                       for app in policy['apps']}}
    print('SUG_EXISTING_AUTH_PREFLIGHT=' + json.dumps(status, separators=(',', ':')), flush=True)
    if 'SWAG' not in targets:
        raise Stop('SWAG_EXISTING_INTERNAL_TARGET_NOT_VERIFIED')


if __name__ == '__main__':
    try:
        main()
    except Stop as error:
        print('SUG_STOP=' + str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('SUG_STOP=PREFLIGHT_PRIVATE_DIAGNOSTIC_WITHHELD', file=sys.stderr)
        sys.exit(1)
