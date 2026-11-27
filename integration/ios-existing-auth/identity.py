"""Recover the SAME distribution key; never create/revoke a certificate."""
import base64
import datetime
import hashlib
import json
import os
import pathlib
import plistlib
import re
import subprocess

from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.serialization import pkcs12

from asc import Stop


HERE = pathlib.Path(__file__).resolve().parent


def sha(data):
    return hashlib.sha256(data).hexdigest()


def recover(policy):
    # Read the ALREADY retained encrypted identity into runner memory only.
    # Never copy that credential-derived artifact into the proposed public branch.
    result = subprocess.run(['gh', 'api', 'repos/' + policy['repository'] + '/actions/jobs/' +
                             str(policy['recoverySourceJob']) + '/logs'], capture_output=True)
    if result.returncode:
        raise Stop('EXISTING_RECOVERY_READ_FAILED')
    candidates = re.findall(rb'SUG_SIGNING_RECOVERY_CIPHERTEXT=(U1VHU1Ix[A-Za-z0-9+/=]+)', result.stdout)
    blobs = [base64.b64decode(c, validate=True) for c in candidates]
    blobs = [b for b in blobs if sha(b) == policy['recoverySHA256']]
    if len(blobs) != 1:
        raise Stop('EXISTING_RECOVERY_INTEGRITY')
    blob = blobs[0]
    if sha(blob) != policy['recoverySHA256'] or blob[:6] != b'SUGSR1':
        raise Stop('EXISTING_RECOVERY_INTEGRITY')
    key = bytes.fromhex(os.environ['SUG_SIX_BUILD_ASSET_KEY'])
    data = json.loads(AESGCM(key).decrypt(blob[6:18], blob[18:], b'SUG_SIGNING_RECOVERY_V1'))
    if (data.get('format') != 'SUG_SIGNING_RECOVERY_V1' or data.get('apiKeysIncluded') is not False
            or data.get('certificateId') != policy['certificateId']):
        raise Stop('EXISTING_IDENTITY_DIFFERS')
    password = data['password'].encode()
    raw = base64.b64decode(data['p12'], validate=True)
    private, leaf, chain = pkcs12.load_key_and_certificates(raw, password)
    if not private or not leaf or sha(leaf.public_bytes(serialization.Encoding.DER)) != policy['certificateSHA256']:
        raise Stop('EXISTING_CERTIFICATE_DIFFERS')
    encode = lambda k: k.public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    if encode(private.public_key()) != encode(leaf.public_key()):
        raise Stop('EXISTING_KEY_PAIR_DIFFERS')
    return private, leaf, chain, password


def live_certificate(api, policy, leaf):
    row = api.request('/certificates/' + policy['certificateId'])['data']
    raw = base64.b64decode(row['attributes']['certificateContent'], validate=True)
    if sha(raw) != policy['certificateSHA256'] or raw != leaf.public_bytes(serialization.Encoding.DER):
        raise Stop('LIVE_CERTIFICATE_DIFFERS')
    if row['attributes']['certificateType'] not in ('DISTRIBUTION', 'IOS_DISTRIBUTION'):
        raise Stop('LIVE_CERTIFICATE_TYPE')
    now = datetime.datetime.now(datetime.timezone.utc)
    if not leaf.not_valid_before_utc <= now < leaf.not_valid_after_utc - datetime.timedelta(minutes=40):
        raise Stop('EXISTING_CERTIFICATE_EXPIRED')
    return raw


def decode_profile(blob):
    result = subprocess.run(['openssl', 'cms', '-verify', '-noverify', '-inform', 'DER'],
                            input=blob, capture_output=True)
    if result.returncode:
        raise Stop('PROFILE_CMS_INVALID')
    return plistlib.loads(result.stdout)


def validate_profile(blob, app, policy):
    p = decode_profile(blob)
    e = p.get('Entitlements', {})
    now = datetime.datetime.now(datetime.timezone.utc)
    if (p.get('TeamIdentifier') != [policy['team']] or
            p['ExpirationDate'].replace(tzinfo=datetime.timezone.utc) <= now + datetime.timedelta(minutes=40) or
            e.get('application-identifier') != policy['team'] + '.' + policy['apps'][app]['bundle'] or
            e.get('get-task-allow') is not False or e.get('com.apple.developer.healthkit') is not True or
            'ProvisionedDevices' in p or p.get('ProvisionsAllDevices') or
            not any(sha(c) == policy['certificateSHA256'] for c in p.get('DeveloperCertificates', []))):
        return None
    return p


def existing_profiles(api, policy):
    profiles = {}
    for row in api.rows('/profiles', {'filter[profileType]': 'IOS_APP_STORE', 'limit': 200}):
        if row['attributes'].get('profileState') != 'ACTIVE':
            continue
        blob = base64.b64decode(row['attributes']['profileContent'], validate=True)
        for app in policy['apps']:
            p = validate_profile(blob, app, policy)
            if p and (app not in profiles or p['ExpirationDate'] > profiles[app][1]['ExpirationDate']):
                profiles[app] = (blob, p)
    return profiles
