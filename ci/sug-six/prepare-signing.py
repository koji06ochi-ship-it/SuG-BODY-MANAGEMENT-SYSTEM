"""One shared NEW distribution identity for the approved batch; no cleanup of old assets.
Reuses the existing EVOLINK request/token implementation. Not invoked by unsigned CI.
"""
import argparse, base64, importlib.util, json, os, secrets, subprocess, time
from pathlib import Path

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',required=True);parser.add_argument('--work',required=True)
    parser.add_argument('--apps-json',required=True);parser.add_argument('--approve-apple-signing',action='store_true')
    parser.add_argument('--preflight-only',action='store_true')
    parser.add_argument('--register-missing-bundles',action='store_true')
    parser.add_argument('--reuse-recovery',action='store_true')
    parser.add_argument('--reuse-profiles-json',default='{}')
    parser.add_argument('--replace-owned-failed-identity',action='store_true')
    args=parser.parse_args()
    if not args.approve_apple_signing or os.environ.get('SUG_SIGNING_APPROVED')!='yes':
        raise RuntimeError('Apple signing approval required; no credentials loaded or API called')
    if args.register_missing_bundles and not args.preflight_only:
        raise RuntimeError('Registration is isolated from archive/signing execution')
    if args.replace_owned_failed_identity and (args.preflight_only or args.reuse_recovery or os.environ.get('SUG_REPLACE_FAILED_IDENTITY_APPROVED')!='yes'):
        raise RuntimeError('Specific failed-resource replacement approval required')
    reused_profiles=json.loads(args.reuse_profiles_json)
    if reused_profiles and (not args.reuse_recovery or args.preflight_only or set(reused_profiles)!={'BODY','eVo','WALK','GLOW'} or reused_profiles!={'BODY':'3W4H35XA57','eVo':'FX9N4PLPA5','WALK':'22B4PZKN25','GLOW':'39XH2BFPRU'}):
        raise RuntimeError('Only the approved existing BODY/eVo/WALK/GLOW profiles may be reused')
    apps=json.loads(args.apps_json)
    if reused_profiles and set(apps)!=set(reused_profiles):raise RuntimeError('Unexpected existing-profile targets')
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
        if reused_profiles and method!='GET':raise RuntimeError('Existing-profile repair permits read-only Apple signing queries only')
        legacy.HEADERS['Authorization']='Bearer '+legacy.make_token()
        kwargs['attempts']=3 if method=='GET' else 1
        return original_request(method,path,**kwargs)
    legacy.request=request
    # App records must already exist; app creation is NOT guessed through an unsupported API.
    targets=[]
    preflight=[]
    for identity in identities:
        bundle=identity['bundleIdentifier'];legacy.BUNDLE_ID=bundle
        found=request('GET','/bundleIds',params={'filter[identifier]':bundle,'limit':10}).get('data',[])
        bundles=[b for b in found if b.get('attributes',{}).get('identifier')==bundle]
        created_bundle=False
        if not bundles and args.register_missing_bundles:
            if identity['app'] not in {'WALK','GLOW','oTo'}:raise RuntimeError('Outside confirmed missing-bundle scope')
            created=request('POST','/bundleIds',body={'data':{'type':'bundleIds','attributes':{'identifier':bundle,'name':'SUG '+identity['app'],'platform':'IOS'}}})['data']
            bundles=[created];created_bundle=True
            print('NEW_BUNDLE_ID='+identity['app']+':'+created['id'],flush=True)
            if identity['app']=='WALK':
                capability=request('POST','/bundleIdCapabilities',body={'data':{'type':'bundleIdCapabilities','attributes':{'capabilityType':'HEALTHKIT'},'relationships':{'bundleId':{'data':{'type':'bundleIds','id':created['id']}}}}})['data']
                print('NEW_WALK_HEALTHKIT_CAPABILITY_ID='+capability['id'],flush=True)
        apps_found=request('GET','/apps',params={'filter[bundleId]':bundle,'limit':10}).get('data',[])
        matches=[a for a in apps_found if a.get('attributes',{}).get('bundleId')==bundle]
        info={'app':identity['app'],'bundle':bundle,'bundleRegistered':len(bundles)==1,'appStoreId':matches[0]['id'] if len(matches)==1 else None}
        info['bundleCreatedThisRun']=created_bundle
        if len(matches)==1:
            builds=request('GET','/builds',params={'filter[app]':matches[0]['id'],'sort':'-uploadedDate','limit':200,'include':'buildBetaDetail,betaGroups'})
            versions=[b.get('attributes',{}).get('version','') for b in builds.get('data',[])]
            info['existingBuildNumbers']=versions
            if reused_profiles:
                number=json.loads(os.environ['BUILD_NUMBERS_JSON']).get(identity['app'])
                if number in versions:raise RuntimeError('Build number already exists; no automatic resend')
            numeric=[int(v) for v in versions if v.isascii() and v.isdigit()]
            info['proposedBuildNumber']=str(max([0]+numeric)+1)
            details={d['id']:d for d in builds.get('included',[]) if d['type']=='buildBetaDetails'}
            info['latestBuilds']=[{'id':b['id'],'version':b.get('attributes',{}).get('version'),'processingState':b.get('attributes',{}).get('processingState'),'usesNonExemptEncryption':b.get('attributes',{}).get('usesNonExemptEncryption'),'betaGroups':[g['id'] for g in b.get('relationships',{}).get('betaGroups',{}).get('data',[])],'betaDetail':details.get((b.get('relationships',{}).get('buildBetaDetail',{}).get('data') or {}).get('id'),{}).get('attributes',{})} for b in builds.get('data',[])[:3]]
        preflight.append(info)
        if len(matches)!=1 or len(bundles)!=1:
            if not args.preflight_only:raise RuntimeError('Required existing app/bundle record missing or ambiguous: '+bundle)
            continue
        bundle_resource=bundles[0]['id']
        targets.append({**identity,'bundleResourceId':bundle_resource,'appStoreId':matches[0]['id']})
    print('SUG_APPLE_PREFLIGHT='+json.dumps(preflight,separators=(',',':')))
    if args.preflight_only:
        print('APPLE_PREFLIGHT_COMPLETE; registration='+str(args.register_missing_bundles)+'; no certificate/profile/upload mutation')
        return
    recovery_key=None
    if os.environ.get('SUG_SIGNING_RECOVERY_APPROVED')=='yes':
        encoded=os.environ.get('SUG_SIX_BUILD_ASSET_KEY','')
        if len(encoded)!=64 or any(c not in '0123456789abcdef' for c in encoded):raise RuntimeError('Approved recovery requires the existing asset encryption key before certificate creation')
        recovery_key=bytes.fromhex(encoded)
    work.mkdir(mode=0o700)
    state={'format':'SUG_SIX_SIGNING_V1','certificateId':None,'profiles':[],'targets':targets,'oldAssetsDeleted':False}
    def save():
        (work/'state.json').write_text(json.dumps(state,indent=2));os.chmod(work/'state.json',0o600)
    save()
    if args.replace_owned_failed_identity:
        # Exact three resources created by our failed run. No discovery-based cleanup.
        failed_cert='23G3T6T342'
        owned=[('BODY','CV22FG9TNU'),('eVo','22URV7N638')]
        old=request('GET','/certificates/'+failed_cert)['data']
        if old['id']!=failed_cert or old['attributes']['certificateType']!='DISTRIBUTION':raise RuntimeError('Unexpected failed certificate; no deletion')
        checked=[]
        for app,pid in owned:
            item=request('GET','/profiles/'+pid,params={'include':'certificates,bundleId'})['data']
            if item['id']!=pid or item['attributes']['name']!='S.u.G '+app+' CI 42421228576':raise RuntimeError('Profile was not created by the failed run; no deletion')
            linked=item.get('relationships',{}).get('certificates',{}).get('data',[])
            if [c['id'] for c in linked]!=[failed_cert]:raise RuntimeError('Unexpected profile certificate relationship; no deletion')
            checked.append(pid)
        # Verify every resource before performing even the first irreversible operation.
        for pid in checked:
            request('DELETE','/profiles/'+pid,allow=(204,))
            print('REMOVED_OWN_FAILED_PROFILE_ID='+pid,flush=True)
        request('DELETE','/certificates/'+failed_cert,allow=(204,))
        state['replacedOwnedFailedIdentity']={'certificateId':failed_cert,'profiles':checked};save()
        print('REVOKED_OWN_FAILED_CERTIFICATE_ID='+failed_cert,flush=True)
    def run(*cmd,**kw):subprocess.run(cmd,check=True,**kw)
    key=work/'distribution.key.pem';csr=work/'distribution.csr.pem';der=work/'distribution.cer';cert=work/'distribution.cert.pem';p12=work/'distribution.p12'
    if args.reuse_recovery:
        if not recovery_key:raise RuntimeError('Reusing signing identity requires approved encrypted recovery')
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        from cryptography.hazmat.primitives.serialization import pkcs12,Encoding
        from datetime import datetime,timezone
        blob=base64.b64decode(os.environ.get('SUG_SIGNING_RECOVERY_CIPHERTEXT',''),validate=True)
        if len(blob)>65536 or blob[:6]!=b'SUGSR1':raise RuntimeError('Invalid recovery envelope')
        recovered=json.loads(AESGCM(recovery_key).decrypt(blob[6:18],blob[18:],b'SUG_SIGNING_RECOVERY_V1'))
        if recovered.get('format')!='SUG_SIGNING_RECOVERY_V1' or recovered.get('apiKeysIncluded') is not False:raise RuntimeError('Wrong recovery payload')
        cert_id=recovered['certificateId']
        if reused_profiles and cert_id!='LYFMNJP5Z5':raise RuntimeError('Existing signing certificate differs from the approved identity')
        if not cert_id.isalnum() or len(cert_id)>32:raise RuntimeError('Invalid recovered certificate ID')
        created=request('GET','/certificates/'+cert_id)['data']
        if created['attributes']['certificateType'] not in {'DISTRIBUTION','IOS_DISTRIBUTION'}:raise RuntimeError('Wrong certificate type')
        data=base64.b64decode(recovered['p12'],validate=True);password=recovered['password']
        private_key,leaf,extra=pkcs12.load_key_and_certificates(data,password.encode())
        if private_key is None or leaf is None or leaf.not_valid_after_utc<=datetime.now(timezone.utc):raise RuntimeError('Recovered identity missing or expired')
        if leaf.public_bytes(Encoding.DER)!=base64.b64decode(created['attributes']['certificateContent']):raise RuntimeError('Recovered identity differs from Apple certificate')
        if private_key.public_key().public_numbers()!=leaf.public_key().public_numbers():raise RuntimeError('Recovered key does not match certificate')
        p12.write_bytes(data);state['certificateId']=cert_id;save()
        print('REUSED_BATCH_CERTIFICATE_ID='+cert_id)
    else:
        run('openssl','genrsa','-out',str(key),'2048')
        run('openssl','req','-new','-key',str(key),'-out',str(csr),'-subj','/CN=S.u.G approved six-app batch/O=S.u.G OSAKA/C=JP')
        created=request('POST','/certificates',body={'data':{'type':'certificates','attributes':{'certificateType':'DISTRIBUTION','csrContent':csr.read_text()}}})['data']
        state['certificateId']=created['id'];save()
        print('NEW_BATCH_CERTIFICATE_ID='+str(created['id']))
        der.write_bytes(base64.b64decode(created['attributes']['certificateContent']))
        run('openssl','x509','-inform','DER','-in',str(der),'-out',str(cert))
        password=secrets.token_urlsafe(24);env={**os.environ,'SUG_P12_PASSWORD':password}
        run('openssl','pkcs12','-export','-out',str(p12),'-inkey',str(key),'-in',str(cert),'-passout','env:SUG_P12_PASSWORD',env=env)
    private=work/'private.json';private.write_text(json.dumps({'p12':str(p12),'password':password}));os.chmod(private,0o600)
    if recovery_key:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        payload=json.dumps({'format':'SUG_SIGNING_RECOVERY_V1','certificateId':state['certificateId'],'p12':base64.b64encode(p12.read_bytes()).decode(),'password':password,'createdByRun':os.environ.get('GITHUB_RUN_ID'),'apiKeysIncluded':False},separators=(',',':')).encode()
        nonce=secrets.token_bytes(12)
        (work/'signing-recovery.enc').write_bytes(b'SUGSR1'+nonce+AESGCM(recovery_key).encrypt(nonce,payload,b'SUG_SIGNING_RECOVERY_V1'))
        os.chmod(work/'signing-recovery.enc',0o600)
        print('ENCRYPTED_SIGNING_RECOVERY_READY; no API key, no plaintext private key in logs/artifacts')
    time.sleep(5)  # Existing propagation delay; never retry a possibly completed mutation.
    for target in targets:
        # Existing proven profile payload, with the correct app name, one POST per target.
        if reused_profiles:
            profile=request('GET','/profiles/'+reused_profiles[target['app']],params={'include':'certificates,bundleId'})['data']
            links=profile.get('relationships',{})
            if profile['attributes'].get('profileState')!='ACTIVE' or profile['attributes'].get('profileType')!='IOS_APP_STORE':raise RuntimeError('Existing profile is not active App Store distribution')
            if (links.get('bundleId',{}).get('data') or {}).get('id')!=target['bundleResourceId']:raise RuntimeError('Existing profile belongs to another bundle')
            if [c['id'] for c in links.get('certificates',{}).get('data',[])]!=[state['certificateId']]:raise RuntimeError('Existing profile certificate mismatch')
            print('REUSED_BATCH_PROFILE_ID='+target['app']+':'+profile['id'],flush=True)
        else:
            profile=request('POST','/profiles',body={'data':{'type':'profiles','attributes':{'name':'S.u.G '+target['app']+' CI '+str(os.environ.get('GITHUB_RUN_ID',int(time.time()))),'profileType':'IOS_APP_STORE'},'relationships':{'bundleId':{'data':{'type':'bundleIds','id':target['bundleResourceId']}},'certificates':{'data':[{'type':'certificates','id':created['id']}]}}}})['data']
        output=work/(target['app']+'.mobileprovision')
        state['profiles'].append({'app':target['app'],'id':profile['id'],'path':str(output)});save()
        if not reused_profiles:print('NEW_BATCH_PROFILE_ID='+target['app']+':'+str(profile['id']))
        output.write_bytes(base64.b64decode(profile['attributes']['profileContent']));os.chmod(output,0o600)
    print(json.dumps({'preparedTargets':[a['app'] for a in targets],'newCertificates':0 if args.reuse_recovery else 1,'oldAssetsDeleted':False,'privateFilesPublished':False}))

if __name__=='__main__':main()
