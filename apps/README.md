# S.u.G Three-App Architecture

## 1. BODY MANAGEMENT
Purpose: daily member body management and training decisions.

Flow: IDEAL → appetite → available time → today condition → operation level → training area → recovery → recommended time/intensity/RIR → menu → log → NEXT LOAD.

Owns: HealthKit daily metrics, nutrition/PFC, bodyweight trend, recovery, training log, CARE response, member/trainer data.

Does NOT own: BIG3 video biomechanics or sports-performance movement analysis.

## 2. BIG3 ANALYZER
Purpose: Squat / Bench Press / Deadlift analysis.

Flow: exercise → video → rep/bar/ROM/velocity/sticking analysis → issue → correction → BEFORE/AFTER → result.

Owns: BIG3 video analysis and related sensor data.

Does NOT own: daily BODY management or general sports-performance assessment.

## 3. PERFORMANCE
Purpose: movement and sports-performance assessment.

Flow: movement → test → mobility/output/asymmetry → integrated assessment → priority → intervention → re-test.

Owns: movement screen, AROM/PROM, SHR, thoracic mobility, Joint-by-Joint, sport-performance tests and future sensors.

Does NOT own: BODY daily training management or BIG3-specific video analysis.

## Shared contract
Only shared identity/data contracts cross app boundaries. Each app keeps its own UI, navigation and feature modules. No monolithic HOME. Existing QUEST and WALK remain separate from these app cores and must not be modified by this split.