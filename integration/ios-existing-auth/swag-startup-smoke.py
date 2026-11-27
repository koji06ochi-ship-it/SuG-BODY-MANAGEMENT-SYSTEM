"""Launch the actual SWAG app in iOS Simulator and fetch its real bundled TOP."""
import hashlib
import json
import pathlib
import plistlib
import re
import subprocess
import time
import urllib.request

from asc import Stop


def command(args, log, phase, timeout=180):
    print('SUG_SWAG1008_PHASE=' + phase + '_START', flush=True)
    try:
        with log.open('ab') as output:
            subprocess.run([str(a) for a in args], check=True, timeout=timeout,
                           stdout=output, stderr=subprocess.STDOUT)
    except subprocess.TimeoutExpired:
        raise Stop('SWAG1008_' + phase + '_TIMEOUT_' + str(timeout) + 'S') from None
    except subprocess.CalledProcessError as error:
        raise Stop('SWAG1008_' + phase + '_EXIT_' + str(error.returncode)) from None
    print('SUG_SWAG1008_PHASE=' + phase + '_PASS', flush=True)


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
    print('SUG_SWAG1008_PHASE=INSTALLED_IPHONE_SIMULATOR_SELECTED', flush=True)
    try:
        if device['state'] != 'Booted':
            command(['xcrun', 'simctl', 'boot', udid], log, 'SIMULATOR_BOOT')
        command(['xcrun', 'simctl', 'bootstatus', udid, '-b'], log, 'SIMULATOR_BOOT_STATUS', timeout=300)
        command(['xcodebuild', '-project', project / 'SuGBODY.xcodeproj', '-scheme', 'SuGBODY',
                 '-configuration', 'Release', '-sdk', 'iphonesimulator',
                 '-destination', 'id=' + udid, '-derivedDataPath', derived,
                 'CODE_SIGNING_ALLOWED=NO', 'CURRENT_PROJECT_VERSION=1008',
                 'MARKETING_VERSION=1.0.0', 'build'], log, 'SIMULATOR_COMPILE', timeout=480)
        app = derived / 'Build/Products/Release-iphonesimulator/SuGBODY.app'
        if not (app / 'Info.plist').is_file():
            raise Stop('SWAG1008_SIMULATOR_PRODUCT_MISSING')
        info = plistlib.loads((app / 'Info.plist').read_bytes())
        if info['CFBundleIdentifier'] != bundle or str(info['CFBundleVersion']) != '1008':
            raise Stop('SIMULATOR_BUILD_METADATA_DIFFERS')
        command(['xcrun', 'simctl', 'install', udid, app], log, 'SIMULATOR_INSTALL')
        command(['xcrun', 'simctl', 'launch', '--terminate-running-process', udid, bundle], log, 'ACTUAL_APP_LAUNCH')
        # No fixture or replacement server: these responses come from the real app process.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        base = 'http://127.0.0.1:5411/'
        relative = 'apps/body/daily-preview/index.html'
        expected = (project / 'Resources/BodyFormal' / relative).read_bytes()
        print('SUG_SWAG1008_PHASE=ACTUAL_APP_TOP_HTTP_START', flush=True)
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
        print('SUG_SWAG1008_PHASE=ACTUAL_APP_TOP_HTTP_PASS', flush=True)
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
    except Stop:
        raise
    except Exception as error:
        kind = type(error).__name__
        kind = kind.upper() if re.fullmatch('[A-Za-z0-9_]{1,60}', kind) else 'UNKNOWN'
        raise Stop('SWAG1008_STARTUP_PROBE_EXCEPTION_' + kind) from None
    finally:
        # Cleanup must not replace the original boot/build/launch failure.
        for action, seconds in ((['terminate', udid, bundle], 30), (['shutdown', udid], 45)):
            try:
                subprocess.run(['xcrun', 'simctl', *action], capture_output=True, timeout=seconds)
            except subprocess.SubprocessError:
                print('SUG_SWAG1008_PHASE=SIMULATOR_CLEANUP_TIMEOUT_OR_FAILURE', flush=True)
