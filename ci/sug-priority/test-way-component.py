import os,pathlib,subprocess,sys,json
root=pathlib.Path(sys.argv[1]).resolve()
source=root/'WAY/iOS/Sources/WAYLocalDocuments.swift'
assert source.is_file()
assert 'WAY_SOURCE_MISSING' in (root/'WAY/iOS/Sources/WAYSourceMissing.swift').read_text()
for sdk,target in [('iphoneos','arm64-apple-ios17.0'),('iphonesimulator','arm64-apple-ios17.0-simulator')]:
 sdkroot=subprocess.check_output(['xcrun','--sdk',sdk,'--show-sdk-path'],text=True).strip()
 subprocess.run(['xcrun','swiftc','-swift-version','5','-sdk',sdkroot,'-target',target,'-typecheck',str(source)],check=True,timeout=90)
print('WAY_CONFIRMED_COMPONENT='+json.dumps({'component':'WAYLocalDocuments','bothSDKTypecheck':True,'productBodyConfirmed':False,'fullApplicationBuilt':False,'signed':False,'physicalIPhoneVerified':False}))

