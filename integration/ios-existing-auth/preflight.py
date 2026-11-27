"""One real read-only Apple preflight; no tester data or artifacts are published."""
import base64
import json
import os
import pathlib
import shutil
import sys
from cryptography.hazmat.primitives import serialization

from asc import Apple, Stop, existing_targets
from identity import recover, live_certificate, existing_profiles
from hydrate import hydrate


HERE = pathlib.Path(__file__).resolve().parent


def main():
    filename = os.environ.get('SUG_POLICY_FILE', 'policy.json')
    if filename not in ('policy.json', 'swag-policy.json'):
        raise Stop('UNAPPROVED_POLICY_FILE')
    policy = json.loads((HERE / filename).read_text())
    api = Apple()
    private, leaf, _, _ = recover(policy)
    # Expose only this pinned certificate's PUBLIC DER, even if a later Apple permission check fails.
    print('SUG_EXISTING_PUBLIC_CERTIFICATE_DER=' + base64.b64encode(
        leaf.public_bytes(serialization.Encoding.DER)).decode(), flush=True)
    der = live_certificate(api, policy, leaf)
    targets = existing_targets(api, policy)
    profiles = existing_profiles(api, policy)
    if policy.get('currentInput'):
        destination = pathlib.Path(os.environ['RUNNER_TEMP']).resolve() / 'sug-current-input-preflight'
        if destination.exists():
            raise Stop('CURRENT_TRANSFER_DESTINATION_EXISTS')
        try:
            hydrate(private, policy, destination)
        finally:
            if destination.is_dir():
                shutil.rmtree(destination)
    # An X.509 certificate is public; its distribution private key never leaves the runner.
    status = {'authentication': 'EXISTING_BODY_SECRET_OK', 'existingKeyPair': 'MATCH',
              'newCertificates': 0, 'newProfiles': 0, 'uploads': 0,
              'currentSourceTransferVerified': bool(policy.get('currentInput')),
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
