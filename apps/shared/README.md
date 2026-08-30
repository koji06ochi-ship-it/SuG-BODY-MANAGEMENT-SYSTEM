# Shared Contract

Cross-app sharing is intentionally minimal.

Allowed:
- member identity
- compact summary handoff
- explicit navigation between apps

Not allowed:
- importing another app's UI into the current app
- duplicating another app's analysis engine
- rebuilding a monolithic HOME

Each app owns its own data and UI. Shared state exists only for deliberate handoff.