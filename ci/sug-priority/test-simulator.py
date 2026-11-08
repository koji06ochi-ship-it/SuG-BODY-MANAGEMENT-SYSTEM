"""Boot the FULL candidate app; verify its real server and WK navigation logs."""
import json,os,pathlib,re,subprocess,sys,time,urllib.request
if sys.argv[1]=='--inherit':
    app=sys.argv[2]
    names={'WAY':'way-confirmed','BODY':'body','eVo':'evo','WALK':'walk','GLOW':'glow'}
    assert app in names
    repository='koji06ochi-ship-it/SuG-BODY-MANAGEMENT-SYSTEM'
    previous=42473626293 if app=='WALK' else 42466358262
    initial='1e1a07577a9ba5655049a5b0b71d27858c9b0041' if app=='WALK' else 'a2c86dac09b06b051377a52ccf71c0761dca7812'
    current=os.environ['GITHUB_SHA']
    assert re.fullmatch('[0-9a-f]{40}',current)
    def public_get(suffix):
        token=os.environ.get('GITHUB_TOKEN','')
        if not token:raise RuntimeError('Read-only GitHub Actions token is required; anonymous API access is disabled')
        request=urllib.request.Request('https://api.github.com/repos/'+repository+suffix,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','User-Agent':'SUG-approved-verification-inheritance'})
        with urllib.request.urlopen(request,timeout=30) as response:return json.loads(response.read())
    prior=public_get('/actions/runs/'+str(previous))
    assert prior['head_sha']==initial and prior['status']=='completed' and prior['conclusion']=='failure'
    assert prior['path']=='.github/workflows/ios-priority-five.yml'
    difference=public_get('/compare/'+initial+'...'+current)
    ci_only={'ci/sug-priority/test-simulator.py','.github/workflows/ios-priority-five.yml','ci/sug-priority/GlowPhotoProbe.swift','ci/sug-priority/test-webkit-photos.py'}
    assert difference['status']=='ahead' and difference['files'] and all(f['filename'] in ci_only for f in difference['files']),'App or resource changes prevent inheriting prior verification'
    jobs=public_get('/actions/runs/'+str(previous)+'/jobs')['jobs']
    matching=[j for j in jobs if j['name']==names[app]]
    assert len(matching)==1 and matching[0]['status']=='completed' and matching[0]['conclusion']=='success','Prior app verification did not pass; no runtime repetition or delivery permitted'
    job=matching[0]
    outcomes={s['name']:s.get('conclusion')=='success' for s in job.get('steps',[])}
    inherited={'reuse':job['conclusion']=='success','network':outcomes.get('Execute original and repaired Network.framework listeners',False),'simulator':outcomes.get('Full Simulator app launch and relaunch without deletion',False),'photos':outcomes.get('Actual macOS WebKit photo persistence and restore integration',False)}
    if app=='WALK' and not inherited['network']:
        original=public_get('/actions/runs/42464168841')
        assert original['head_sha']=='6bdc50322e6a8dd02bf0aa9989fdf5090c6dcdb2' and original['status']=='completed'
        unchanged=public_get('/compare/'+original['head_sha']+'...'+current)
        assert unchanged['status']=='ahead' and all(f['filename'] in ci_only for f in unchanged['files'])
        original_jobs=public_get('/actions/runs/42464168841/jobs')['jobs']
        original_walk=[j for j in original_jobs if j['name']=='walk']
        assert len(original_walk)==1
        inherited['network']=any(step['name']=='Execute original and repaired Network.framework listeners' and step['conclusion']=='success' for step in original_walk[0]['steps'])
    with open(os.environ['GITHUB_OUTPUT'],'a') as output:
        for key,value in inherited.items():output.write(key+'='+str(value).lower()+'\n')
    print('INHERITED_VERIFICATION='+json.dumps({'app':app,'previousRun':previous,'previousJob':job['id'],'applicationAndResourceTreeUnchanged':True,'checks':inherited,'freshRuntimeClaim':False}),flush=True)
    raise SystemExit(0)
app=sys.argv[1];assert app in {'BODY','eVo','WALK','GLOW'}
scheme={'BODY':'SuGBODY','eVo':'SuGeVo','WALK':'SuGWALK','GLOW':'SuGGLOW'}[app]
bundle={'BODY':'jp.sugosaka.member','eVo':'jp.sugosaka.evolink','WALK':'jp.sugosaka.walk','GLOW':'jp.sugosaka.glow'}[app]
port={'BODY':5411,'eVo':5412,'WALK':5413,'GLOW':5414}[app]
entry={'BODY':'/apps/body/daily-preview/index.html','eVo':'/top.html','WALK':'/walk-quest.html','GLOW':'/index.html'}[app]

def run(*args,timeout=90):
    started=time.monotonic()
    try:
        return subprocess.run(args,check=True,capture_output=True,text=True,timeout=timeout).stdout
    except subprocess.TimeoutExpired:
        diagnosis={'app':app,'command':list(args[:3]),'timeoutSeconds':timeout,'classification':'simulator_command_timeout','appStartupFailureProven':False,'physicalIPhoneVerified':False}
        if args[:3]==('xcrun','simctl','launch'):
            try:
                with urllib.request.urlopen('http://127.0.0.1:'+str(port)+entry,timeout=3) as response:diagnosis['HTTP200']=response.status==200
            except Exception:diagnosis['HTTP200']=False
            evidence=pathlib.Path(os.environ['RUNNER_TEMP'])/('simulator-startup-'+app+'.log')
            diagnosis['startupEvents']=[line for line in evidence.read_text(errors='replace').splitlines() if 'sug_startup' in line][-20:] if evidence.exists() else []
            try:
                sockets=subprocess.run(['lsof','-nP','-iTCP:'+str(port),'-sTCP:LISTEN','-Fpn'],capture_output=True,text=True,timeout=10)
                diagnosis['loopbackSocketObservation']=sockets.stdout.splitlines()
            except Exception:diagnosis['loopbackSocketObservation']='unavailable'
        print('SIMULATOR_FAILURE_DIAGNOSTICS='+json.dumps(diagnosis),flush=True)
        raise
    finally:
        print('SIMULATOR_STAGE_TIMING='+json.dumps({'app':app,'command':list(args[:3]),'elapsedSeconds':round(time.monotonic()-started,3),'timeoutSeconds':timeout}),flush=True)
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
launched=run('xcrun','simctl','launch',udid,bundle,timeout=240)
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
relaunched=run('xcrun','simctl','launch',udid,bundle,timeout=240)
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
