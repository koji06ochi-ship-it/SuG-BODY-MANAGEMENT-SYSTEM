# S.u.G QUEST Flutter MVP

This folder is the native Flutter rebuild of S.u.G QUEST. The web/HTML experiments are no longer the implementation source of truth for the mobile app.

## P0 acceptance criteria

1. MAP is the first screen and occupies the main UI.
2. Real device GPS is shown as the player position.
3. A samurai player marker is anchored to the live position.
4. Tenma QUEST spots are map markers.
5. A 180 m arrival radius is enforced.
6. User selects a spot -> approaches -> GPS CHECK -> MISSION -> CARD GET.
7. Acquired cards persist locally and appear in COLLECTION.
8. Bottom navigation is MAP / QUEST / COLLECTION / SHOP / MY PAGE.
9. No BATTLE feature is allowed to block or replace the map-first loop before the 100-person pilot.

## Current pilot spots

- 國重刃物店
- 大阪天満宮
- 焼肉ホルモン瞭 天満店
- 天満つくし D-Wish
- マンホールSPOT

The coordinates currently match the latest Tenma map prototype and must be field-verified before production.

## Native permissions

The bootstrap workflow generates Android/iOS platform files and injects:

- Android: ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION
- iOS: NSLocationWhenInUseUsageDescription

## Validation

`.github/workflows/flutter-quest-bootstrap.yml` performs:

- Flutter scaffold generation
- `flutter pub get`
- `flutter analyze`
- automatic commit of the generated iOS/Android/Web project only when analysis succeeds

## Pilot rule

Do not add BODY, BATTLE, sponsor UI, LINE member features, or extra game systems until the P0 map loop is stable on a real iPhone.
