import Foundation
import AppKit
import WebKit
import Darwin

@main final class GlowPhotoProbe: NSObject, WKNavigationDelegate {
    static func main() {
        let app = NSApplication.shared
        app.setActivationPolicy(.prohibited)
        let probe = GlowPhotoProbe()
        probe.start()
        app.run()
    }
    let server = BundleHTTPServer(folder: "Fixture", port: 15414)
    var web: WKWebView!
    var phase = 0
    func start() {
        _ = Timer.scheduledTimer(withTimeInterval: 100, repeats: false) { _ in self.finish(false, "timeout") }
        server.start()
        _ = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            if let failure = self.server.error { self.finish(false, failure); return }
            if self.server.ready {
                timer.invalidate()
                let config = WKWebViewConfiguration()
                config.websiteDataStore = .default()
                self.web = WKWebView(frame: CGRect(x:0,y:0,width:900,height:800), configuration:config)
                self.web.navigationDelegate = self
                self.web.load(URLRequest(url: URL(string:"http://127.0.0.1:15414/index.html")!))
            }
        }
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { finish(false,"provisional_navigation_failed") }
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { finish(false,"navigation_failed") }
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        let script: String
        if phase == 0 {
            script = """
            const api=window.SuGGlowPhotoStore;if(!api)throw Error('photo_module_missing');
            const raw=atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5xkAAAAASUVORK5CYII=');
            const blob=new Blob([Uint8Array.from(raw,c=>c.charCodeAt(0))],{type:'image/png'});
            const capture={before:{view:'front',expr:'neutral',light:'window',distance:'same'},after:{view:'front',expr:'neutral',light:'window',distance:'same'}};
            const saved=await api.store().save({files:{before:blob,after:null},settings:capture});
            const loaded=await api.store().load();if(!loaded||loaded.before.sha256!==saved.before.sha256)throw Error('save_load_failed');
            return JSON.stringify({phase:'saved',sha256:loaded.before.sha256});
            """
        } else {
            script = """
            const api=window.SuGGlowPhotoStore,store=api.store(),loaded=await store.load();
            if(!loaded||loaded.before.blob.size!==68)throw Error('reload_did_not_restore_blob');
            const text=await api.exportData(loaded),restored=await api.importData(text);await store.restore(restored);
            const active=await store.load();if(active.id===loaded.id||active.before.sha256!==loaded.before.sha256)throw Error('restore_revision_failed');
            const tampered=JSON.parse(text);tampered.before.sha256='0'.repeat(64);let refused=false;try{await api.importData(JSON.stringify(tampered));}catch{refused=true;}
            if(!refused||(await store.load()).id!==active.id)throw Error('tamper_changed_active_record');
            document.querySelector('[data-master-go="compare"]').click();
            await new Promise(r=>setTimeout(r,0));
            if(!document.querySelector('[data-photo-save]'))throw Error('photo_controls_missing');
            document.querySelector('#glowPhotoActions details').open=true;
            document.querySelector('[data-photo-delete]').click();
            await new Promise(r=>setTimeout(r,150));
            if(!document.querySelector('dialog[aria-label="写真操作の確認"]'))throw Error('explicit_confirmation_missing');
            document.querySelector('dialog[aria-label="写真操作の確認"] button').click();
            if(!(await store.load()))throw Error('cancel_deleted_photos');
            await store.clearConfirmed();if(await store.load())throw Error('explicit_clear_failed');
            return JSON.stringify({checks:['real_WebKit_IDB_save','reload_blob_restoration','backup_restore_new_revision','tampered_backup_refused','cancel_preserves_photos','confirmed_clear'],physicalIPhoneVerified:false,nativeFilesPickerVerified:false});
            """
        }
        web.callAsyncJavaScript(script, arguments: [:], in:nil, in:.page) { result in
            switch result {
            case .failure: self.finish(false,"photo_storage_or_UI_test_failed")
            case .success(let output):
                print("ACTUAL_MAC_WEBKIT_PHOTOS="+String(describing:output));fflush(stdout)
                if self.phase == 0 { self.phase=1;self.web.reload() }
                else { self.finish(true,"completed") }
            }
        }
    }
    func finish(_ success: Bool,_ reason: String) {
        print("PHOTO_PROBE_RESULT="+String(data:try! JSONSerialization.data(withJSONObject:["success":success,"reason":reason,"physicalIPhoneVerified":false]),encoding:.utf8)!);fflush(stdout)
        exit(success ? 0 : 1)
    }
}

