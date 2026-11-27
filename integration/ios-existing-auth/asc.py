"""Existing BODY Apple authentication; never return credentials through job outputs."""
import base64
import json
import os
import pathlib
import re
import time
import urllib.error
import urllib.parse
import urllib.request

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec


class Stop(RuntimeError):
    pass


def existing_pem():
    raw = os.environ.get('ASC_API_KEY_P8', '').strip().strip('\"\'')
    if '-----BEGIN PRIVATE KEY-----' not in raw:
        try:
            raw = base64.b64decode(''.join(raw.split()), validate=True).decode()
        except (ValueError, UnicodeError):
            raise Stop('EXISTING_ASC_KEY_FORMAT') from None
    raw = raw.replace('\\r\\n', '\n').replace('\\n', '\n').replace('\r', '')
    start, end = '-----BEGIN PRIVATE KEY-----', '-----END PRIVATE KEY-----'
    if start not in raw or end not in raw:
        raise Stop('EXISTING_ASC_KEY_FORMAT')
    body = ''.join(raw.split(start, 1)[1].split(end, 1)[0].split())
    import textwrap
    pem = (start + '\n' + '\n'.join(textwrap.wrap(body, 64)) + '\n' + end + '\n').encode()
    key = serialization.load_pem_private_key(pem, password=None)
    if not isinstance(key, ec.EllipticCurvePrivateKey) or key.curve.name != 'secp256r1':
        raise Stop('EXISTING_ASC_KEY_TYPE')
    return pem


class Apple:
    def __init__(self):
        self.pem = existing_pem()

    def request(self, path, params=None, body=None):
        url = path if path.startswith('https://') else 'https://api.appstoreconnect.apple.com/v1' + path
        if urllib.parse.urlsplit(url).netloc != 'api.appstoreconnect.apple.com':
            raise Stop('APPLE_PAGINATION_HOST')
        if params:
            url += '?' + urllib.parse.urlencode(params)
        now = int(time.time())
        token = jwt.encode({'iss': os.environ['ASC_API_ISSUER_ID'], 'iat': now - 5,
                            'exp': now + 600, 'aud': 'appstoreconnect-v1'}, self.pem,
                           algorithm='ES256', headers={'kid': os.environ['ASC_API_KEY_ID'], 'typ': 'JWT'})
        if body is not None and not (path == '/profiles' or
                (path.startswith('/builds/') and path.endswith('/relationships/betaGroups'))):
            raise Stop('APPLE_MUTATION_OUTSIDE_APPROVAL')
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(url, data=data, method='GET' if body is None else 'POST',
                                     headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                raw = response.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as error:
            # Do not expose response bodies, tester/group identifiers, or bearer tokens.
            family = '.'.join(p.upper() for p in urllib.parse.urlsplit(url).path.split('/')
                              if p in ('apps', 'certificates', 'profiles', 'betaGroups', 'betaTesters', 'builds', 'buildBetaDetail', 'bundleIds'))
            codes = []
            try:
                for row in json.loads(error.read()).get('errors', []):
                    code = str(row.get('code', ''))
                    if re.fullmatch('[A-Z0-9_.-]{1,80}', code):
                        codes.append(code)
            except Exception:
                pass
            raise Stop('APPLE_HTTP_' + str(error.code) + '_' + family + '_' + '.'.join(codes)) from None

    def rows(self, path, params=None):
        result = []
        for _ in range(50):
            response = self.request(path, params)
            result.extend(response.get('data', []))
            path = response.get('links', {}).get('next')
            if not path:
                return result
            params = None
        raise Stop('APPLE_PAGINATION_LIMIT')


def existing_targets(api, policy):
    """Keep every name, email, group ID and tester ID in memory on the runner."""
    targets = {}
    for app in ('SWAG', 'WALK'):
        if app not in policy['apps']:
            continue
        config = policy['apps'][app]
        rows = api.rows('/apps', {'filter[bundleId]': config['bundle'], 'limit': 10})
        rows = [r for r in rows if r['attributes']['bundleId'] == config['bundle']]
        if len(rows) != 1:
            continue
        app_id = rows[0]['id']
        if config.get('appId') and config['appId'] != app_id:
            raise Stop('APP_ID_DIFFERS_FROM_APPROVAL')
        groups = api.rows('/apps/' + app_id + '/betaGroups', {'limit': 200})
        groups = [g for g in groups if g['attributes'].get('isInternalGroup')]
        if app == 'SWAG':
            # This group was explicitly specified by the user; never create or invite.
            groups = [g for g in groups if g['attributes']['name'] == 'SUG BODY TEST']
        else:
            prior = set()
            for build in api.rows('/builds', {'filter[app]': app_id, 'filter[version]': '6', 'limit': 200}):
                prior.update(g['id'] for g in api.rows('/betaGroups',
                    {'filter[builds]': build['id'], 'filter[isInternalGroup]': 'true', 'limit': 200}))
            groups = [g for g in groups if g['id'] in prior]
        candidates = []
        for group in groups:
            members = api.rows('/betaGroups/' + group['id'] + '/betaTesters', {'limit': 200})
            emails = {str(t['attributes'].get('email') or '').casefold() for t in members}
            emails.discard('')
            if not emails:
                continue
            if app == 'WALK':
                swag = targets.get('SWAG')
                if not swag or len(swag['memberEmails']) != 1 or not (emails & swag['memberEmails']):
                    continue
            candidates.append({'appId': app_id, 'groupId': group['id'], 'memberEmails': emails})
        if len(candidates) == 1:
            targets[app] = candidates[0]
    return targets


def next_build(api, app_id, minimum):
    rows = api.rows('/builds', {'filter[app]': app_id, 'limit': 200})
    values = [int(r['attributes']['version']) for r in rows if r['attributes']['version'].isascii()
              and r['attributes']['version'].isdigit()]
    return max(minimum, max(values, default=0) + 1)
