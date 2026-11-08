"""Boot the FULL candidate app; verify its real server and WK navigation logs."""
import json,os,pathlib,re,subprocess,sys,time,urllib.request
if sys.argv[1]=='--inherit':
    app=sys.argv[2]
    names={'WAY':'way-confirmed','BODY':'body','eVo':'evo','WALK':'walk','GLOW':'glow'}
    assert app in names
    repository='koji06ochi-ship-it/SuG-BODY-MANAGEMENT-SYSTEM'
    previous=42464168841
    initial='6bdc50322e6a8dd02bf0aa9989fdf5090c6dcdb2'
    current=os.environ['GITHUB_SHA']
    assert re.fullmatch('[0-9a-f]{40}',current)
    def public_get(suffix):
        request=urllib.request.Request('https://api.github.com/repos/'+repository+suffix,headers={'Accept':'application/vnd.github+json','User-Agent':'SUG-approved-verification-inheritance'})
        with urllib.request.urlopen(request,timeout=30) as response:return json.loads(response.read())
    prior=public_get('/actions/runs/'+str(previous))
    assert prior['head_sha']==initial and prior['status']=='completed' and prior['conclusion']=='failure'
    assert prior['path']=='.github/workflows/ios-priority-five.yml'
    difference=public_get('/compare/'+initial+'...'+current)
    ci_only={'ci/sug-priority/test-simulator.py','.github/workflows/ios-priority-five.yml','ci/sug-priority/GlowPhotoProbe.swift','ci/sug-priority/test-webkit-photos.py'}
    assert difference['status']=='ahead' and difference['files'] and all(f['filename'] in ci_only for f in difference['files']),'App or resource changes prevent inheriting prior verification'
    jobs=public_get('/actions/runs/'+str(previous)+'/jobs')['jobs']
    matching=[j for j in jobs if j['name']==names[app]]
    assert len(matching)==1 and matching[0]['status']=='completed'
    job=matching[0]
    outcomes={s['name']:s.get('conclusion')=='success' for s in job.get('steps',[])}
    inherited={'reuse':job['conclusion']=='success','network':outcomes.get('Execute original and repaired Network.framework listeners',False),'simulator':outcomes.get('Full Simulator app launch and relaunch without deletion',False),'photos':outcomes.get('Actual macOS WebKit photo persistence and restore integration',False)}
    with open(os.environ['GITHUB_OUTPUT'],'a') as output:
        for key,value in inherited.items():output.write(key+'='+str(value).lower()+'\n')
    print('INHERITED_VERIFICATION='+json.dumps({'app':app,'previousRun':previous,'previousJob':job['id'],'applicationAndResourceTreeUnchanged':True,'checks':inherited,'freshRuntimeClaim':False}),flush=True)
    raise SystemExit(0)
app=sys.argv[1];assert app in {'BODY','eVo','WALK','GLOW'}
scheme={'BODY':'SuGBODY','eVo':'SuGeVo','WALK':'SuGWALK','GLOW':'SuGGLOW'}[app]
bundle={'BODY':'jp.sugosaka.member','eVo':'jp.sugosaka.evolink','WALK':'jp.sugosaka.walk','GLOW':'jp.sugosaka.glow'}[app]
port={'BODY':5411,'eVo':5412,'WALK':5413,'GLOW':5414}[app]
entry={'BODY':'/apps/body/daily-preview/index.html','eVo':'/top.html','WALK':'/walk-quest.html','GLOW':'/index.html'}[app]

def run(*args,timeout=90):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=timeout).stdout
devices=json.loads(run('xcrun','simctl','list','devices','available','--json'))['devices']
choices=[d for runtime,group in devices.items() if '.iOS-' in runtime for d in group if d.get('isAvailable') and 'iPhone' in d['name']]
assert choices,'No available iPhone Simulator runtime; do not fake a launch result'
device=sorted(choices,key=lambda d:(d['state']!='Booted',d['name']))[0];udid=device['udid']
if device['state']!='Booted':run('xcrun','simctl','boot',udid)
run('xcrun','simctl','bootstatus',udid,'-b',timeout=240)
product=pathlib.Path(os.environ['RUNNER_TEMP'])/('sug-six-'+app+'-iphonesimulator')/'Build/Products/Debug-iphonesimulator'/(scheme+'.app')
assert product.is_dir(),product
run('xcrun','simctl','install',udid,str(product),timeout=240)
logfile=pathlib.Path(os.environ['RUNNER_TEMP'])/('simulator-startup-'+app+'.log')
logoutput=logfile.open('w')
stream=subprocess.Popen(['xcrun','simctl','spawn',udid,'log','stream','--level','info','--style','compact','--predicate','subsystem == \"'+bundle+'\" AND category == \"startup\"'],stdout=logoutput,stderr=subprocess.STDOUT,text=True)
for attempt in range(30):
    if stream.poll() is not None:raise AssertionError('Simulator log reader exited before application launch')
    if 'Filtering the log data' in logfile.read_text(errors='replace'):break
    time.sleep(1)
else:raise AssertionError('Simulator log reader never became ready; application not launched')
launched=run('xcrun','simctl','launch',udid,bundle)
pid=re.search(r':\s*(\d+)\s*$',launched)
assert pid,'Simulator launch did not report an application PID'
pid=pid.group(1)
ready=False;events=[]
for attempt in range(45):
    try:
        with urllib.request.urlopen('http://127.0.0.1:'+str(port) +entry,timeout=3) as r:ready=r.status==200
    except Exception:pass
    streamed=logfile.read_text(errors='replace').splitlines()
    events=[line for line in streamed if 'sug_startup' in line]
    if ready and any('stage=webview_ready' in e for e in events):break
    time.sleep(2)
print('ACTUAL_SIMULATOR_OBSERVATION='+json.dumps({'app':app,'HTTP200':ready,'events':events,'streamExited':stream.poll(),'logTail':logfile.read_text(errors='replace').splitlines()[-12:]}),flush=True)
assert ready,'Full app did not serve its bundled entry on its fixed loopback port'
assert any('stage=webview_ready' in e for e in events),'No completed WKWebView navigation from the actual app'
# Read the actual application's listening socket instead of treating an INFO
# message dropped by unified logging as evidence that the listener failed.
# All selection filters are ANDed: this PID, this port, TCP LISTEN only.
def verify_binding(process_id):
    sockets=run('lsof','-nP','-a','-p',process_id,'-iTCP:'+str(port),'-sTCP:LISTEN','-Fpn')
    owners=[s[1:] for s in sockets.splitlines() if s.startswith('p')]
    endpoints=[s[1:] for s in sockets.splitlines() if s.startswith('n')]
    assert owners==[process_id] and endpoints and all(s=='127.0.0.1:'+str(port) for s in endpoints),'Actual app listener PID/address mismatch'
    return {'pid':process_id,'endpoints':endpoints,'loopbackOnly':True}
binding=verify_binding(pid)
print('ACTUAL_SIMULATOR_LAUNCH='+json.dumps({'app':app,'device':device['name'],'bundle':bundle,'port':port,'HTTP200':ready,'WKDidFinishObserved':True,'actualListenerBinding':binding,'listenerInfoLogObserved':any('stage=listener_ready' in e for e in events),'events':events,'physicalIPhoneVerified':False}),flush=True)
run('xcrun','simctl','terminate',udid,bundle)
# Re-launch without deleting/reinstalling the application or WK data store.
relaunched=run('xcrun','simctl','launch',udid,bundle)
new_pid=re.search(r':\s*(\d+)\s*$',relaunched)
assert new_pid and new_pid.group(1)!=pid,'Relaunch must create a new application process'
for attempt in range(10):
    try:
        with urllib.request.urlopen('http://127.0.0.1:'+str(port) +entry,timeout=3) as r:
            if r.status==200:break
    except Exception:pass
    time.sleep(1)
else:raise AssertionError('Application failed to serve after terminate/relaunch')
new_binding=verify_binding(new_pid.group(1))
print('ACTUAL_SIMULATOR_RELAUNCH='+json.dumps({'app':app,'HTTP200':True,'actualListenerBinding':new_binding,'userRecordsModified':False,'inputAndRecordRestorationVerified':False,'physicalIPhoneVerified':False}),flush=True)
run('xcrun','simctl','terminate',udid,bundle)

stream.terminate()
stream.wait(timeout=10)
logoutput.close()
