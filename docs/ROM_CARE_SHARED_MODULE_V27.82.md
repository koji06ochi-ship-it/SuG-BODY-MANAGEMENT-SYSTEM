# ROM / CARE shared module audit — V27.82

## Scope and migration rule

The canonical working implementation remains the root `index.html`. This change does not copy or delete its UI, image analysis, CARE engine, member authentication, or persistence. The first extraction boundary is intentionally small:

- shared route and source context for Normal BODY, BEST OF MISS, and the BODY hub
- parent/legacy runtime messaging for ROM vs CARE selection
- the ROM/CARE member-data collection contract
- pure AROM/PROM band and gap rules
- pure left/right AROM asymmetry grouping
- pure squat-ROM reference-band rules

The legacy page continues to own DOM rendering and cloud persistence while later phases extract feature engines one at a time.

## Previous bridge

`apps/body/rom-care-v27.82.html` previously loaded the entire root `index.html` and repeatedly reached into `iframe.contentDocument` to find `.tab[data-tab="rom|care"]`, click the tab, and scroll the panel. This made the bridge depend on private DOM structure and gave Normal BODY and BEST OF MISS no common launch contract.

The bridge now communicates with the legacy runtime through same-origin `postMessage`. The shared runtime inside root `index.html` owns tab activation and focused presentation. The parent no longer queries or mutates iframe DOM.

## Dependency inventory

### Data and persistence

All records are arrays on the currently selected legacy member object and are persisted together to Supabase `member_data.data` by `persist()` / `saveCloud()`:

| Collection | Feature owners |
| --- | --- |
| `romAssessments` | squat image ROM |
| `aromAssessments` | AROM/PROM, thoracic ROM, left/right asymmetry, Joint by Joint |
| `shrAssessments` | SHR photo/tap assessment |
| `movementScreens` | movement screen |
| `selfCare` | CARE before/after, selected interventions, 24H follow-up, response profile |
| `integratedAssessments` | integrated CARE decision snapshots |
| `medicalReferrals` | referral summaries and post-visit exercise/load instructions |

`apps/shared/rom-care-v27.82.js` now defines and normalizes this collection contract. It does not introduce a second localStorage key or a second cloud record.

### ROM image assessment

Core functions still in root `index.html`:

- `loadRomImage`, `drawRomBaseImage`
- MediaPipe pose initialization and `analyzeSquatRom`
- `angle3`, `trunkFromVertical`, `romDepthLabel`
- `window.__SUG_ROM_RESULT__`, `saveRomResult`, `renderRomHistory`

Shared pure dependencies:

- `ROM_REFERENCE`
- `romBand(value, key)`

DOM dependencies:

- `romFile`, `romSourceImage`, `romStage`, `romCanvas`
- `romModelStatus`, `romAnalyzeBtn`, `romResult`, `romHistory`, `romDate`

External dependency: MediaPipe Tasks Vision and the hosted pose-landmarker model.

### AROM / PROM, thoracic ROM, and asymmetry

Core functions still in root `index.html`:

- `renderAromReference`, `analyzeAromProm`, `saveAromResult`
- `findAromOpposite`, `findAromPrevious`
- `renderAromHistory`, `renderAromAsymmetry`

Shared pure dependencies:

- `aromBand(value, reference)`
- `aromGapThreshold(key)`
- `aromAsymmetryPairs(rows, limit)`

The large `AROM_REFERENCE` metadata table remains in root `index.html` for this phase. It includes cervical, knee, ankle, hip, shoulder, thoracic, elbow, forearm, wrist, and foot movements.

DOM dependencies:

- `aromDate`, `aromSide`, `aromMovement`
- `aromActive`, `aromPassive`, `aromPain`, `aromMemo`
- `aromReference`, `aromResult`, `aromHistory`, `aromAsymmetry`

### SHR

Core functions still in root `index.html`:

- `analyzeShr`, `saveShrResult`, `renderShrHistory`, `findShrPair`
- `loadShrPhoto`, `analyzeShrPhotos`, tap/reset functions
- `shrArmElevation`, `shrScapAngle`, `shrDraw`, `shrUpdateUI`

DOM dependencies:

- `shrCanvasStart`, `shrCanvasEnd`, readouts, tap guide
- hidden `shrArm`, `shrScapStart`, `shrScapEnd`
- date, side, plane, phase, pain, memo, result, and history controls

External dependency: the same MediaPipe pose runtime; scapular landmarks remain manual two-point taps.

### Joint by Joint and movement screen

Core functions still in root `index.html`:

- `renderJointByJoint` and `jbj*` latest/evaluation helpers
- `loadMovementPhoto`, `analyzeMovementScreen`, `saveMovementScreen`
- `renderMovementHistory`, `latestMovement`, guide/drawing helpers

DOM dependencies:

- `jbjPriority`, `jbjMap`
- `moveDate`, `moveType`, `moveSide`, `movePain`, `moveFile`, `moveCanvas`
- `moveModelStatus`, `moveAnalyzeBtn`, `moveMemo`, `moveResult`, `moveHistory`

These functions also read AROM/PROM, SHR, and CARE collections. Movement image analysis uses MediaPipe.

### CARE response, 24H follow-up, and referral gate

Configuration still in root `index.html`:

- `CARE_AREA_LABELS`, `CARE_LOCATIONS`, `CARE_MOVEMENTS`, `CARE_FLAGS`
- `CARE_ROUTINE`, `CARE_IMAGES`, `CARE_BRANCHES`
- `CARE_AROM_KEYS`, `CARE_ACUTE_PROTOCOLS`, `CARE_TAPING_LIBRARY`, `CARE_TOOLBOX`

Core functions still in root `index.html`:

- question/menu: `renderCareQuestions`, `carePlan`, `evaluateSelfCare`
- ROM link: `careLatestArom`, `careAromDecision`, `renderCareAromLink`
- acute/thermal/taping: `careAcuteDecision`, `careThermalDecision`, action/toolbox helpers
- response: `saveSelfCareResult`, `careResponseFromRow`, response/profile statistics
- follow-up: `renderCareFollowupPanel`, `loadCareFollowupForm`, `saveCareFollowup`
- referral: `careReferralGate`, summary/copy/download/save functions
- medical feedback: save, active-guidance, and history functions

DOM dependencies are the `care*` form/result/history elements in panel `#care`, plus the medical map/referral/feedback controls. Clipboard, Blob downloads, Google Maps, and optional geolocation are used by referral support; location is not persisted.

### Integrated CARE decision engine

Core functions still in root `index.html`:

- `buildIntegratedAssessment`, `renderIntegratedAssessment`
- `saveIntegratedAssessment`, `renderIntegratedHistory`
- the `int*` CARE, AROM, movement, SHR, confidence, recovery, and next-load helpers

It reads ROM/CARE collections plus `recovery`, `training`, and active `medicalReferrals`. It writes only `integratedAssessments`. DOM dependencies are `integratedResult`, `integratedSaveBtn`, and `integratedHistory`.

## Implemented minimal migration

1. Added `apps/shared/rom-care-v27.82.js` as the shared contract and pure-rule module.
2. Root `index.html` loads it before the legacy application and delegates ROM band, AROM band/gap, asymmetry grouping, and collection normalization.
3. The shared module activates focused `#rom` / `#care` legacy panels and exchanges explicit ready/section messages with the bridge.
4. Normal BODY and BEST OF MISS use the same declarative `data-rom-care-launch` contract.
5. Source and native context are preserved, so the bridge returns to the launching BODY mode rather than always forcing the hub.

## Remaining legacy dependencies and next extraction slices

The following intentionally remain in root `index.html`:

- member login, role/member selection, Supabase load/save, backup/restore
- all ROM/CARE markup and CSS
- the AROM reference metadata table
- MediaPipe model lifecycle, canvases, image decoding, pose drawing
- AROM/PROM result rendering and record creation
- SHR and movement-screen calculations/rendering
- CARE libraries, DOM form collection, response profile, 24H follow-up
- medical referral/map helpers
- Joint by Joint and integrated CARE engines

Recommended next slices, each with compatibility tests before removal from root:

1. move `AROM_REFERENCE` plus AROM result construction into the shared module
2. extract CARE configuration and pure decision functions without DOM access
3. introduce a small member-record adapter around `m()` / `persist()`
4. extract MediaPipe image-analysis adapters while keeping existing canvases
5. move the final ROM/CARE markup only after both BODY modes consume the shared engines directly
