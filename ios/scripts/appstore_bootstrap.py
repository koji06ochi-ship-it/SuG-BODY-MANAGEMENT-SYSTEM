#!/usr/bin/env python3
import base64
import json
import os
import sys
import time
from typing import Any, Dict, Optional

import jwt
import requests

API_BASE = "https://api.appstoreconnect.apple.com/v1"

KEY_ID = os.environ["ASC_API_KEY_ID"]
ISSUER_ID = os.environ["ASC_API_ISSUER_ID"]
P8_BASE64 = os.environ["ASC_API_KEY_P8_BASE64"]
BUNDLE_ID = os.environ.get("APP_BUNDLE_ID", "jp.sugosaka.member")
APP_NAME = os.environ.get("APP_NAME", "S.u.G")
APP_SKU = os.environ.get("APP_SKU", "SUG-IOS-20260908")
PRIMARY_LOCALE = os.environ.get("APP_PRIMARY_LOCALE", "ja")


def make_token() -> str:
    try:
        private_key = base64.b64decode(P8_BASE64).decode("utf-8")
    except Exception as exc:
        raise RuntimeError("ASC_API_KEY_P8_BASE64 must contain the base64-encoded .p8 file") from exc

    now = int(time.time())
    return jwt.encode(
        {"iss": ISSUER_ID, "iat": now - 5, "exp": now + 1200, "aud": "appstoreconnect-v1"},
        private_key,
        algorithm="ES256",
        headers={"kid": KEY_ID, "typ": "JWT"},
    )


TOKEN = make_token()
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


def api(method: str, path: str, *, params: Optional[Dict[str, Any]] = None, body: Optional[Dict[str, Any]] = None, allow=(200, 201)) -> Dict[str, Any]:
    url = API_BASE + path
    response = requests.request(method, url, headers=HEADERS, params=params, json=body, timeout=45)
    if response.status_code not in allow:
        detail = response.text[:4000]
        raise RuntimeError(f"{method} {path} failed: HTTP {response.status_code}\n{detail}")
    if not response.text.strip():
        return {}
    return response.json()


def find_bundle() -> Optional[Dict[str, Any]]:
    payload = api("GET", "/bundleIds", params={"filter[identifier]": BUNDLE_ID, "limit": 10})
    for item in payload.get("data", []):
        if item.get("attributes", {}).get("identifier") == BUNDLE_ID:
            return item
    return None


def ensure_bundle() -> Dict[str, Any]:
    existing = find_bundle()
    if existing:
        print(f"Bundle ID exists: {BUNDLE_ID} ({existing['id']})")
        return existing

    body = {
        "data": {
            "type": "bundleIds",
            "attributes": {
                "identifier": BUNDLE_ID,
                "name": APP_NAME,
                "platform": "IOS",
            },
        }
    }
    created = api("POST", "/bundleIds", body=body)["data"]
    print(f"Created Bundle ID: {BUNDLE_ID} ({created['id']})")
    return created


def ensure_healthkit(bundle_resource_id: str) -> None:
    payload = api("GET", f"/bundleIds/{bundle_resource_id}/bundleIdCapabilities")
    for item in payload.get("data", []):
        if item.get("attributes", {}).get("capabilityType") == "HEALTHKIT":
            print("HealthKit capability already enabled")
            return

    body = {
        "data": {
            "type": "bundleIdCapabilities",
            "attributes": {"capabilityType": "HEALTHKIT"},
            "relationships": {
                "bundleId": {
                    "data": {"type": "bundleIds", "id": bundle_resource_id}
                }
            },
        }
    }
    api("POST", "/bundleIdCapabilities", body=body)
    print("Enabled HealthKit capability")


def find_app() -> Optional[Dict[str, Any]]:
    try:
        payload = api("GET", "/apps", params={"filter[bundleId]": BUNDLE_ID, "limit": 10})
        for item in payload.get("data", []):
            if item.get("attributes", {}).get("bundleId") == BUNDLE_ID:
                return item
    except RuntimeError as exc:
        print(f"Bundle filter unavailable, falling back to app scan: {exc}")

    payload = api("GET", "/apps", params={"limit": 200})
    for item in payload.get("data", []):
        if item.get("attributes", {}).get("bundleId") == BUNDLE_ID:
            return item
    return None


def ensure_app() -> Dict[str, Any]:
    existing = find_app()
    if existing:
        print(f"App Store Connect app exists: {existing.get('attributes', {}).get('name')} ({existing['id']})")
        return existing

    body = {
        "data": {
            "type": "apps",
            "attributes": {
                "name": APP_NAME,
                "primaryLocale": PRIMARY_LOCALE,
                "bundleId": BUNDLE_ID,
                "sku": APP_SKU,
            },
        }
    }
    created = api("POST", "/apps", body=body)["data"]
    print(f"Created App Store Connect app: {APP_NAME} ({created['id']})")
    return created


def github_output(key: str, value: str) -> None:
    path = os.environ.get("GITHUB_OUTPUT")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as handle:
        handle.write(f"{key}={value}\n")


def main() -> int:
    bundle = ensure_bundle()
    ensure_healthkit(bundle["id"])
    app = ensure_app()

    github_output("bundle_resource_id", str(bundle["id"]))
    github_output("app_resource_id", str(app["id"]))
    github_output("bundle_identifier", BUNDLE_ID)

    print("Apple bootstrap complete")
    print(json.dumps({
        "bundleIdentifier": BUNDLE_ID,
        "bundleResourceId": bundle["id"],
        "appResourceId": app["id"],
        "appName": app.get("attributes", {}).get("name", APP_NAME),
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
