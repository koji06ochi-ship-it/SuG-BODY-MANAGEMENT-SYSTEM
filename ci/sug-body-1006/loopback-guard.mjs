// BODY1006: isolated, SHA-256 pinned loopback repair candidate.
// Inspect only by default; no changes to the source archive or TestFlight.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const [mode, rootArg] = process.argv.slice(2);
if (!['--inspect', '--apply'].includes(mode) || !rootArg) throw Error('Usage: node loopback-guard.mjs --inspect|--apply AUTHENTICATED_TEMP_ROOT');
const root = path.resolve(rootArg);
const target = path.join(root, 'BODY/iOS/Sources/BundleHTTPServer.swift');
const originalHash = 'c691d2fddc94378d4c5e2ef1d4be7e1d4794376a5d26dffc6b5092e3e0c31a84';
const candidateHash = 'ea5a7a1a9b72b44eaf410bc683d40496c9ecfd1f3307dba409a4d4dbe4d74981';
const digest = s => crypto.createHash('sha256').update(s).digest('hex');
if (!fs.existsSync(path.join(root, 'INPUT-MANIFEST.json'))) throw Error('Authenticated source marker absent');
let current = root;
for (const part of ['BODY','iOS','Sources','BundleHTTPServer.swift']) {
  current = path.join(current, part);
  if (!fs.existsSync(current) || fs.lstatSync(current).isSymbolicLink()) throw Error('Missing or symlinked source path');
}
const original = fs.readFileSync(target);
const actual = digest(original);
if (mode === '--inspect') {
  console.log('BODY_LOOPBACK_SOURCE_INSPECTION=' + JSON.stringify({
    actualSHA256: actual, expectedSHA256: originalHash,
    exactBaselineMatch: actual === originalHash, writes: 0,
    next: actual === originalHash ? 'eligible_for_isolated_patch' : 'STOP_reconcile_authenticated_1006_source'
  }));
  process.exit(actual === originalHash ? 0 : 2);
}
if (process.env.SUG_BODY_LOOPBACK_APPROVED !== 'yes' || process.env.SUG_BODY_1006_APPROVED !== 'yes') throw Error('Explicit isolated-patch approval required');
const temp = path.resolve(process.env.RUNNER_TEMP || '/nonexistent');
if (root === temp || !root.startsWith(temp + path.sep)) throw Error('Only ephemeral authenticated runner source allowed');
if (actual !== originalHash) throw Error('Authenticated BODY1006 source SHA mismatch; STOP without writes');
let updated = original.toString('utf8');
function once(before, after) {
  if (updated.split(before).length !== 2) throw Error('Source context mismatch; STOP without writes');
  updated = updated.replace(before, after);
}
once(
  '                guard let self else { connection.cancel(); return }\n                connection.start(queue: self.queue)',
  '                guard let self else { connection.cancel(); return }\n                self.logger.notice("sug_http_connection state=accepted")\n                connection.stateUpdateHandler = { [weak self] state in\n                    switch state {\n                    case .failed: self?.logger.error("sug_http_connection state=failed")\n                    case .cancelled: self?.logger.debug("sug_http_connection state=cancelled")\n                    default: break\n                    }\n                }\n                connection.start(queue: self.queue)'
);
once('            else { c.cancel() }\n        }\n    }\n    private func respond(',
     '            else {\n                self.logger.error("sug_http_request state=incomplete")\n                c.cancel()\n            }\n        }\n    }\n    private func respond(');
once(
  '        guard parts.count == 3, parts[2].hasPrefix("HTTP/1."), ["GET", "HEAD"].contains(String(parts[0])),\n              lines.dropFirst().contains(where: { $0.lowercased() == "host: 127.0.0.1:\\(port)" }) else {',
  '        // Header field names are case-insensitive; the host value stays pinned to loopback.\n        let validHost = lines.dropFirst().contains { line in\n            guard let separator = line.firstIndex(of: ":") else { return false }\n            let name = String(line[..<separator]).trimmingCharacters(in: .whitespacesAndNewlines)\n            let value = String(line[line.index(after: separator)...]).trimmingCharacters(in: .whitespacesAndNewlines)\n            return name.caseInsensitiveCompare("host") == .orderedSame && value == "127.0.0.1:\\(port)"\n        }\n        guard parts.count == 3, parts[2].hasPrefix("HTTP/1."), ["GET", "HEAD"].contains(String(parts[0])), validHost else {'
);
once(
  '        c.send(content: all, completion: .contentProcessed { _ in c.cancel() })',
  '        // Do not reset the TCP stream while WKWebView is still reading the response.\n        c.send(content: all, contentContext: .finalMessage, isComplete: true,\n               completion: .contentProcessed { [weak self] sendError in\n            if sendError != nil {\n                self?.logger.error("sug_http_reply state=send_failed")\n                c.cancel()\n                return\n            }\n            self?.logger.debug("sug_http_reply state=sent")\n            // Existing bounded idle timer remains the cleanup fallback.\n        })'
);
const output = Buffer.from(updated, 'utf8');
if (digest(output) !== candidateHash) throw Error('Candidate hash mismatch; STOP without writes');
fs.writeFileSync(target, output, { flag: 'w' });
if (digest(fs.readFileSync(target)) !== candidateHash) throw Error('Post-write hash mismatch');
console.log('BODY_LOOPBACK_PATCH_APPLIED=' + JSON.stringify({
  path: 'BODY/iOS/Sources/BundleHTTPServer.swift', beforeSHA256: originalHash,
  afterSHA256: candidateHash, onlyEphemeralSource: true, otherAppsModified: false
}));
