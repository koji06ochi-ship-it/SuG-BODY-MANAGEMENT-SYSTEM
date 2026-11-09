"""Actual changed apps only. Pending Mac/Simulator execution; not an iPhone test."""
import json,os,pathlib,re,subprocess,sys,time,urllib.request,urllib.error
urllib.request.install_opener(urllib.request.build_opener(urllib.request.ProxyHandler({})))
app=sys.argv[1];assert app in {'BODY','eVo','WALK'}
scheme={'BODY':'SuGBODY','eVo':'SuGeVo','WALK':'SuGWALK','GLOW':'SuGGLOW'}[app]
bundle={'BODY':'jp.sugosaka.member','eVo':'jp.sugosaka.evolink','WALK':'jp.sugosaka.walk','GLOW':'jp.sugosaka.glow'}[app]
port={'BODY':5411,'eVo':5412,'WALK':5413,'GLOW':5414}[app]
entry={'BODY':'/apps/body/daily-preview/index.html','eVo':'/top.html','WALK':'/walk-quest.html','GLOW':'/index.html'}[app]


def probe_http(app, port, entry, phase, attempt, timeout=3):
    """Read static loopback entry only. No proxies, redirects, response body or headers in logs."""
    class RefuseRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs): return None
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}), RefuseRedirect)
    started=time.monotonic()
    result={'app':app,'phase':phase,'attempt':attempt,'HTTP200':False,'HTTPStatus':None}
    try:
        if not entry.startswith('/') or entry.startswith('//') or any(c in entry for c in ['\\','\r','\n']):
            raise ValueError('Invalid fixed local entry')
        with opener.open('http://127.0.0.1:'+str(port)+entry,timeout=timeout) as response:
            result.update(HTTPStatus=response.status,HTTP200=response.status==200)
    except urllib.error.HTTPError as error:
        result.update(HTTPStatus=error.code,exceptionType=type(error).__name__,classification='http_status')
        error.close()
    except urllib.error.URLError as error:
        reason=error.reason
        result.update(exceptionType=type(error).__name__,reasonType=type(reason).__name__,errno=getattr(reason,'errno',None),reason=str(reason)[:200],classification='transport_error')
    except (TimeoutError, OSError, ValueError) as error:
        result.update(exceptionType=type(error).__name__,errno=getattr(error,'errno',None),reason=str(error)[:200],classification='timeout' if isinstance(error,TimeoutError) else 'transport_error')
    result['elapsedMs']=round((time.monotonic()-started)*1000,2)
    print('SIMULATOR_HTTP_PROBE='+json.dumps(result),flush=True)
    return result

def socket_observation(process_id, port):
    try:
        r=subprocess.run(['lsof','-nP','-a','-p',process_id,'-iTCP:'+str(port),'-sTCP:LISTEN','-Fpn'],capture_output=True,text=True,timeout=10)
        owners=[s[1:] for s in r.stdout.splitlines() if s.startswith('p')]
        endpoints=[s[1:] for s in r.stdout.splitlines() if s.startswith('n')]
        verified=r.returncode==0 and owners==[process_id] and bool(endpoints) and all(s in {'127.0.0.1:'+str(port),'[::1]:'+str(port)} for s in endpoints)
        return {'pid':process_id,'returncode':r.returncode,'endpoints':endpoints,'loopbackOnly':verified}
    except (OSError,subprocess.TimeoutExpired) as error:
        return {'pid':process_id,'loopbackOnly':False,'exceptionType':type(error).__name__,'errno':getattr(error,'errno',None)}

def native_readiness(events):
    def present(stage,state,status):
        return any('stage='+stage+' ' in e and 'state='+state+' ' in e and ('status='+str(status)+' ' in e or e.endswith('status='+str(status))) for e in events)
    return {'nativeHTTP200':present('local_http_result','verified',200),'WKDidFinishHTTP200':present('webview_ready','finished',200),'formalDocumentReady':present('webview_document_ready','verified',200)}

def collect_startup(app,port,entry,phase,logfile,process_id,stream,max_attempts=45,pause_seconds=2):
    ready=False;events=[];host_attempts=[];native={}
    for attempt in range(max_attempts):
        host=probe_http(app,port,entry,phase,attempt+1)
        host_attempts.append(host);ready=ready or host['HTTP200']
        events=[line for line in logfile.read_text(errors='replace').splitlines() if 'sug_startup' in line and re.search(r'\['+re.escape(process_id)+r'[:\]]',line)]
        native=native_readiness(events)
        if all(native.values()):break
        failed_stages=['resource_check','listener_create','listener_state','local_http_probe','local_http_result']
        if stream.poll() is not None or any((any('stage='+s+' ' in e for s in failed_stages) and 'state=failed ' in e) or 'stage=webview_provisional_failed ' in e or 'stage=webview_navigation_failed ' in e or 'stage=webview_process_terminated ' in e or ('stage=webview_document_ready ' in e and 'state=unverified ' in e) for e in events):break
        time.sleep(pause_seconds)
    sockets=socket_observation(process_id,port)
    observation={'app':app,'phase':phase,'MacHTTP200':ready,**native,'hostHTTPAttempts':host_attempts,'actualListenerBinding':sockets,'events':events,'streamExited':stream.poll(),'physicalIPhoneVerified':False}
    print('ACTUAL_SIMULATOR_OBSERVATION='+json.dumps(observation),flush=True)
    assert all(native.values()),'App-internal HTTP200 + WK HTTP200/didFinish + formal DOM ready are required; Mac probe alone cannot pass'
    assert sockets['loopbackOnly'],'Actual app listener PID/address mismatch'
    return observation


def run(*args,timeout=90):
    started=time.monotonic()
    try:
        return subprocess.run(args,check=True,capture_output=True,text=True,timeout=timeout).stdout
    except subprocess.TimeoutExpired:
        diagnosis={'app':app,'command':list(args[:3]),'timeoutSeconds':timeout,'classification':'simulator_command_timeout','appStartupFailureProven':False,'physicalIPhoneVerified':False}
        if args[:3]==('xcrun','simctl','launch'):
            diagnosis['hostHTTP']=probe_http(app,port,entry,'launch_timeout',1)
            evidence=pathlib.Path(os.environ['RUNNER_TEMP'])/('simulator-startup-'+app+'.log')
            diagnosis['startupEvents']=[line for line in evidence.read_text(errors='replace').splitlines() if 'sug_startup' in line][-20:] if evidence.exists() else []
            try:
                sockets=subprocess.run(['lsof','-nP','-iTCP:'+str(port),'-sTCP:LISTEN','-Fpn'],capture_output=True,text=True,timeout=10)
                diagnosis['loopbackSocketObservation']=sockets.stdout.splitlines()
            except (OSError,subprocess.TimeoutExpired) as error:diagnosis['loopbackSocketObservation']={'exceptionType':type(error).__name__,'errno':getattr(error,'errno',None)}
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
try:
    for attempt in range(30):
        if stream.poll() is not None:raise AssertionError('Simulator log reader exited before application launch')
        if 'Filtering the log data' in logfile.read_text(errors='replace'):break
        time.sleep(1)
    else:raise AssertionError('Simulator log reader never became ready; application not launched')
    launched=run('xcrun','simctl','launch',udid,bundle,timeout=240)
    pid=re.search(r':\s*(\d+)\s*$',launched)
    assert pid,'Simulator launch did not report an application PID'
    pid=pid.group(1)
    observation=collect_startup(app,port,entry,'first_launch',logfile,pid,stream)
    print('ACTUAL_SIMULATOR_LAUNCH='+json.dumps(observation),flush=True)
    run('xcrun','simctl','terminate',udid,bundle)
    # Re-launch without deleting/reinstalling the application or WK data store.
    relaunched=run('xcrun','simctl','launch',udid,bundle,timeout=240)
    new_pid=re.search(r':\s*(\d+)\s*$',relaunched)
    assert new_pid and new_pid.group(1)!=pid,'Relaunch must create a new application process'
    # Filter each phase to the newly reported PID; preserve all prior evidence.
    observation=collect_startup(app,port,entry,'relaunch',logfile,new_pid.group(1),stream,max_attempts=10,pause_seconds=1)
    print('ACTUAL_SIMULATOR_RELAUNCH='+json.dumps(observation),flush=True)
    run('xcrun','simctl','terminate',udid,bundle)
finally:
    stream.terminate()
    try:
        stream.wait(timeout=10)
    except subprocess.TimeoutExpired:
        print("SIMULATOR_LOG_READER_CLEANUP=timeout; own reader only",flush=True)
        stream.kill(); stream.wait(timeout=5)
    logoutput.close()
