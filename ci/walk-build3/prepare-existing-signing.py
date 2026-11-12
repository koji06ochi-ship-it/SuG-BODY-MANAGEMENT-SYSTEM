"""Reuse only LYFMNJP5Z5 / WALK 22B4PZKN25. Apple requests are GET-only."""
import base64,json,os,pathlib,secrets,time,urllib.parse,urllib.request
from datetime import datetime,timezone
from cryptography.hazmat.primitives import hashes,serialization
from cryptography.hazmat.primitives.asymmetric import ec,utils
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

CERT='LYFMNJP5Z5';PROFILE='22B4PZKN25';BUNDLE='jp.sugosaka.walk'
def b64(data):return base64.urlsafe_b64encode(data).rstrip(b'=')
def token(pem,key_id,issuer,now=None):
    now=int(time.time()) if now is None else now
    header=b64(json.dumps({'alg':'ES256','kid':key_id,'typ':'JWT'},separators=(',',':')).encode())
    payload=b64(json.dumps({'iss':issuer,'iat':now-5,'exp':now+600,'aud':'appstoreconnect-v1'},separators=(',',':')).encode())
    message=header+b'.'+payload;key=serialization.load_pem_private_key(pem,password=None)
    r,s=utils.decode_dss_signature(key.sign(message,ec.ECDSA(hashes.SHA256())))
    return (message+b'.'+b64(r.to_bytes(32,'big')+s.to_bytes(32,'big'))).decode()
def recover(ciphertext,key):
    blob=base64.b64decode(ciphertext,validate=True)
    if blob[:6]!=b'SUGSR1' or len(blob)>65536:raise RuntimeError('Unexpected existing recovery format')
    data=json.loads(AESGCM(key).decrypt(blob[6:18],blob[18:],b'SUG_SIGNING_RECOVERY_V1'))
    if data.get('format')!='SUG_SIGNING_RECOVERY_V1' or data.get('certificateId')!=CERT or data.get('apiKeysIncluded') is not False:raise RuntimeError('Unexpected recovered identity')
    return data
def validate_existing(recovered,certificate,profile,bundle_id,now=None):
    now=now or datetime.now(timezone.utc)
    if certificate['id']!=CERT or certificate['attributes']['certificateType'] not in ['DISTRIBUTION','IOS_DISTRIBUTION']:raise RuntimeError('Existing certificate mismatch')
    raw=base64.b64decode(recovered['p12'],validate=True)
    private,leaf,_=pkcs12.load_key_and_certificates(raw,recovered['password'].encode())
    if private is None or leaf is None or leaf.not_valid_after_utc<=now:raise RuntimeError('Recovered certificate expired or private key missing')
    if leaf.public_bytes(serialization.Encoding.DER)!=base64.b64decode(certificate['attributes']['certificateContent']):raise RuntimeError('Apple certificate differs')
    if private.public_key().public_numbers()!=leaf.public_key().public_numbers():raise RuntimeError('Private key mismatch')
    a=profile['attributes'];links=profile['relationships']
    if profile['id']!=PROFILE or a['profileState']!='ACTIVE' or a['profileType']!='IOS_APP_STORE':raise RuntimeError('Existing profile unavailable')
    if datetime.fromisoformat(a['expirationDate'].replace('Z','+00:00'))<=now:raise RuntimeError('Existing profile expired')
    if links['bundleId']['data']['id']!=bundle_id or [c['id'] for c in links['certificates']['data']]!=[CERT]:raise RuntimeError('Profile belongs to another app/identity')
    return raw,base64.b64decode(a['profileContent'],validate=True)
def main():
    if os.environ.get('SUG_SIGNING_APPROVED')!='yes':raise RuntimeError('Signing scope is not approved')
    root=pathlib.Path(os.environ['RUNNER_TEMP']).resolve();work=root/'walk-build3-signing'
    if work.exists():raise RuntimeError('Do not overwrite signing directory')
    key=bytes.fromhex(os.environ['SUG_SIX_BUILD_ASSET_KEY']);recovered=recover(os.environ['SUG_SIGNING_RECOVERY_CIPHERTEXT'].strip(),key)
    pem=os.environ['ASC_API_KEY_P8'].strip().replace('\\n','\n');pem=pem.encode() if pem.startswith('-----BEGIN ') else base64.b64decode(pem,validate=True)
    def get(path,params=None):
        allowed=['/certificates/'+CERT,'/profiles/'+PROFILE,'/bundleIds','/apps','/builds']
        if path not in allowed:raise RuntimeError('Outside WALK read-only Apple scope')
        url='https://api.appstoreconnect.apple.com/v1'+path+('?' + urllib.parse.urlencode(params) if params else '')
        req=urllib.request.Request(url,method='GET',headers={'Authorization':'Bearer '+token(pem,os.environ['ASC_API_KEY_ID'],os.environ['ASC_API_ISSUER_ID']),'Accept':'application/json'})
        with urllib.request.urlopen(req,timeout=45) as response:return json.load(response)
    bundles=get('/bundleIds',{'filter[identifier]':BUNDLE,'limit':10})['data'];bundles=[b for b in bundles if b['attributes']['identifier']==BUNDLE]
    apps=get('/apps',{'filter[bundleId]':BUNDLE,'limit':10})['data'];apps=[a for a in apps if a['attributes']['bundleId']==BUNDLE]
    if len(bundles)!=1 or len(apps)!=1:raise RuntimeError('Existing WALK app/bundle not unique; do not create')
    builds=get('/builds',{'filter[app]':apps[0]['id'],'filter[version]':'3','limit':10})['data']
    if any(b['attributes']['version']=='3' for b in builds):raise RuntimeError('Build 3 already exists: inspect TestFlight, do not resend or renumber')
    certificate=get('/certificates/'+CERT)['data'];profile=get('/profiles/'+PROFILE,{'include':'certificates,bundleId'})['data']
    p12,provision=validate_existing(recovered,certificate,profile,bundles[0]['id'])
    work.mkdir(mode=0o700);(work/'distribution.p12').write_bytes(p12);(work/'WALK.mobileprovision').write_bytes(provision)
    for p in work.iterdir():p.chmod(0o600)
    password=secrets.token_urlsafe(24)
    print('::add-mask::'+recovered['password']);print('::add-mask::'+password)
    with open(os.environ['GITHUB_ENV'],'a') as env:env.write('SUG_P12_PASSWORD='+recovered['password']+'\nSUG_KEYCHAIN_PASSWORD='+password+'\n')
    print(json.dumps({'existingCertificate':CERT,'existingWALKProfile':PROFILE,'AppleGETOnly':True,'newCertificates':0,'newProfiles':0,'uploads':0}))
if __name__=='__main__':main()
