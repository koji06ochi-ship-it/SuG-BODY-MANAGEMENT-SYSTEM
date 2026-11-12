"""Persist encrypted IPA/diagnostics in the isolated branch; no Actions artifacts/cache or Apple upload."""
import base64,hashlib,json,os,pathlib,secrets,urllib.request,zlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
def main():
    repo=os.environ['GITHUB_REPOSITORY'];branch=os.environ['GITHUB_REF_NAME'];base=os.environ['GITHUB_SHA'];run=os.environ['GITHUB_RUN_ID']
    if repo!='koji06ochi-ship-it/SuG-BODY-MANAGEMENT-SYSTEM' or branch!='walk-build3-free-archive-20261112':raise RuntimeError('Outside approved result branch')
    root=pathlib.Path(os.environ['RUNNER_TEMP']);here=pathlib.Path(__file__).resolve().parent;lock=json.loads((here/'source-lock.json').read_text())
    result={'format':'SUG_WALK_BUILD3_RESULT_V1','sourceCommit':lock['sourceCommit'],'runId':run,'appleUploaded':False,'iPhoneOS':os.environ.get('IPHONEOS_OUTCOME'),'Simulator':os.environ.get('SIMULATOR_OUTCOME'),'archive':os.environ.get('ARCHIVE_OUTCOME'),'logs':{}}
    for name in ['iphoneos.log','simulator.log','archive.log']:
        p=root/name
        if p.exists():result['logs'][name]=base64.b64encode(p.read_bytes()).decode()
    receipt=root/'SuGWALK-3-ipa/WALK_BUILD3_IPA_RECEIPT.json'
    if receipt.exists():
        ipa_receipt=json.loads(receipt.read_text());p=pathlib.Path(ipa_receipt['ipa']).resolve()
        if not p.is_relative_to(root.resolve()) or hashlib.sha256(p.read_bytes()).hexdigest()!=ipa_receipt['ipaSHA256']:raise RuntimeError('IPA receipt mismatch')
        result['receipt']=ipa_receipt;result['ipa']=base64.b64encode(p.read_bytes()).decode()
    raw=json.dumps(result,separators=(',',':')).encode();nonce=secrets.token_bytes(12)
    sealed=b'SUGW3R1'+nonce+AESGCM(bytes.fromhex(os.environ['SUG_SIX_BUILD_ASSET_KEY'])).encrypt(nonce,zlib.compress(raw),b'SUG_WALK_BUILD3_RESULT_V1')
    if len(sealed)>75*1024*1024:raise RuntimeError('Result exceeds isolated Git blob cap; no paid artifact fallback')
    manifest={k:v for k,v in result.items() if k not in ['logs','ipa','receipt']};manifest.update({'ciphertextSHA256':hashlib.sha256(sealed).hexdigest(),'ciphertextBytes':len(sealed),'ipaSHA256':result.get('receipt',{}).get('ipaSHA256'),'ipaBytes':result.get('receipt',{}).get('ipaBytes'),'ActionsArtifactUploads':0,'cacheSaves':0})
    def api(method,path,payload=None):
        data=None if payload is None else json.dumps(payload).encode()
        req=urllib.request.Request('https://api.github.com/repos/'+repo+path,method=method,data=data,headers={'Authorization':'Bearer '+os.environ['GITHUB_TOKEN'],'Accept':'application/vnd.github+json','Content-Type':'application/json','User-Agent':'SUG-WALK-sealed-results'})
        with urllib.request.urlopen(req,timeout=90) as r:return json.load(r)
    ref=api('GET','/git/ref/heads/'+branch)
    if ref['object']['sha']!=base:raise RuntimeError('Branch advanced; no overwrite')
    commit=api('GET','/git/commits/'+base);files=[]
    for name,content in [('result.enc',sealed),('receipt.json',json.dumps(manifest,indent=2).encode())]:
        blob=api('POST','/git/blobs',{'content':base64.b64encode(content).decode(),'encoding':'base64'})
        files.append({'path':'ci/walk-build3/results/'+run+'/'+name,'mode':'100644','type':'blob','sha':blob['sha']})
    tree=api('POST','/git/trees',{'base_tree':commit['tree']['sha'],'tree':files})
    new=api('POST','/git/commits',{'message':'Retain sealed WALK Build 3 archive evidence, no Apple upload','tree':tree['sha'],'parents':[base]})
    api('PATCH','/git/refs/heads/'+branch,{'sha':new['sha'],'force':False})
    print(json.dumps({**manifest,'resultCommit':new['sha']}))
if __name__=='__main__':main()
