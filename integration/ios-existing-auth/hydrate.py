"""Restore only this release's encrypted, SHA256-attested original sources."""
import base64
import hashlib
import io
import json
import pathlib
import tarfile
import zlib

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from asc import Stop


HERE = pathlib.Path(__file__).resolve().parent
MAGIC = b'SUGCURRENT2'
AAD = b'SUG_CURRENT_IOS_SOURCES_V2'


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def hydrate(private, policy, destination):
    spec = policy.get('currentInput')
    if not spec or not isinstance(private, rsa.RSAPrivateKey) or destination.exists():
        raise Stop('CURRENT_INPUT_NOT_READY')
    chunks = []
    for part in spec['parts']:
        path = pathlib.PurePosixPath(part['name'])
        if len(path.parts) != 1:
            raise Stop('CURRENT_INPUT_PATH')
        data = (HERE / path.name).read_bytes()
        if digest(data) != part['sha256']:
            raise Stop('CURRENT_INPUT_CIPHERTEXT_SHA256')
        chunks.append(data)
    blob = b''.join(chunks)
    if digest(blob) != spec['ciphertextSHA256'] or not blob.startswith(MAGIC):
        raise Stop('CURRENT_INPUT_CIPHERTEXT_SHA256')
    cursor = len(MAGIC)
    length = int.from_bytes(blob[cursor:cursor + 2], 'big'); cursor += 2
    wrapped = blob[cursor:cursor + length]; cursor += length
    key = private.decrypt(wrapped, padding.OAEP(mgf=padding.MGF1(hashes.SHA256()),
                                               algorithm=hashes.SHA256(), label=AAD))
    nonce = blob[cursor:cursor + 12]; cursor += 12
    compressed = AESGCM(key).decrypt(nonce, blob[cursor:], AAD)
    if digest(compressed) != spec['plaintextPackageSHA256']:
        raise Stop('CURRENT_INPUT_PACKAGE_SHA256')
    with tarfile.open(fileobj=io.BytesIO(zlib.decompress(compressed)), mode='r:') as archive:
        members = archive.getmembers()
        if any(not m.isfile() for m in members) or len({m.name for m in members}) != len(members):
            raise Stop('CURRENT_INPUT_ARCHIVE_MEMBERS')
        raw = archive.extractfile('CURRENT-INPUT-MANIFEST.json').read()
        if digest(raw) != spec['manifestSHA256']:
            raise Stop('CURRENT_INPUT_MANIFEST_SHA256')
        manifest = json.loads(raw)
        if manifest['format'] != 'SUG_CURRENT_IOS_INPUTS_V2' or manifest['sourceRefs'] != spec['sourceRefs']:
            raise Stop('CURRENT_INPUT_SOURCE_REFS')
        expected = {f['path']: f for f in manifest['files']}
        if set(expected) | {'CURRENT-INPUT-MANIFEST.json'} != {m.name for m in members}:
            raise Stop('CURRENT_INPUT_FILE_SET')
        destination.mkdir(mode=0o700)
        for name, record in expected.items():
            rel = pathlib.PurePosixPath(name)
            if rel.is_absolute() or '..' in rel.parts or '\\' in name or rel.parts[0] not in ('.sources', 'pipeline'):
                raise Stop('CURRENT_INPUT_UNSAFE_PATH')
            data = archive.extractfile(name).read()
            if len(data) != record['bytes'] or digest(data) != record['sha256']:
                raise Stop('CURRENT_ORIGINAL_FILE_SHA256')
            path = destination.joinpath(*rel.parts)
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data); path.chmod(0o700 if record['executable'] else 0o600)
    print('SUG_CURRENT_ORIGINAL_SHA256_MATCH=' + spec['manifestSHA256'], flush=True)
    return manifest
