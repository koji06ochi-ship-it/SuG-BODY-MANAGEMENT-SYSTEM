"""Launch the actual SWAG app in iOS Simulator and fetch its real bundled TOP."""
import hashlib
import json
import pathlib
import plistlib
import subprocess
import time
import urllib.request

from asc import Stop


def command(args, log, timeout=180):
    with log.open('ab') as output:
        subprocess.run([str(a) for a in args], check=True, timeout=timeout,
                       stdout=output, stderr=subprocess.STDOUT)


def startup(project, temp, log):
    devices = json.loads(subprocess.check_output(['xcrun', 'simctl', 'list', 'devices', 'available', '-j']))
    candidates = [(runtime, d) for runtime, rows in devices['devices'].items()
                  if '.iOS-' in runtime for d in rows
                  if d.get('isAvailable') and d['name'].startswith('iPhone')]
    if not candidates:
        raise Stop('NO_INSTALLED_IPHONE_SIMULATOR_NO_DOWNLOAD_OR_CHARGE_ALLOWED')
    runtime, device = sorted(candidates, key=lambda row: row[0], reverse=True)[0]
    udid = device['udid']
    bundle = 'jp.sugosaka.member'
    derived = temp / 'swag-1008-simulator'
    try:
        if device['state'] != 'Booted':
            command(['xcrun', 'simctl', 'boot', udid], log)
        command(['xcrun', 'simctl', 'bootstatus', udid, '-b'], log)
        command(['xcodebuild', '-project', project / 'SuGBODY.xcodeproj', '-scheme', 'SuGBODY',
                 '-configuration', 'Release', '-sdk', 'iphonesimulator',
                 '-destination', 'id=' + udid, '-derivedDataPath', derived,
                 'CODE_SIGNING_ALLOWED=NO', 'CURRENT_PROJECT_VERSION=1008',
                 'MARKETING_VERSION=1.0.0', 'build'], log, timeout=480)
        app = derived / 'Build/Products/Release-iphonesimulator/SuGBODY.app'
        info = plistlib.loads((app / 'Info.plist').read_bytes())
        if info['CFBundleIdentifier'] != bundle or str(info['CFBundleVersion']) != '1008':
            raise Stop('SIMULATOR_BUILD_METADATA_DIFFERS')
        command(['xcrun', 'simctl', 'install', udid, app], log)
        command(['xcrun', 'simctl', 'launch', '--terminate-running-process', udid, bundle], log)
        # No fixture or replacement server: these responses come from the real app process.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        base = 'http://127.0.0.1:5411/'
        relative = 'apps/body/daily-preview/index.html'
        expected = (project / 'Resources/BodyFormal' / relative).read_bytes()
        deadline = time.monotonic() + 90
        while True:
            try:
                with opener.open(base + relative, timeout=3) as response:
                    status, top = response.status, response.read()
                break
            except Exception:
                if time.monotonic() >= deadline:
                    raise Stop('ACTUAL_IOS_APP_LOOPBACK_STARTUP_FAILED') from None
                time.sleep(1)
        if status != 200 or top != expected or b'data-sug-baby-zone' not in top:
            raise Stop('ACTUAL_IOS_APP_TOP_DIFFERS')
        for name in ('pinkman-baby-zone.js', 'baby-gold.jpeg'):
            path = 'apps/body/daily-preview/common/' + name
            with opener.open(base + path, timeout=10) as response:
                body = response.read()
                if response.status != 200 or body != (project / 'Resources/BodyFormal' / path).read_bytes():
                    raise Stop('ACTUAL_IOS_APP_BABY_ZONE_RESOURCE_FAILED')
        bound = subprocess.check_output(['lsof', '-nP', '-iTCP:5411', '-sTCP:LISTEN', '-Fn'], text=True)
        addresses = [line[1:] for line in bound.splitlines() if line.startswith('n')]
        if not addresses or any(address != '127.0.0.1:5411' for address in addresses):
            raise Stop('ACTUAL_IOS_APP_BIND_IS_NOT_FIXED_IPV4_LOOPBACK')
        print('SUG_SWAG1008_ACTUAL_IOS_STARTUP=' + json.dumps({
            'realAppLaunched': True, 'topHTTP': 200, 'topSHA256': hashlib.sha256(top).hexdigest(),
            'babyZoneResourcesServed': True, 'fixedIPv4LoopbackOnly': True,
            'build': '1008', 'physicalIPhoneVerified': False}, separators=(',', ':')), flush=True)
    finally:
        subprocess.run(['xcrun', 'simctl', 'terminate', udid, bundle], capture_output=True, timeout=30)
        subprocess.run(['xcrun', 'simctl', 'shutdown', udid], capture_output=True, timeout=45)
