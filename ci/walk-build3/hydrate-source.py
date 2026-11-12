"""Authenticate the sealed current WALK source and restore only a new runner-local source tree."""
import base64,hashlib,json,os,pathlib,zlib
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
def git_tree(files):
    tree={}
    for rel,data,mode in files:
        node=tree;parts=rel.parts[2:]
        for part in parts[:-1]:node=node.setdefault(part,{})
        node[parts[-1]]=(data,mode)
    def digest(kind,data):return hashlib.sha1(kind+b' '+str(len(data)).encode()+b'\0'+data).digest()
    def walk(node):
        raw=b''
        for name,value in sorted(node.items(),key=lambda x:(x[0]+('/' if isinstance(x[1],dict) else '')).encode()):
            directory=isinstance(value,dict);mode='40000' if directory else value[1];oid=walk(value) if directory else digest(b'blob',value[0])
            raw+=mode.encode()+b' '+name.encode()+b'\0'+oid
        return digest(b'tree',raw)
    return walk(tree).hex()
def unpack(blob,key,lock,destination):
    if hashlib.sha256(blob).hexdigest()!=lock['ciphertextSHA256'] or blob[:7]!=b'SUGW3S1':raise RuntimeError('Source ciphertext mismatch')
    raw=zlib.decompress(AESGCM(key).decrypt(blob[7:19],blob[19:],b'SUG_WALK_BUILD3_SOURCE_V1'))
    if hashlib.sha256(raw).hexdigest()!=lock['plaintextSHA256']:raise RuntimeError('Source content mismatch')
    source=json.loads(raw)
    if source['format']!='SUG_WALK_BUILD3_SOURCE_V1' or source['sourceCommit']!=lock['sourceCommit'] or source['iOSTree']!=lock['iOSTree']:raise RuntimeError('Source revision mismatch')
    if destination.exists():raise RuntimeError('Source destination exists; no overwrite')
    checked=[];seen=set()
    for item in source['files']:
        rel=pathlib.PurePosixPath(item['path'])
        if not str(rel).startswith('WALK/iOS/') or '..' in rel.parts or '\\' in str(rel) or item['path'] in seen:raise RuntimeError('Unexpected source path')
        data=base64.b64decode(item['content'],validate=True)
        if hashlib.sha256(data).hexdigest()!=item['sha256']:raise RuntimeError('Source file hash mismatch')
        if item['mode'] not in ['100644','100755']:raise RuntimeError('Unexpected source mode')
        checked.append((rel,data,item['mode']));seen.add(item['path'])
    if len(checked)!=lock['fileCount']:raise RuntimeError('Incomplete source')
    if git_tree(checked)!=lock['iOSTree']:raise RuntimeError('Original iOS Git tree differs')
    for rel,data,mode in checked:
        target=destination/str(rel);target.parent.mkdir(parents=True,exist_ok=True)
        with target.open('xb') as f:f.write(data)
        target.chmod(0o755 if mode=='100755' else 0o644)
    return len(checked)
def main():
    here=pathlib.Path(__file__).resolve().parent;root=pathlib.Path(os.environ['RUNNER_TEMP']).resolve()/'walk-build3-source'
    count=unpack((here/'source.enc').read_bytes(),bytes.fromhex(os.environ['SUG_SIX_BUILD_ASSET_KEY']),json.loads((here/'source-lock.json').read_text()),root)
    print('CURRENT_WALK_SOURCE_HASH_MATCH='+str(count))
if __name__=='__main__':main()
