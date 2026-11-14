"""EVOLINK only: reuse existing identity/profile, verify IPA, upload, internal group."""
import base64, hashlib, io, json, os, pathlib, plistlib, shutil, subprocess, sys, time, zipfile
from datetime import datetime, timezone
import jwt, requests
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding, PublicFormat

BUNDLE='jp.sugosaka.evolink'
APP='6828511589'
GROUP='ce8dec95-58b3-4a93-96d9-87e1e719e6bb'
CERT='LYFMNJP5Z5'
SOURCE_SHA='b0292e4e9ad2286f56c8e3d06c1a80265ef927fcf8ab457ef968072439575851'
HERE=pathlib.Path(__file__).resolve().parent
WORK=pathlib.Path(os.environ['RUNNER_TEMP'])/'evolink-20261115'
PROOF=WORK/'proof'
NUMBER=os.environ['EVOLINK_BUILD_NUMBER']
def sha(b):return hashlib.sha256(b).hexdigest()
def save(name,data):
    PROOF.mkdir(parents=True,exist_ok=True)
    (PROOF/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def key():
    v=os.environ['SUG_SIX_BUILD_ASSET_KEY'];assert len(v)==64
    return bytes.fromhex(v)
def pem():
    v=os.environ['ASC_API_KEY_P8'].strip().replace('\\n','\n')
    return v.encode() if v.startswith('-----BEGIN ') else base64.b64decode(v,validate=True)
def api(method,path,body=None,params=None):
    now=int(time.time());token=jwt.encode({'iss':os.environ['ASC_API_ISSUER_ID'],'iat':now,'exp':now+600,'aud':'appstoreconnect-v1'},pem(),algorithm='ES256',headers={'kid':os.environ['ASC_API_KEY_ID'],'typ':'JWT'})
    r=requests.request(method,'https://api.appstoreconnect.apple.com/v1'+path,headers={'Authorization':'Bearer '+token},json=body,params=params,timeout=45)
    if r.status_code not in (200,201,204):
        codes=[e.get('code') for e in (r.json().get('errors',[]) if r.headers.get('content-type','').startswith('application/json') else [])]
        raise RuntimeError('Apple request failed: '+method+' '+path+' HTTP '+str(r.status_code)+' '+str(codes))
    return r.json() if r.content else {}
def all_data(path,params):
    result=api('GET',path,params=params);rows=result.get('data',[]);included=result.get('included',[])
    while result.get('links',{}).get('next'):
        url=result['links']['next'];assert url.startswith('https://api.appstoreconnect.apple.com/v1/')
        result=api('GET',url.split('/v1',1)[1]);rows+=result.get('data',[]);included+=result.get('included',[])
    return rows,included
def env(name,value):
    with open(os.environ['GITHUB_ENV'],'a',encoding='utf-8') as f:f.write(name+'='+str(value)+'\n')
def prepare():
    assert NUMBER.isascii() and NUMBER.isdigit() and int(NUMBER)>3
    assert not WORK.exists();WORK.mkdir(mode=0o700);PROOF.mkdir()
    blob=(HERE/'source.enc').read_bytes();assert blob[:7]==b'EVOSRC1'
    original=AESGCM(key()).decrypt(blob[7:19],blob[19:],b'EVOLINK_ORIGINAL_ZIP_20261115')
    assert sha(original)==SOURCE_SHA
    source=WORK/'source';source.mkdir()
    with zipfile.ZipFile(io.BytesIO(original)) as z:
        for entry in z.infolist():
            if not entry.filename.startswith('candidate/') or entry.is_dir():continue
            rel=pathlib.PurePosixPath(entry.filename[10:]);assert not rel.is_absolute() and '..' not in rel.parts and '\\' not in str(rel)
            p=source.joinpath(*rel.parts);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(entry))
    expected=json.loads((HERE/'candidate-manifest.json').read_text())
    for row in expected['files']:assert sha((source/row['path']).read_bytes())==row['sha256'],row['path']
    assert BUNDLE in (source/'project.yml').read_text()
    info_path=source/'SuGEvolink/Sources/Info.plist';original_info=info_path.read_bytes()
    old_info=plistlib.loads(original_info);new_info=plistlib.loads((HERE/'Info.plist').read_bytes())
    assert new_info=={**old_info,'NSHealthUpdateUsageDescription':'EVOLINKはヘルスケアのデータを読み取り表示します。ヘルスケアへのデータ書き込みは行いません。'}
    info_path.write_bytes((HERE/'Info.plist').read_bytes())
    save('release-overlay.json',{'file':'SuGEvolink/Sources/Info.plist','originalSHA256':sha(original_info),'releaseSHA256':sha(info_path.read_bytes()),'onlySemanticChange':'NSHealthUpdateUsageDescription','healthkitWriteAuthorizationAdded':False,'reason':'Apple upload validation 90683 requires purpose string'})
    rec=(HERE/'signing-recovery.enc').read_bytes();assert rec[:6]==b'SUGSR1'
    recovered=json.loads(AESGCM(key()).decrypt(rec[6:18],rec[18:],b'SUG_SIGNING_RECOVERY_V1'))
    assert recovered['certificateId']==CERT and recovered['apiKeysIncluded'] is False
    identity=base64.b64decode(recovered['p12'],validate=True);password=recovered['password']
    private,cert,extra=pkcs12.load_key_and_certificates(identity,password.encode())
    assert private and cert and cert.not_valid_after_utc>datetime.now(timezone.utc)
    assert private.public_key().public_bytes(Encoding.DER,PublicFormat.SubjectPublicKeyInfo)==cert.public_key().public_bytes(Encoding.DER,PublicFormat.SubjectPublicKeyInfo)
    apple_cert=api('GET','/certificates/'+CERT)['data']
    assert apple_cert['attributes']['certificateType'] in ('DISTRIBUTION','IOS_DISTRIBUTION')
    assert cert.public_bytes(Encoding.DER)==base64.b64decode(apple_cert['attributes']['certificateContent'])
    app=api('GET','/apps/'+APP)['data'];assert app['attributes']['bundleId']==BUNDLE
    builds,_=all_data('/builds',{'filter[app]':APP,'limit':200,'sort':'-uploadedDate'})
    assert NUMBER not in [x['attributes']['version'] for x in builds],'Build number already exists; upload not attempted'
    group=api('GET','/betaGroups/'+GROUP,params={'include':'app'})['data']
    assert group['attributes']['isInternalGroup'] is True and group['relationships']['app']['data']['id']==APP
    bundles=api('GET','/bundleIds',params={'filter[identifier]':BUNDLE})['data'];assert len(bundles)==1
    profiles,_=all_data('/profiles',{'limit':200,'include':'bundleId,certificates','filter[profileType]':'IOS_APP_STORE','filter[profileState]':'ACTIVE'})
    matches=[p for p in profiles if p.get('relationships',{}).get('bundleId',{}).get('data',{}).get('id')==bundles[0]['id'] and p['attributes']['profileType']=='IOS_APP_STORE' and p['attributes']['profileState']=='ACTIVE' and CERT in [c['id'] for c in p.get('relationships',{}).get('certificates',{}).get('data',[])]]
    assert matches,'No active existing EVOLINK profile for recovered certificate; no new asset created'
    profile=sorted(matches,key=lambda p:p['attributes']['expirationDate'],reverse=True)[0]
    raw_profile=base64.b64decode(profile['attributes']['profileContent'])
    profile_path=WORK/'existing.mobileprovision';profile_path.write_bytes(raw_profile)
    plist=plistlib.loads(subprocess.check_output(['security','cms','-D','-i',str(profile_path)]))
    team=plist['TeamIdentifier'][0];ent=plist['Entitlements']
    assert plist['ExpirationDate'].replace(tzinfo=timezone.utc)>datetime.now(timezone.utc)
    assert ent['application-identifier']==team+'.'+BUNDLE and ent.get('get-task-allow') is not True and ent.get('com.apple.developer.healthkit') is True
    p12=WORK/'distribution.p12';p12.write_bytes(identity);p12.chmod(0o600)
    print('::add-mask::'+password)
    for n,v in {'EVOLINK_SIGN_PASSWORD':password,'EVOLINK_TEAM':team,'EVOLINK_PROFILE':plist['Name'],'EVOLINK_PROFILE_UUID':plist['UUID']}.items():env(n,v)
    opts={'method':'app-store-connect','destination':'export','signingStyle':'manual','teamID':team,'provisioningProfiles':{BUNDLE:plist['Name']}}
    (WORK/'ExportOptions.plist').write_bytes(plistlib.dumps(opts))
    save('prepare.json',{'sourceArchiveSHA256':SOURCE_SHA,'originalFilesHashVerified':len(expected['files']),'bundleId':BUNDLE,'appId':APP,'buildNumber':NUMBER,'existingBuildNumbers':[b['attributes']['version'] for b in builds],'existingCertificateId':CERT,'existingProfileId':profile['id'],'existingProfileName':plist['Name'],'certificateSHA256':sha(cert.public_bytes(Encoding.DER)),'newCertificates':0,'newProfiles':0,'internalGroupId':GROUP})
    print('PREPARE_PASS: original candidate verified; existing identity/profile reused; unique build '+NUMBER)
def verify():
    ipa=list((WORK/'ipa').glob('*.ipa'));assert len(ipa)==1
    expected=json.loads((HERE/'candidate-manifest.json').read_text())
    with zipfile.ZipFile(ipa[0]) as z:
        roots=[n for n in z.namelist() if n.startswith('Payload/') and n.count('/')==2 and n.endswith('.app/Info.plist')];assert len(roots)==1
        prefix=roots[0][:-len('Info.plist')];info=plistlib.loads(z.read(roots[0]))
        assert info['CFBundleIdentifier']==BUNDLE and info['CFBundleVersion']==NUMBER and info['CFBundleShortVersionString']=='1.0.0'
        assert info.get('NSHealthShareUsageDescription') and info.get('NSHealthUpdateUsageDescription') and info.get('NSLocalNetworkUsageDescription')
        assert info['UISupportedInterfaceOrientations']==['UIInterfaceOrientationPortrait']
        checked=[]
        for row in expected['files']:
            if row['path'].startswith('SuGEvolink/WebContent/'):
                path=prefix+row['path'][len('SuGEvolink/'):]
                assert sha(z.read(path))==row['sha256'],path;checked.append(path)
        extracted=WORK/'verified-ipa';assert not extracted.exists();z.extractall(extracted)
    app=extracted/prefix;subprocess.run(['codesign','--verify','--deep','--strict',str(app)],check=True)
    result=subprocess.run(['codesign','-d','--entitlements',':-',str(app)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
    ent=plistlib.loads(result.stdout);assert ent['application-identifier'].endswith('.'+BUNDLE) and ent.get('com.apple.developer.healthkit') is True and ent.get('get-task-allow') is not True
    save('ipa-verification.json',{'bundleId':BUNDLE,'buildNumber':NUMBER,'version':info['CFBundleShortVersionString'],'ipaSHA256':sha(ipa[0].read_bytes()),'ipaBytes':ipa[0].stat().st_size,'bundledWebFilesHashVerified':len(checked),'strictSignatureVerified':True,'healthkit':True,'debugEntitlement':False,'portraitOnly':True,'candidateWebContentUnmodified':True,'releaseOverlayFiles':['SuGEvolink/Sources/Info.plist']})
    print('IPA_VERIFY_PASS: strict signature, bundle/build/permissions, all candidate WebContent bytes match')
def upload():
    assert (PROOF/'ipa-verification.json').exists()
    p=pathlib.Path.home()/'.appstoreconnect/private_keys'/('AuthKey_'+os.environ['ASC_API_KEY_ID']+'.p8');p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(pem());p.chmod(0o600)
    ipa=next((WORK/'ipa').glob('*.ipa'))
    try:
        with (PROOF/'apple-upload.log').open('w') as log:
            r=subprocess.run(['xcrun','altool','--upload-app','--type','ios','--file',str(ipa),'--apiKey',os.environ['ASC_API_KEY_ID'],'--apiIssuer',os.environ['ASC_API_ISSUER_ID']],stdout=log,stderr=subprocess.STDOUT)
        print((PROOF/'apple-upload.log').read_text());assert r.returncode==0,'Apple upload failed; no automatic retry'
        save('apple-upload.json',{'accepted':True,'buildNumber':NUMBER,'sourceArchiveSHA256':SOURCE_SHA})
    finally:p.unlink(missing_ok=True)
def processing():
    assert (PROOF/'apple-upload.json').exists()
    deadline=time.monotonic()+1200
    while time.monotonic()<deadline:
        rows=api('GET','/builds',params={'filter[app]':APP,'filter[version]':NUMBER,'include':'buildBetaDetail','limit':20})
        if rows['data']:
            assert len(rows['data'])==1;build=rows['data'][0];state=build['attributes']['processingState']
            save('apple-processing.json',{'buildId':build['id'],'buildNumber':NUMBER,'processingState':state,'internalDistributionComplete':False})
            if state in ('FAILED','INVALID'):raise RuntimeError('Apple processing '+state)
            if state=='VALID':break
        time.sleep(30)
    else:raise RuntimeError('Apple processing pending after bounded 20 minute wait; upload accepted separately')
    if build['attributes'].get('usesNonExemptEncryption') is None:
        # The app uses only system HTTPS and Keychain; same classification as existing EVOLINK.
        api('PATCH','/builds/'+build['id'],{'data':{'type':'builds','id':build['id'],'attributes':{'usesNonExemptEncryption':False}}})
    existing=api('GET','/builds/'+build['id']+'/betaGroups')['data']
    if GROUP not in [g['id'] for g in existing]:api('POST','/builds/'+build['id']+'/relationships/betaGroups',{'data':[{'type':'betaGroups','id':GROUP}]})
    groups=api('GET','/builds/'+build['id']+'/betaGroups')['data'];assert GROUP in [g['id'] for g in groups]
    details=api('GET','/builds/'+build['id'],params={'include':'buildBetaDetail'})
    detail=next((d['attributes'] for d in details.get('included',[]) if d['type']=='buildBetaDetails'),{})
    complete=detail.get('internalBuildState')=='IN_BETA_TESTING'
    save('apple-processing.json',{'buildId':build['id'],'buildNumber':NUMBER,'processingState':'VALID','groupId':GROUP,'groupAttached':True,'betaDetail':detail,'internalDistributionComplete':complete,'appStoreSubmission':False,'externalTestersAdded':0})
    print('APPLE_PROCESSING_VALID; existing internal group attached; internal state='+str(detail.get('internalBuildState')))
def preserve():
    output=HERE/'results'/('build-'+NUMBER);output.mkdir(parents=True,exist_ok=True)
    for p in PROOF.glob('*'):
        if p.is_file() and p.suffix in ('.json','.log','.txt'):shutil.copyfile(p,output/p.name)
    for ipa in (WORK/'ipa').glob('*.ipa'):
        nonce=os.urandom(12);(output/'EVOLINK.ipa.enc').write_bytes(b'EVIPA1'+nonce+AESGCM(key()).encrypt(nonce,ipa.read_bytes(),b'EVOLINK_IPA_20261115'))
    print('Preserved sanitized proof and encrypted IPA only; no signing credentials or API key included')
if __name__=='__main__':globals()[sys.argv[1]]()
