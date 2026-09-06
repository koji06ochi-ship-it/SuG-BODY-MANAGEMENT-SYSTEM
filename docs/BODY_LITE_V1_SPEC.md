# S.u.G BODY Lite v1.0

## Purpose

BODY Lite is the common lightweight health layer for:

- Community / municipality + QUEST
- Senior / elderly care and family reporting
- Sports / youth teams

The existing S.u.G BODY remains the Pro / training product. Lite reuses the same health-data foundation but removes training complexity.

## Product statement

**QUEST creates a reason to move. BODY Lite measures what changed after moving.**

The product should show behavior change and body/health change in a form that can be understood by the user, family, coach, facility, or municipality.

## v1.0 completion conditions

1. Health/activity import
   - steps
   - distance
   - exercise/active minutes
   - sleep
   - heart rate / resting heart rate when available
   - weight when available

2. Quick condition check
   - fatigue
   - pain
   - subjective condition

3. Body-change record
   - front / side / back monthly photos
   - simple before/after comparison
   - ROM / simple physical-test fields can be added after the base data contract is fixed

4. Monthly comparison
   - current month vs previous month
   - average steps
   - active minutes
   - sleep
   - weight trend
   - outside/QUEST participation where available

5. QUEST/WALK linkage
   - QUEST/WALK participation
   - check-ins
   - points / clears
   - steps / distance generated during activity where available

6. Watch mode foundation
   - explicit opt-in only
   - last activity / last sync
   - GPS sharing is NOT enabled by default
   - sharing target and permission scope must be separate settings

7. Cloud sync
   - member-scoped storage
   - existing Supabase BODY cloud pattern can be reused
   - photo storage must be designed separately from local IndexedDB before production use

8. Administrator dashboard
   - member list
   - activity decrease
   - pain increase
   - prolonged inactivity
   - participation / continuation
   - municipality view should default to aggregate data, not live personal location

9. Monthly report
   - activity
   - QUEST
   - body/condition change
   - one-screen / one-page summary

10. Mode profiles
   - Community
   - Senior
   - Sports
   - Pro remains existing full BODY

## Current repository assets already reusable

- HealthKit native bridge
- steps / distance / active energy / exercise minutes payload
- sleep / HR / resting HR / HRV / weight payload
- BODY local health rendering
- monthly review pattern
- monthly 3-direction photo storage and comparison pattern
- Supabase member-scoped cloud sync pattern
- WALK/QUEST local daily contract (`sug_walk_quest_v1`)

## Architecture decision

Do not fork the core health model into unrelated apps.

Use one common Lite data contract with mode-specific presentation:

```text
HealthKit / Apple Health / wearable
        ↓
BODY Lite common health record
        ↓
Community | Senior | Sports
        ↓
QUEST / family / coach / facility / municipality views
```

Existing BODY training logic stays isolated as Pro.

## Data contract draft

```json
{
  "memberId": "member-scoped-id",
  "date": "YYYY-MM-DD",
  "mode": "community|senior|sports",
  "health": {
    "steps": 0,
    "distanceKm": 0,
    "exerciseMinutes": 0,
    "activeEnergyKcal": 0,
    "sleepHours": null,
    "heartRate": null,
    "restingHeartRate": null,
    "hrvMs": null,
    "weightKg": null
  },
  "condition": {
    "fatigue": null,
    "pain": null,
    "subjective": null
  },
  "quest": {
    "checkins": 0,
    "points": 0,
    "participated": false
  },
  "syncedAt": "ISO-8601"
}
```

## Privacy / permissions

### Adult user
- health data: explicit consent
- photos: explicit consent
- GPS/watch mode: separate explicit opt-in
- family sharing: user selects exactly what is shared

### Minors / youth sports
- guardian consent required for health/photo/location data
- coach view must be narrower than guardian/user view
- live GPS is not a default sports-team feature

### Municipality
- default output is aggregate / program-effect data
- individual location should not be exposed as a normal municipality dashboard field

## Deferred

- electrical muscle-strength measurement
- dedicated muscle-strength hardware
- advanced AI training generation for Lite
- medical diagnosis
- continuous GPS monitoring without an explicit watch-mode contract
- advanced sport biomechanics (BIG3/PERFORMANCE remains separate)

## Commercial target

BODY Lite is not a separate throwaway app. It is the health-measurement layer that increases the contract value of QUEST and creates additional facility / team sales channels.

Initial product packages:

- QUEST + BODY Lite Community
- BODY Lite Senior + Watch option
- BODY Lite Sports
- BODY Pro (existing full product)
