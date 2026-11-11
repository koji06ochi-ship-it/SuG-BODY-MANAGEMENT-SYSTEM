# BODY 1006 | loopback HTTP reset | isolated branch (2026-11-11)

Source run: https://github.com/koji06ochi-ship-it/SuG-BODY-MANAGEMENT-SYSTEM/actions/runs/42580156826

Verified in that run: iPhoneOS and Simulator compilation succeeded; Simulator first-launch HTTP probe failed with ConnectionResetError errno=54, and native URLSession returned NSURLErrorDomain -1005. HTTP200, WK didFinish, formal DOM ready, relaunch and physical iPhone are NOT verified.

## Change stored on this branch
- `ci/sug-body-1006/loopback-guard.mjs` is a SHA-pinned, fail-closed candidate that changes only `BODY/iOS/Sources/BundleHTTPServer.swift` in a newly authenticated, temporary CI source tree.
- Expected input SHA-256: `c691d2fddc94378d4c5e2ef1d4be7e1d4794376a5d26dffc6b5092e3e0c31a84`
- Expected output SHA-256: `ea5a7a1a9b72b44eaf410bc683d40496c9ecfd1f3307dba409a4d4dbe4d74981`
- These hashes are from the separately preserved BODY source, NOT yet proven equal to the encrypted BODY1006 source unpacked at CI runtime.

## Required order in a *new*, approved CI job
1. Authenticate and extract original six-app assets into `$RUNNER_TEMP/sug-six` using the existing secret. Do not print secret.
2. Apply the frozen BODY1006 integration with `node ci/sug-body-1006/apply.mjs --apply "$RUNNER_TEMP/sug-six"`.
3. Run frozen final integrity check BEFORE patch: `node ci/sug-body-1006/apply.mjs --verify-final "$RUNNER_TEMP/sug-six"`.
4. Read-only inspect: `node ci/sug-body-1006/loopback-guard.mjs --inspect "$RUNNER_TEMP/sug-six"`. **Stop** on a hash mismatch; investigate the real authenticated source and produce a revised candidate, never force.
5. Only after a match and explicit permission: `SUG_BODY_LOOPBACK_APPROVED=yes node ci/sug-body-1006/loopback-guard.mjs --apply "$RUNNER_TEMP/sug-six"` (existing `SUG_BODY_1006_APPROVED=yes` must also be set).
6. Verify the one-file approved hash change and all 3,582 other original files against the frozen baseline. The old `--verify-final` necessarily rejects the patched file and MUST NOT be falsely reported PASS after patch.
7. Run unsigned iPhoneOS and Simulator builds, then verify HTTP 200, WK didFinish, formal DOM ready, and relaunch. Only then consider physical iPhone/TestFlight with separate approval.

## Boundaries
No existing main branch, original archive, BODY production build, TestFlight, user records, or other app has been changed by creating this branch. No build or upload has been executed. Do not trigger a Mac runner until zero-additional-charge eligibility is confirmed. The repair is a hypothesis, not a proven runtime fix.
