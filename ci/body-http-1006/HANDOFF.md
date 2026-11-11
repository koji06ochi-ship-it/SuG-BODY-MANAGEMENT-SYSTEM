# S.u.G BODY / 1006 loopback HTTP recovery — 2026-11-11

## Scope
Isolated candidate branch only: `body-http-1006-isolated-20261111`. Parent: `sug/ios-six-testflight-20261108` (commit `759e68ab9f4c20fe312360d4a64309195acc1c47`). No main edits, TestFlight upload, paid execution, or automatic workflow triggering intended.

## Verified prior CI failure
GitHub Actions run 42580156826, job 129036714400 (2026-11-09):
- iPhoneOS and iPhoneSimulator: xcodebuild BUILD SUCCEEDED.
- Simulator app did launch, loopback listener reported listening on :5411.
- Mac HTTP probe failed ConnectionResetError errno 54; in-app probe NSURLErrorDomain -1005; HTTP 200, WK didFinish, formal DOM ready unconfirmed.
- The prior run's private authenticated 1006 source is generated inside RUNNER_TEMP from encrypted assets; it is NOT committed to this GitHub branch.

## Committed candidate
`ci/body-http-1006/apply-http-fix.mjs` — isolated, explicit opt-in transformation:
- SHA-256 of expected source: `c691d2fddc94378d4c5e2ef1d4be7e1d4794376a5d26dffc6b5092e3e0c31a84`
- Expected transformed source: `ea5a7a1a9b72b44eaf410bc683d40496c9ecfd1f3307dba409a4d4dbe4d74981`
- Guards: `RUNNER_TEMP`, `SUG_BODY_1006_APPROVED=yes`, and opt-in `SUG_BODY_HTTP_FIX_APPROVED=yes` for apply. No automatic workflow hookup.
- The script checks exact SHA and one-to-one source hunks BEFORE writes; only the temporary BODY HTTP source can be replaced. A copy of the original is saved beside the edited file in the temporary runner.

## Independent prior local candidate checks
Uploaded package: BODY_HTTP_1006_NEXT_20261111.zip. The patch, fixed Swift and base source agree by SHA-256. Linux Swift parser passed and host-header unit checks 9/9 passed. **These results do not verify the GitHub-committed script or iOS runtime.**

## Required next gate, NOT YET PASSED
1. Authenticated 1006 source extraction, verify frozen 1006 final manifest BEFORE the one-file patch.
2. Execute `--check` and compare runtime source SHA to expected; if mismatched, stop and inspect (do not force).
3. Add an explicit one-file post-patch integrity contract without disabling previous checks, then invoke `--apply` on authenticated temporary copy only.
4. GitHub Actions unsigned iPhoneOS/Simulator build, Simulator HTTP200+WK didFinish+formal DOM readiness, launch/relaunch, transport failure logs. No retries of unchanged failed build.
5. iPhone physical and TestFlight require separate verification/authorization.
No external service charge, asset overwrite or upload authorized by this branch commit.
