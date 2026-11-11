import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// Isolated, opt-in patch; never triggered automatically.
// node ci/body-http-1006/apply-http-fix.mjs --check|--apply "$RUNNER_TEMP/sug-six"
const [mode, rootArg] = process.argv.slice(2);
assert(['--check','--apply'].includes(mode) && rootArg, 'Explicit mode and directory required');
const root=path.resolve(rootArg), tmp=path.resolve(process.env.RUNNER_TEMP||'/nonexistent');
assert(root.startsWith(tmp+path.sep)&&root!==tmp,'RUNNER_TEMP isolated directory required');
assert(process.env.SUG_BODY_1006_APPROVED==='yes','Approved 1006 source required');
const target=path.join(root,'BODY/iOS/Sources/BundleHTTPServer.swift');
const inputManifest=path.join(root,'INPUT-MANIFEST.json');
assert(fs.statSync(inputManifest).isFile()&&!fs.lstatSync(inputManifest).isSymbolicLink(),'Authenticated manifest required');
assert(fs.statSync(target).isFile()&&!fs.lstatSync(target).isSymbolicLink(),'Expected server source required');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
let source=fs.readFileSync(target,'utf8');
const originalSha='c691d2fddc94378d4c5e2ef1d4be7e1d4794376a5d26dffc6b5092e3e0c31a84';
const fixedSha='ea5a7a1a9b72b44eaf410bc683d40496c9ecfd1f3307dba409a4d4dbe4d74981';
assert.equal(sha(source),originalSha,'Source SHA mismatch: stop without changes');
function exact(before,after){
  assert(source.includes(before)&&source.indexOf(before)===source.lastIndexOf(before),'Missing or duplicate source hunk');
  source=source.replace(before,after);
}
exact(`                guard let self else { connection.cancel(); return }
                connection.start(queue: self.queue)`,`                guard let self else { connection.cancel(); return }
                // Fixed diagnostic stages only; no user data or request paths.
                self.logger.notice("sug_http_connection state=accepted")
                connection.stateUpdateHandler = { [weak self] state in
                    switch state {
                    case .failed: self?.logger.error("sug_http_connection state=failed")
                    case .cancelled: self?.logger.debug("sug_http_connection state=cancelled")
                    default: break
                    }
                }
                connection.start(queue: self.queue)`);
exact(`            else { c.cancel() }
        }
    }
    private func respond`,`            else {
                self.logger.error("sug_http_request state=incomplete")
                c.cancel()
            }
        }
    }
    private func respond`);
exact(String.raw`        guard parts.count == 3, parts[2].hasPrefix("HTTP/1."), ["GET", "HEAD"].contains(String(parts[0])),
              lines.dropFirst().contains(where: { $0.lowercased() == "host: 127.0.0.1:\(port)" }) else {`,String.raw`        // HTTP header names are case insensitive; keep fixed loopback host.
        let validHost = lines.dropFirst().contains { line in
            guard let separator = line.firstIndex(of: ":") else { return false }
            let name = String(line[..<separator]).trimmingCharacters(in: .whitespacesAndNewlines)
            let value = String(line[line.index(after: separator)...]).trimmingCharacters(in: .whitespacesAndNewlines)
            return name.caseInsensitiveCompare("host") == .orderedSame && value == "127.0.0.1:\(port)"
        }
        guard parts.count == 3, parts[2].hasPrefix("HTTP/1."), ["GET", "HEAD"].contains(String(parts[0])), validHost else {`);
exact(`        c.send(content: all, completion: .contentProcessed { _ in c.cancel() })`,`        // Prevent immediate TCP RST while the WebView reads the response.
        c.send(content: all, contentContext: .finalMessage, isComplete: true,
               completion: .contentProcessed { [weak self] sendError in
            if sendError != nil {
                self?.logger.error("sug_http_reply state=send_failed")
                c.cancel()
                return
            }
            self?.logger.debug("sug_http_reply state=sent")
            // Bounded idle timer already handles cleanup.
        })`);
assert.equal(sha(source),fixedSha,'Candidate SHA mismatch; stop without change');
if(mode==='--apply'){
  assert.equal(process.env.SUG_BODY_HTTP_FIX_APPROVED,'yes','Opt-in flag required');
  const backup=target+'.original-1006',pending=target+'.candidate-tmp';
  assert(!fs.existsSync(backup)&&!fs.existsSync(pending),'Patch already staged; no repeat');
  fs.copyFileSync(target,backup,fs.constants.COPYFILE_EXCL);
  fs.writeFileSync(pending,source,{flag:'wx'});
  fs.renameSync(pending,target);
  assert.equal(sha(fs.readFileSync(target)),fixedSha,'Final content mismatch');
}
console.log(JSON.stringify({app:'BODY',mode,sourceSha:originalSha,outputSha:fixedSha,changes:mode==='--apply'?1:0}));