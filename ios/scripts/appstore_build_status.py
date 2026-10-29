#!/usr/bin/env python3
import argparse
import base64
import json
import os
import sys
import time

import jwt
import requests


API_BASE = "https://api.appstoreconnect.apple.com/v1"
KEY_ID = os.environ["ASC_API_KEY_ID"]
ISSUER_ID = os.environ["ASC_API_ISSUER_ID"]
P8_BASE64 = os.environ["ASC_API_KEY_P8_BASE64"]
BUNDLE_ID = os.environ.get("APP_BUNDLE_ID", "jp.sugosaka.member")


def token() -> str:
    private_key = base64.b64decode(P8_BASE64).decode("utf-8")
    now = int(time.time())
    return jwt.encode(
        {"iss": ISSUER_ID, "iat": now - 5, "exp": now + 1200, "aud": "appstoreconnect-v1"},
        private_key,
        algorithm="ES256",
        headers={"kid": KEY_ID, "typ": "JWT"},
    )


def get(path: str, params=None, allow=(200,)):
    response = requests.get(
        API_BASE + path,
        headers={"Authorization": f"Bearer {token()}"},
        params=params,
        timeout=60,
    )
    if response.status_code not in allow:
        raise RuntimeError(f"GET {path} failed: HTTP {response.status_code}: {response.text[:1000]}")
    return response.json() if response.text.strip() else {}


def app_id() -> str:
    payload = get("/apps", {"filter[bundleId]": BUNDLE_ID, "limit": 10})
    for item in payload.get("data", []):
        if item.get("attributes", {}).get("bundleId") == BUNDLE_ID:
            return str(item["id"])
    raise RuntimeError(f"Existing App Store Connect app was not found: {BUNDLE_ID}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build-number", required=True)
    parser.add_argument("--wait-seconds", type=int, default=900)
    parser.add_argument("--interval-seconds", type=int, default=30)
    args = parser.parse_args()

    existing_app_id = app_id()
    deadline = time.monotonic() + args.wait_seconds
    last = None

    while True:
        builds = get(
            "/builds",
            {
                "filter[app]": existing_app_id,
                "filter[version]": args.build_number,
                "sort": "-uploadedDate",
                "limit": 5,
            },
        ).get("data", [])

        if builds:
            build = builds[0]
            attributes = build.get("attributes", {})
            processing = attributes.get("processingState", "UNKNOWN")
            beta = {}
            if processing == "VALID":
                beta = get(
                    f"/builds/{build['id']}/buildBetaDetail",
                    allow=(200, 404),
                ).get("data", {}).get("attributes", {})
            status = {
                "bundleId": BUNDLE_ID,
                "version": attributes.get("version"),
                "processingState": processing,
                "uploadedDate": attributes.get("uploadedDate"),
                "usesNonExemptEncryption": attributes.get("usesNonExemptEncryption"),
                "internalBuildState": beta.get("internalBuildState"),
                "externalBuildState": beta.get("externalBuildState"),
            }
            if status != last:
                print(json.dumps(status, ensure_ascii=False), flush=True)
                last = status

            if processing in {"FAILED", "INVALID"}:
                return 1
            if processing == "VALID" and status["internalBuildState"] in {
                "READY_FOR_BETA_TESTING",
                "IN_BETA_TESTING",
            }:
                return 0

        if time.monotonic() >= deadline:
            print("Timed out before build became available for internal TestFlight testing", file=sys.stderr)
            return 2
        time.sleep(args.interval_seconds)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
