"""Upload one signed IPA; emit only fixed categories and numeric/Apple error codes."""
import hashlib
import json
import os
import plistlib
import re
import subprocess

from asc import Stop


def diagnosis(raw):
    text = raw.decode('utf-8', errors='replace')
    codes = set(re.findall(r'\bITMS-[0-9]{4,6}\b|\bENTITY_ERROR(?:\.[A-Z_]+)+\b', text))
    codes.update(re.findall(r'\b[Cc]ode["\x27]?\s*[:=]\s*["\x27]?(-?[0-9]{1,7})\b', text))
    codes.update(re.findall(r'\((-?[0-9]{3,7})\)', text))

    def visit(value):
        if isinstance(value, dict):
            for name, child in value.items():
                if str(name).lower() in ('code', 'errorcode', 'codenumber'):
                    candidate = str(child)
                    if re.fullmatch(r'-?[0-9]{1,7}|[A-Z][A-Z0-9_.-]{1,79}', candidate):
                        codes.add(candidate)
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    start, end = raw.find(b'<?xml'), raw.rfind(b'</plist>')
    if 0 <= start < end:
        try:
            visit(plistlib.loads(raw[start:end + len(b'</plist>')]))
        except (ValueError, plistlib.InvalidFileException):
            pass
    lower = text.lower()
    patterns = {
        'AUTHENTICATION': r'authenticat|unauthorized|api key|private key|token',
        'BUNDLE_VERSION': r'bundle version|cfbundleversion|already been used|duplicate',
        'SIGNING': r'certificate|provisioning|signature|code.?sign',
        'VALIDATION': r'validation failed|invalid binary|invalid bundle|missing purpose|invalid sdk',
        'CONNECTION': r'timed? ?out|connection (?:reset|refused)|bad gateway|service unavailable|status(?: code)?[: ]+50[0-9]',
    }
    categories = [name for name, pattern in patterns.items() if re.search(pattern, lower)]
    return {'codes': sorted(codes), 'categories': categories or ['UNCLASSIFIED']}


def upload(ipa, sha256, log):
    with ipa.open('rb') as handle:
        if hashlib.file_digest(handle, 'sha256').hexdigest() != sha256:
            raise Stop('SWAG1008_SIGNED_IPA_CHANGED_DO_NOT_UPLOAD')
    print('SUG_SWAG1008_PHASE=APPLE_UPLOAD_START', flush=True)
    try:
        with log.open('wb') as handle:
            result = subprocess.run([
                'xcrun', 'altool', '--upload-app', '--type', 'ios', '--file', str(ipa),
                '--apiKey', os.environ['ASC_API_KEY_ID'], '--apiIssuer', os.environ['ASC_API_ISSUER_ID'],
                '--output-format', 'xml'], stdout=handle, stderr=subprocess.STDOUT, timeout=600)
    except subprocess.TimeoutExpired:
        detail = diagnosis(log.read_bytes())
        detail['timedOut'] = True
        print('SUG_SWAG1008_UPLOAD_DIAGNOSIS=' + json.dumps(detail, separators=(',', ':')), flush=True)
        raise Stop('SWAG1008_UPLOAD_TIMEOUT_CHECK_APPLE_RECEIPT_DO_NOT_RESEND') from None
    if result.returncode:
        detail = diagnosis(log.read_bytes())
        detail['exitCode'] = result.returncode
        print('SUG_SWAG1008_UPLOAD_DIAGNOSIS=' + json.dumps(detail, separators=(',', ':')), flush=True)
        raise Stop('SWAG1008_UPLOAD_REJECTED_CHECK_SAFE_ERROR_CODES')
    print('SUG_SWAG1008_PHASE=APPLE_UPLOAD_PASS', flush=True)
