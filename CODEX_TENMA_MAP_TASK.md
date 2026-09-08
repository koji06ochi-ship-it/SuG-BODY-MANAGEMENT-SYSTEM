# Codex execution brief — S.u.G QUEST Tenma map rebuild

Source task: GitHub Issue #44

## Goal
Rebuild the Tenma HOME map so the iPhone Safari result no longer looks pixelated. Preserve the S.u.G QUEST illustrated Sengoku-map direction while keeping GPS/QUEST behavior functional.

## Do not touch
- `quest-live.html` (keep current stable LIVE route unchanged)
- existing card data
- existing COLLECTION behavior
- existing BODY route/integration
- existing images unless creating new derived assets alongside them

## Required output
Create a new file only:
- `quest-map-home-tenma-codex-v1.html`

Do not overwrite `quest-map-home-loc-han-v18.html`.

## Rendering architecture
Do not stretch a 480px screenshot as a full-screen background.

Use separate layers:
1. High-resolution illustrated Tenma world/background
2. Player/chibi layer
3. QUEST point layer
4. GPS/status/NEXT QUEST UI layer
5. Bottom navigation layer

Retina requirement: the principal raster asset must provide at least ~2 image pixels per CSS pixel at the target iPhone viewport whenever practical. Prefer a source width >= 1400 px for a ~700 px CSS rendering width. If only a smaller source exists, do not enlarge it with nearest-neighbor/pixelated rendering. Use normal interpolation and constrain its display scale; structure the code so a higher-resolution asset can be dropped in later without changing logic.

## Visual target
- illustrated aerial Osaka/Tenma world
- parchment + black + gold Sengoku UI
- black/gold chibi warrior
- vertical QUEST placards
- blue walking footprints / current-position effect
- NEXT QUEST card
- right-side current-location/map controls
- five-item bottom navigation

## Point/data behavior
Markers must be DOM/JS layers, not baked into the background image.

Implement at minimum:
- `焼肉ホルモン瞭 天満店` — partner point, icon `🥩`
- `大阪天満宮` — icon `⛩️`
- `刀剣 國重`
- `天満つくし`
- `名物ばぁちゃんのたこ焼き`

For unverified coordinates use:
```js
location_pending: true
lat: null
lng: null
```
Never invent coordinates.

General third-party businesses must NOT appear automatically. Only S.u.G QUEST-selected businesses should appear.

Public/safety icons must remain immediately recognizable when later connected:
- police/koban `🚓`
- AED `➕`
- emergency `🚑`
- bus `🚌`
- train `🚃`
- taxi `🚕`
- manhole `🕳️`

## GPS rules
Use `navigator.geolocation.watchPosition`.
- live current position
- live distance to selected point
- walking-distance accumulation
- >12 km/h cannot satisfy GET
- require >=15 m walking during active session
- selected point must be within its configured arrival radius
- `ここへ行く` opens Apple Maps walking directions

## Interaction
Tap point -> bottom sheet with:
- point name
- category
- current distance
- GET condition
- reward/card/discovery
- Apple Maps button
- GPS CHECK / GET button

## Acceptance checks
Before declaring complete:
1. Verify no obvious mosaic/pixelation on an iPhone-like 390x844 viewport at DPR 3.
2. Ensure background uses high-resolution asset, not a 480px variant.
3. Ensure chibi/markers/UI remain sharp as independent layers.
4. GPS watch code exists and updates status.
5. Point tap opens details.
6. Distance calculation works for known coordinates.
7. `location_pending` points do not get fake coordinates.
8. Existing LIVE remains untouched.
9. Provide preview URL only for the new file.

## Important
Do not solve the problem by returning to raw OSM as the main visual. Do not blur the low-resolution image to hide artifacts. The target is a real S.u.G QUEST illustrated game HOME, not a decorated ordinary map.
