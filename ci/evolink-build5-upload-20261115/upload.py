"""Resume the approved signed IPA. No source build, signing changes, or review submission."""
import importlib.util, json, os, pathlib, sys, time
import requests

HERE=pathlib.Path(__file__).resolve().parent
SPEC=importlib.util.spec_from_file_location('evolink_existing_release',HERE.parent/'evolink-build5-20261115'/'release.py')
RELEASE=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(RELEASE)
EXPECTED='ffeeb95a0c13863af8eefd09857e93ccaff804ebbd01c646830293e4e158a6c4'
SIZE=16213992

def build5():
    response=RELEASE.api('GET','/builds',params={'filter[app]':RELEASE.APP,'filter[version]':'5','include':'buildBetaDetail,preReleaseVersion','limit':20})
    versions={r['id']:r['attributes']['version'] for r in response.get('included',[]) if r['type']=='preReleaseVersions'}
    rows=[]
    for build in response['data']:
        identifier=build.get('relationships',{}).get('preReleaseVersion',{}).get('data',{}).get('id')
        version=versions.get(identifier)
        if version is None:version=RELEASE.api('GET','/builds/'+build['id']+'/preReleaseVersion')['data']['attributes']['version']
        if version=='1.0.0':rows.append(build)
    assert len(rows)<=1,'Multiple matching Build 5 records; no duplicate upload permitted'
    return rows[0] if rows else None

def restore():
    assert os.environ.get('EVOLINK_APPLE_UPLOAD_APPROVED')=='true'
    assert RELEASE.NUMBER=='5' and RELEASE.BUNDLE=='jp.sugosaka.evolink' and RELEASE.APP=='6828511589'
    assert not RELEASE.WORK.exists();RELEASE.WORK.mkdir(mode=0o700);RELEASE.PROOF.mkdir()
    app=RELEASE.api('GET','/apps/'+RELEASE.APP)['data'];assert app['attributes']['bundleId']==RELEASE.BUNDLE
    existing=build5()
    RELEASE.save('preupload-apple-state.json',{'buildNumber':'5','version':'1.0.0','alreadyUploaded':existing is not None,'existingBuild':existing})
    url='https://api.github.com/repos/koji06ochi-ship-it/SuG-BODY-MANAGEMENT-SYSTEM/releases/assets/750054208'
    response=requests.get(url,headers={'Authorization':'Bearer '+os.environ['GITHUB_TOKEN'],'Accept':'application/octet-stream','X-GitHub-Api-Version':'2022-11-28'},timeout=180)
    assert response.status_code==200,'Approved draft IPA download failed: HTTP '+str(response.status_code)
    data=response.content;assert len(data)==SIZE and RELEASE.sha(data)==EXPECTED,'Approved IPA bytes mismatch'
    folder=RELEASE.WORK/'ipa';folder.mkdir()
    (folder/'EVOLINK-1.0.0-build5-signed.ipa').write_bytes(data)
    RELEASE.save('approved-ipa.json',{'ipaSHA256':EXPECTED,'ipaBytes':SIZE,'originalBuildRun':43684961682,'originalDraftAsset':750054208,'sourceCommit':RELEASE.SOURCE_SHA,'userExplicitAppleUploadAndInternalDistributionApproval':True,'appId':RELEASE.APP,'bundleId':RELEASE.BUNDLE,'version':'1.0.0','buildNumber':'5','groupId':RELEASE.GROUP,'rebuilt':False})
    print('APPROVED_IPA_RESTORED: exact SHA256 and size; no rebuild')

def verify():
    RELEASE.verify()

def upload():
    assert (RELEASE.PROOF/'approved-ipa.json').exists() and (RELEASE.PROOF/'ipa-verification.json').exists()
    existing=build5() # Recheck immediately before the only binary upload attempt.
    if existing:
        RELEASE.save('apple-upload.json',{'accepted':False,'skippedDuplicate':True,'existingBuildId':existing['id'],'buildNumber':'5','version':'1.0.0','ipaSHA256':EXPECTED,'reason':'Matching Build 5 already present; no upload performed'})
        print('UPLOAD_SKIPPED: Build 5 already exists; proceeding to processing/distribution checks')
        return
    RELEASE.upload()
    result=json.loads((RELEASE.PROOF/'apple-upload.json').read_text());result.update({'ipaSHA256':EXPECTED,'ipaBytes':SIZE,'skippedDuplicate':False,'rebuilt':False})
    RELEASE.save('apple-upload.json',result)

def processing():
    assert (RELEASE.PROOF/'apple-upload.json').exists()
    deadline=time.monotonic()+1200
    while time.monotonic()<deadline:
        build=build5()
        if build:
            state=build['attributes']['processingState']
            RELEASE.save('apple-processing.json',{'buildId':build['id'],'buildNumber':'5','version':'1.0.0','processingState':state,'internalDistributionComplete':False})
            print('APPLE_PROCESSING_STATE: '+state,flush=True)
            if state in ('FAILED','INVALID'):raise RuntimeError('Apple processing '+state)
            if state=='VALID':return
        time.sleep(30)
    raise RuntimeError('Apple processing pending after bounded 20-minute wait; do not reupload')

def distribute():
    processed=json.loads((RELEASE.PROOF/'apple-processing.json').read_text());assert processed['processingState']=='VALID'
    identifier=processed['buildId']
    group=RELEASE.api('GET','/betaGroups/'+RELEASE.GROUP,params={'include':'app'})['data']
    assert group['attributes']['isInternalGroup'] is True and group['relationships']['app']['data']['id']==RELEASE.APP
    assert group['attributes']['name']=='SUG eVo iPhone Internal'
    build=RELEASE.api('GET','/builds/'+identifier)['data']
    if build['attributes'].get('usesNonExemptEncryption') is None:
        RELEASE.api('PATCH','/builds/'+identifier,{'data':{'type':'builds','id':identifier,'attributes':{'usesNonExemptEncryption':False}}})
    try:
        RELEASE.api('POST','/builds/'+identifier+'/relationships/betaGroups',{'data':[{'type':'betaGroups','id':RELEASE.GROUP}]})
        groups=RELEASE.api('GET','/builds/'+identifier+'/betaGroups')['data']
        assert RELEASE.GROUP in [g['id'] for g in groups]
        response=RELEASE.api('GET','/builds/'+identifier,params={'include':'buildBetaDetail'})
        detail=next((r['attributes'] for r in response.get('included',[]) if r['type']=='buildBetaDetails'),{})
        complete=detail.get('internalBuildState')=='IN_BETA_TESTING'
        RELEASE.save('internal-distribution.json',{'buildId':identifier,'buildNumber':'5','version':'1.0.0','groupId':RELEASE.GROUP,'groupName':group['attributes']['name'],'groupAttached':True,'betaDetail':detail,'internalDistributionComplete':complete,'appStoreSubmission':False,'externalTestersAdded':0})
        print('INTERNAL_DISTRIBUTION_STATE: '+str(detail.get('internalBuildState')))
        assert complete,'Group attached; final Testing state requires App Store Connect verification'
    except Exception as error:
        if not (RELEASE.PROOF/'internal-distribution.json').exists():
            RELEASE.save('internal-distribution.json',{'buildId':identifier,'buildNumber':'5','version':'1.0.0','groupId':RELEASE.GROUP,'groupName':group['attributes']['name'],'internalDistributionComplete':False,'apiError':str(error),'appStoreConnectUIVerificationRequired':True,'appStoreSubmission':False})
        raise

def preserve():
    # Reuse the established sanitized proof + encrypted IPA preservation path.
    RELEASE.preserve()

if __name__=='__main__':
    actions={'restore':restore,'verify':verify,'upload':upload,'processing':processing,'distribute':distribute,'preserve':preserve}
    actions[sys.argv[1]]()
