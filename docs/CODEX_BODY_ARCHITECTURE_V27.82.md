# V27.82 Architecture Audit — BODY / BEST OF MISS / ROM-CARE / QUEST

## Decision summary

### 1. Normal BODY
Canonical current compact entry candidate:

`apps/body/index.html`

Use this for general member training / recovery / nutrition management.

Do not replace it with BEST OF MISS.

### 2. BEST OF MISS
Canonical current beauty/pageant entry candidate:

`apps/body/best-of-miss-demo-v27.76.html`

Beauty engine:

`apps/body/beauty-body-engine-v27.74.js`

This remains a purpose-specific mode, not the default BODY for every member.

### 3. ROM / CARE
Canonical source currently remains the root legacy full system:

`index.html`

Verified functionality present in this file includes:

- ROM image assessment
- AROM / PROM
- reference-range comparison
- pain score
- left/right storage
- asymmetry ranking
- shoulder-humeral rhythm (SHR)
- thoracic ROM
- Joint-by-Joint context
- movement screen
- CARE BEFORE / AFTER
- 24H follow-up
- CARE RESPONSE PROFILE
- integrated CARE decision engine
- medical referral gate

Conclusion: do not rebuild ROM from zero. Extract/reuse this implementation into a shared ROM/CARE surface.

### 4. QUEST
Compared repository candidates:

- `shrine-quest-v26.5.206.html`
- `shrine-quest-v26.5.207.html`
- `shrine-quest-v26.5.208.html`

Selected canonical base: **V26.5.208**.

Why:

- retains the Osaka Kita 11-shrine pilot dataset introduced in 207
- retains evidence labels per shrine
- migrates prior local progress from `shrine207` or `shrine206`
- has the stronger game loop: TODAY'S QUEST -> map -> unlock -> relic -> encyclopedia
- displays next destination rather than a flat checklist
- keeps extended entries for Iwafune / Kanan Iwafune / Isonokami for the next chapter
- better matches S.u.G QUEST's intended exploration-game identity

Important limitation:

`現地でCHECK IN` in 208 currently unlocks by button action only. It does **not** validate GPS, QR, or server-side presence. Treat 208 as the canonical UX/game base, not as completed anti-cheat check-in.

Next QUEST work should add a verification layer without rewriting the UX.

### 5. iOS current problem
`ios/SuGMember/ContentView.swift` currently points the BODY tab directly at:

`apps/body/best-of-miss-demo-v27.76.html?native=ios&v=27.81`

That means all members are effectively routed into BEST OF MISS.

Target:

`BODY tab -> stable BODY hub -> Normal BODY / ROM-CARE / BEST OF MISS`

Native bottom navigation remains:

`BODY | QUEST | WALK | 会員証`

QUEST should be updated from 206 to the selected canonical 208 after the branch smoke checks.

## Shared architecture

### Shared infrastructure

The following should not be duplicated between Normal BODY and BEST OF MISS:

- HealthKit bridge
- recovery / stress
- weight / body composition
- nutrition
- ROM / CARE records
- member identity
- training history where relevant
- points event publishing

### Normal BODY decision order

`goal -> HealthKit/recovery -> local readiness -> ROM/CARE -> training decision -> POF -> volume -> overload -> logging -> next load`

### BEST OF MISS decision order

`beauty goal -> posture/gait -> body-line priority -> ROM/CARE -> POF -> appropriate volume -> only then overload`

### QUEST consumption model

QUEST receives minimal achievement events, not private health detail.

Examples:

- walking goal completed
- training completed
- quality-gated load/rep PR
- ROM goal completed
- flexibility milestone
- location/shrine quest completed

## V27.82 implementation order

1. Add BODY hub.
2. Add temporary ROM/CARE bridge surface reusing legacy implementation.
3. Verify Normal BODY and BEST OF MISS remain separately reachable.
4. Wire iOS BODY to the hub on the feature branch.
5. Wire iOS QUEST to 208 on the feature branch.
6. Add smoke tests for hub routes.
7. Run iOS simulator build.
8. Only after verification, prepare merge to main.

## Later extraction

The temporary ROM/CARE bridge is not the final modularization. Once routing is stable, extract the ROM/CARE code from root `index.html` into dedicated shared files and make both BODY modes consume the same storage contract.
