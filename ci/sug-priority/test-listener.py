"""Real macOS Network.framework listener tests. Never reports an iPhone PASS."""
import pathlib,subprocess,json,sys,os,time,select,urllib.request,urllib.error

root=pathlib.Path(sys.argv[1]).resolve();app=sys.argv[2]
assert app in {'BODY','eVo','WALK','GLOW'}
# Separate fixture ports avoid contaminating the full Simulator app's fixed origin.
port={'BODY':15411,'eVo':15412,'WALK':15413,'GLOW':15414}[app]
work=pathlib.Path(os.environ['RUNNER_TEMP'])/('listener-probe-'+app)
work.mkdir()
(work/'Fixture').mkdir();(work/'Fixture/index.html').write_text('loopback fixture',encoding='utf-8')
(work/'EmptyFixture').mkdir()
here=pathlib.Path(__file__).resolve().parent
for label,source in [('baseline',root/'ci/priority-baseline'/app/'BundleHTTPServer.swift'),('candidate',root/app/'iOS/Sources/BundleHTTPServer.swift')]:
    defines=['-D','REPAIRED'] if label=='candidate' else []
    subprocess.run(['xcrun','swiftc','-swift-version','5',*defines,str(source),str(here.parent/'sug-loopback/ListenerProbe.swift'),'-o',str(work/label)],check=True,timeout=90)

def launch(label,folder='Fixture',mode='serve'):
    p=subprocess.Popen([str(work/label),folder,str(port),mode],stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
    deadline=time.monotonic()+35
    while time.monotonic()<deadline:
        available,_,_=select.select([p.stdout],[],[],1)
        if available:
            line=p.stdout.readline()
            if line.startswith('{'):return p,json.loads(line)
        if p.poll() is not None:break
    p.terminate();p.wait(timeout=10)
    raise AssertionError('Listener startup did not produce a bounded result')

def end(p):
    if p.poll() is None:p.terminate()
    p.wait(timeout=10)

baseline,result=launch('baseline',mode='observe');end(baseline)
print('BASELINE_NETWORK_OBSERVATION='+json.dumps({'app':app,**result}),flush=True)
candidate=None;outcomes=[]
try:
    candidate,result=launch('candidate');assert result['state']=='ready',result
    outcomes.append('candidate_listener_ready')
    listing=subprocess.run(['lsof','-a','-nP','-p',str(candidate.pid),'-iTCP:'+str(port),'-sTCP:LISTEN','-Fn'],capture_output=True,text=True,check=True).stdout
    endpoints=[s[1:] for s in listing.splitlines() if s.startswith('n')]
    assert endpoints and all(x=='127.0.0.1:'+str(port) for x in endpoints),endpoints
    outcomes.append('actual_listener_loopback_only')
    def http(path,expected,method='GET',headers=None):
        req=urllib.request.Request('http://127.0.0.1:'+str(port)+path,method=method,headers=headers or {})
        try:r=urllib.request.urlopen(req,timeout=5)
        except urllib.error.HTTPError as failure:r=failure
        with r:
            body=r.read();assert r.status==expected,(path,r.status)
            return body,r.headers
    body,_=http('/index.html',200);assert body==b'loopback fixture';outcomes.append('HTTP_GET_200')
    body,headers=http('/index.html',200,method='HEAD');assert not body and headers['Content-Length']=='16';outcomes.append('HTTP_HEAD_200')
    http('/not-bundled.css',404);outcomes.append('missing_resource_HTTP_404')
    http('/api/test',503);outcomes.append('real_API_route_remains_disabled')
    http('/%2e%2e/private-records',400);outcomes.append('path_traversal_rejected')
    http('/index.html',403,headers={'Host':'untrusted.example'});outcomes.append('untrusted_host_rejected')
    if app=='GLOW':
        body,_=http('/index.html',206,headers={'Range':'bytes=0-3'});assert body==b'loop';outcomes.append('byte_range_206')
    collision,observed=launch('candidate',mode='observe');end(collision)
    assert observed['state']=='error_reported' and 'fault=port_in_use' in observed['diagnostics'],observed
    outcomes.append('occupied_port_classified_without_wildcard_fallback')
finally:
    if candidate:end(candidate)
for folder,fault in [('AbsentFixture','bundle_directory_missing'),('EmptyFixture','bundle_entry_missing')]:
    missing,observed=launch('candidate',folder,mode='observe');end(missing)
    assert observed['state']=='error_reported' and 'fault='+fault in observed['diagnostics'],observed
    outcomes.append('missing_'+folder+'_classified')
print('ACTUAL_MAC_NETWORK_RESULTS='+json.dumps({'app':app,'checks':outcomes,'count':len(outcomes),'physicalIPhoneVerified':False}),flush=True)
