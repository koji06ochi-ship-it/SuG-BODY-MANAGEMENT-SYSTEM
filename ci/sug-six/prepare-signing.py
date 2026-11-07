"""One shared NEW distribution identity for the approved batch; no cleanup of old assets.
Reuses the existing EVOLINK request/token implementation. Not invoked by unsigned CI.
"""
import argparse, base64, importlib.util, json, os, secrets, subprocess, time
from pathlib import Path

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',required=True);parser.add_argument('--work',required=True)
    parser.add_argument('--apps-json',required=True);parser.add_argument('--approve-apple-signing',action='store_true')
    args=parser.parse_args()
    if not args.approve_apple_signing or os.environ.get('SUG_SIGNING_APPROVED')!='yes':
        raise RuntimeError('Apple signing approval required; no credentials loaded or API called')
    apps=json.loads(args.apps_json)
    allowed={'BODY','eVo','WALK','WAY','GLOW','oTo'}
    if not apps or len(apps)>6 or len(set(apps))!=len(apps) or any(a not in allowed for a in apps):
        raise RuntimeError('Unexpected signing targets')
    root=Path(args.root).resolve();work=Path(args.work).resolve()
    runner=Path(os.environ['RUNNER_TEMP']).resolve()
    if not work.is_relative_to(runner) or work==runner or work.exists():
        raise RuntimeError('Use a NEW RUNNER_TEMP subdirectory')
    identities=[]
    for app in apps:
        identity=json.loads((root/app/'IDENTITY.json').read_text())
        if app=='WAY' and 'WAY_SOURCE_MISSING' in (root/app/'iOS/Sources/WAYSourceMissing.swift').read_text():
            raise RuntimeError('WAY body missing; never sign a placeholder')
        if identity.get('app')!=app:raise RuntimeError('Identity mismatch')
        identities.append(identity)
    # Existing account secret only; do not generate a replacement Apple API key.
    raw=os.environ['ASC_API_KEY_P8'].strip().replace('\\n','\n')
    pem=raw.encode() if raw.startswith('-----BEGIN ') else base64.b64decode(raw,validate=True)
    if b'PRIVATE KEY-----' not in pem:raise RuntimeError('Existing Apple key format invalid')
    os.environ['ASC_API_KEY_P8_BASE64']=base64.b64encode(pem).decode()
    module_path=Path(__file__).with_name('legacy-signing-reference.py')
    spec=importlib.util.spec_from_file_location('sug_legacy',module_path);legacy=importlib.util.module_from_spec(spec);spec.loader.exec_module(legacy)
    original_request=legacy.request
    def request(method,path,**kwargs):
        legacy.HEADERS['Authorization']='Bearer '+legacy.make_token()
        kwargs['attempts']=3 if method=='GET' else 1
        return original_request(method,path,**kwargs)
    legacy.request=request
    # App records must already exist; app creation is NOT guessed through an unsupported API.
    targets=[]
    for identity in identities:
        bundle=identity['bundleIdentifier'];legacy.BUNDLE_ID=bundle
        bundle_resource=legacy.find_bundle_id()
        apps_found=request('GET','/apps',params={'filter[bundleId]':bundle,'limit':10}).get('data',[])
        matches=[a for a in apps_found if a.get('attributes',{}).get('bundleId')==bundle]
        if len(matches)!=1:raise RuntimeError('App Store Connect app record missing or ambiguous: '+bundle)
        targets.append({**identity,'bundleResourceId':bundle_resource,'appStoreId':matches[0]['id']})
    work.mkdir(mode=0o700)
    state={'format':'SUG_SIX_SIGNING_V1','certificateId':None,'profiles':[],'targets':targets,'oldAssetsDeleted':False}
    def save():
        (work/'state.json').write_text(json.dumps(state,indent=2));os.chmod(work/'state.json',0o600)
    save()
    def run(*cmd,**kw):subprocess.run(cmd,check=True,**kw)
    key=work/'distribution.key.pem';csr=work/'distribution.csr.pem';der=work/'distribution.cer';cert=work/'distribution.cert.pem';p12=work/'distribution.p12'
    run('openssl','genrsa','-out',str(key),'2048')
    run('openssl','req','-new','-key',str(key),'-out',str(csr),'-subj','/CN=S.u.G approved six-app batch/O=S.u.G OSAKA/C=JP')
    created=request('POST','/certificates',body={'data':{'type':'certificates','attributes':{'certificateType':'DISTRIBUTION','csrContent':csr.read_text()}}})['data']
    state['certificateId']=created['id'];save()
    print('NEW_BATCH_CERTIFICATE_ID='+str(created['id']))
    der.write_bytes(base64.b64decode(created['attributes']['certificateContent']))
    run('openssl','x509','-inform','DER','-in',str(der),'-out',str(cert))
    password=secrets.token_urlsafe(24);env={**os.environ,'SUG_P12_PASSWORD':password}
    run('openssl','pkcs12','-export','-out',str(p12),'-inkey',str(key),'-in',str(cert),'-passout','env:SUG_P12_PASSWORD',env=env)
    time.sleep(5)  # Existing propagation delay; never retry a possibly completed mutation.
    for target in targets:
        # Existing proven profile payload, with the correct app name, one POST per target.
        profile=request('POST','/profiles',body={'data':{'type':'profiles','attributes':{'name':'S.u.G '+target['app']+' CI '+str(os.environ.get('GITHUB_RUN_ID',int(time.time()))),'profileType':'IOS_APP_STORE'},'relationships':{'bundleId':{'data':{'type':'bundleIds','id':target['bundleResourceId']}},'certificates':{'data':[{'type':'certificates','id':created['id']}]}}}})['data']
        output=work/(target['app']+'.mobileprovision')
        state['profiles'].append({'app':target['app'],'id':profile['id'],'path':str(output)});save()
        print('NEW_BATCH_PROFILE_ID='+target['app']+':'+str(profile['id']))
        output.write_bytes(base64.b64decode(profile['attributes']['profileContent']));os.chmod(output,0o600)
    private=work/'private.json';private.write_text(json.dumps({'p12':str(p12),'password':password}));os.chmod(private,0o600)
    print(json.dumps({'preparedTargets':[a['app'] for a in targets],'newCertificates':1,'oldAssetsDeleted':False,'privateFilesPublished':False}))

if __name__=='__main__':main()
