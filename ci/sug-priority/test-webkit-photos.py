import pathlib,os,sys,subprocess,plistlib
root=pathlib.Path(sys.argv[1]).resolve()
here=pathlib.Path(__file__).resolve().parent
work=pathlib.Path(os.environ['RUNNER_TEMP'])/'glow-webkit-probe'
app=work/'PhotoProbe.app'
mac=app/'Contents/MacOS';resource=app/'Contents/Resources'
mac.mkdir(parents=True);resource.mkdir()
(resource/'Fixture').symlink_to(root/'GLOW/iOS/Resources/Web',target_is_directory=True)
with (app/'Contents/Info.plist').open('wb') as f:plistlib.dump({'CFBundleIdentifier':'jp.sugosaka.glow.storageprobe','CFBundleExecutable':'PhotoProbe','CFBundlePackageType':'APPL','NSAppTransportSecurity':{'NSAllowsLocalNetworking':True}},f)
binary=mac/'PhotoProbe'
subprocess.run(['xcrun','swiftc','-swift-version','5',str(root/'GLOW/iOS/Sources/BundleHTTPServer.swift'),str(here/'GlowPhotoProbe.swift'),'-framework','AppKit','-framework','WebKit','-o',str(binary)],check=True,timeout=120)
subprocess.run([str(binary)],check=True,timeout=120)

