# S.u.G BODY MANAGEMENT SYSTEM — Agent Guardrails

## Mission
Refactor and reconnect the existing S.u.G system without deleting or silently replacing working features.

Target architecture:

- BODY = normal member body/training management
- BEST OF MISS = beauty/pageant-specific body management
- ROM / CARE = shared assessment layer used by both BODY and BEST OF MISS
- QUEST = game/community/reward layer, separate from training-decision logic
- WALK = walking / route / HealthKit activity layer
- HealthKit / recovery / nutrition / member data = shared infrastructure

## Non-negotiable safety rules

1. Do not delete existing files or features as part of discovery/refactor.
2. Do not perform large rollback commits.
3. Do not replace a working canonical flow with an older version without explicit evidence.
4. Inspect the current repository implementation before editing. Never infer a path/version from memory.
5. Preserve the iOS HealthKit bridge and native build unless a change is explicitly required.
6. Never commit real member health data, clinical lab values, credentials, tokens, or personal information.
7. Clinical/lab data is contextual/safety information only. Do not implement diagnosis or treatment claims.
8. ROM/CARE outputs must describe measurable ROM/asymmetry/movement constraints and confidence; do not present speculative causes as diagnoses.
9. Progressive overload is gated by pain, ROM/form, recovery, and movement quality; higher load is not automatically success.
10. Run relevant smoke/build checks before declaring a change complete.

## Current repository facts to preserve

### Normal BODY candidate
`apps/body/index.html`

This is the current compact general BODY implementation and includes daily health, recovery, training decision, menu, training log, next-load and multiple BODY modules.

### BEST OF MISS candidate
`apps/body/best-of-miss-demo-v27.76.html`

This is the current pageant/beauty-focused interface. Beauty-specific logic must remain isolated from generic BODY decision logic unless it is intentionally shared.

### Shared BEAUTY engine
`apps/body/beauty-body-engine-v27.74.js`

Beauty goals include leg line, hip, decollete, waist, arms, back and FACE. Treat gait/posture inputs as movement/asymmetry observations, not medical diagnoses.

### Legacy full BODY / ROM / CARE source
Root `index.html`

Important working assets still live here, including AROM/PROM, SHR, thoracic ROM, Joint-by-Joint, movement screening, CARE response, 24H follow-up and integrated care decision logic.

Do not recreate these features from scratch before extracting/reusing the existing implementation.

### QUEST candidates
Current iOS points at `shrine-quest-v26.5.206.html`.
Repository also contains `shrine-quest-v26.5.207.html` and `shrine-quest-v26.5.208.html`.

Do not assume 206 is canonical solely because iOS currently points to it. Compare 206/207/208 and select the canonical QUEST version based on actual functionality and regressions.

### iOS current entry wiring
`ios/SuGMember/ContentView.swift`

Current BODY tab points directly to BEST OF MISS. This is temporary architecture debt. Do not simply swap it to another old page. First create a stable BODY entry that can expose Normal BODY and BEST OF MISS while sharing ROM/CARE.

## Desired navigation

Keep native bottom navigation:

`BODY | QUEST | WALK | 会員証`

Inside BODY, expose at minimum:

- TODAY / HOME
- TRAINING
- ROM / CARE
- ANALYSIS
- BEST OF MISS (only when relevant / enabled)

Normal BODY and BEST OF MISS must not duplicate HealthKit, recovery, nutrition, ROM/CARE persistence.

## Shared decision hierarchy

General BODY:

`goal -> HealthKit/recovery -> local readiness -> ROM/CARE constraints -> training decision -> POF -> volume -> overload -> logging -> next-load`

BEST OF MISS:

`beauty goal -> posture/gait -> body-line priority -> ROM/CARE constraints -> POF -> appropriate volume -> only then overload`

## ROM / CARE canonical behavior to retain

- AROM and optional PROM
- pain 0-10
- left/right storage and asymmetry ranking
- AROM/PROM gap handling
- PROM-limited vs active-control-limited distinction
- SHR
- thoracic ROM
- Joint-by-Joint context
- movement screen
- CARE before/after
- 24H follow-up
- integrated CARE priority
- medical referral gate without diagnosis

## QUEST role

QUEST is not a replacement for BODY. It consumes achievements/events from BODY/WALK/ROM and turns them into points/rewards/community exploration.

Candidate reward events include:

- walking goal achieved
- training completed
- load or rep PR achieved with quality gate satisfied
- ROM goal achieved
- flexibility milestone achieved
- location / shrine / community quest completion

Keep game state separate from private clinical/health detail. QUEST should receive only the minimum event/points data needed.

## First implementation sequence

1. Audit current entry points and identify canonical versions.
2. Compare QUEST 206/207/208 and record the winner + reasons.
3. Extract/reuse ROM/CARE from root `index.html` into a shared module/page without deleting the source.
4. Create a stable BODY hub/entry that exposes Normal BODY + ROM/CARE + BEST OF MISS.
5. Point iOS BODY tab to the new BODY hub only after smoke checks pass.
6. Reconnect HealthKit to all BODY surfaces through one shared bridge.
7. Add/extend smoke tests for normal BODY, BEST OF MISS, ROM/CARE and QUEST.
8. Verify iOS simulator build for the final head.

## Definition of done

Do not say "complete" unless:

- Normal BODY is reachable.
- BEST OF MISS is reachable separately.
- ROM/CARE is reachable and retains AROM/PROM functionality.
- QUEST canonical version is identified and wired.
- iOS BODY no longer forces every member into BEST OF MISS.
- HealthKit bridge still works.
- Relevant smoke tests pass.
- Final iOS native shell build passes for the final commit.
