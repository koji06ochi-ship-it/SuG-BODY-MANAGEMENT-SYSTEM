"""Scoped reuse of existing BODY signer. No old asset cleanup, revocation or retries."""
import os, sys, json, importlib.util
from pathlib import Path

if os.environ.get('SUG_WHY_DISTRIBUTION_APPROVED') != 'WHY_PRIVATE_TESTFLIGHT_20261107':
    raise SystemExit('Explicit private TestFlight approval required')
if os.environ.get('APP_BUNDLE_ID') != 'jp.sugosaka.why':
    raise SystemExit('WHY bundle only; BODY/eVo/WALK cannot be replaced')

def load(name):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).parent/'vendor'/(name+'.py'))
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod);return mod

bootstrap=load('appstore_bootstrap')
# No HealthKit or unrelated capability changes. Existing user/role permissions are untouched.
original_app_name=bootstrap.APP_NAME
bootstrap.APP_NAME='SUG WHY'
bootstrap.ensure_bundle()
bootstrap.APP_NAME=original_app_name
bootstrap.ensure_app()
signer=load('appstore_signing')
old_request=signer.request
def one_request(method,path,**kwargs):
    if method not in ('GET','POST'): raise RuntimeError('Apple deletion/revocation forbidden')
    kwargs['attempts']=1
    return old_request(method,path,**kwargs)
signer.request=one_request
def no_delete(*_): raise RuntimeError('Certificate/profile revocation forbidden; preserve evidence')
signer.request_delete=no_delete
def one_certificate(csr):
    return one_request('POST','/certificates',body={'data':{'type':'certificates','attributes':{'certificateType':'DISTRIBUTION','csrContent':csr}}})['data']
signer.create_certificate=one_certificate
temporary=Path(os.environ['RUNNER_TEMP'])/'why-signing'
signer.prepare(temporary,temporary/'new-signing-state.json')
