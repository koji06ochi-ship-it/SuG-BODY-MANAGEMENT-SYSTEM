"""Boot the FULL candidate app; verify its real server and WK navigation logs."""
import json,os,pathlib,subprocess,sys,time,urllib.request
app=sys.argv[1];assert app in {'GLOW','oTo'}
scheme={'GLOW':'SuGGLOW','oTo':'SuGoTo'}[app]
bundle={'GLOW':'jp.sugosaka.glow','oTo':'jp.sugosaka.oto'}[app]
port={'GLOW':5414,'oTo':5415}[app]
def run(*args,timeout=90):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=timeout).stdout
devices=json.loads(run('xcrun','simctl','list','devices','available','--json'))['devices']
choices=[d for runtime,group in devices.items() if '.iOS-' in runtime for d in group if d.get('isAvailable') and 'iPhone' in d['name']]
assert choices,'No available iPhone Simulator runtime; do not fake a launch result'
device=sorted(choices,key=lambda d:(d['state']!='Booted',d['name']))[0];udid=device['udid']
if device['state']!='Booted':run('xcrun','simctl','boot',udid)
run('xcrun','simctl','bootstatus',udid,'-b',timeout=180)
product=pathlib.Path(os.environ['RUNNER_TEMP'])/('sug-six-'+app+'-iphonesimulator')/'Build/Products/Debug-iphonesimulator'/(scheme+'.app')
assert product.is_dir(),product
run('xcrun','simctl','install',udid,str(product))
run('xcrun','simctl','launch',udid,bundle)
ready=False;events=[]
for attempt in range(12):
    try:
        with urllib.request.urlopen('http://127.0.0.1:'+str(port)+'/index.html',timeout=3) as r:ready=r.status==200
    except Exception:pass
    raw=run('xcrun','simctl','spawn',udid,'log','show','--last','2m','--style','json','--predicate','subsystem == "'+bundle+'" AND category == "startup"',timeout=25)
    try:events=[e.get('eventMessage','') for e in json.loads(raw)]
    except json.JSONDecodeError:events=[]
    if ready and any('stage=webview_ready' in e for e in events):break
    time.sleep(2)
assert ready,'Full app did not serve its bundled entry on its fixed loopback port'
assert any('stage=listener_ready' in e for e in events),'No listener-ready event from the actual app'
assert any('stage=webview_ready' in e for e in events),'No completed WKWebView navigation from the actual app'
print('ACTUAL_SIMULATOR_LAUNCH='+json.dumps({'app':app,'device':device['name'],'bundle':bundle,'port':port,'HTTP200':ready,'WKDidFinishObserved':True,'events':events,'physicalIPhoneVerified':False}),flush=True)
run('xcrun','simctl','terminate',udid,bundle)
# Re-launch without deleting/reinstalling the application or WK data store.
run('xcrun','simctl','launch',udid,bundle)
for attempt in range(10):
    try:
        with urllib.request.urlopen('http://127.0.0.1:'+str(port)+'/index.html',timeout=3) as r:
            if r.status==200:break
    except Exception:pass
    time.sleep(1)
else:raise AssertionError('Application failed to serve after terminate/relaunch')
print('ACTUAL_SIMULATOR_RELAUNCH='+json.dumps({'app':app,'HTTP200':True,'userRecordsModified':False,'inputAndRecordRestorationVerified':False,'physicalIPhoneVerified':False}),flush=True)
run('xcrun','simctl','terminate',udid,bundle)
