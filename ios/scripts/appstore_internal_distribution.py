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


def request(method: str, path: str, *, params=None, body=None, allow=(200,)):
    response = requests.request(
        method,
        API_BASE + path,
        headers={"Authorization": f"Bearer {token()}", "Content-Type": "application/json"},
        params=params,
        json=body,
        timeout=60,
    )
    if response.status_code not in allow:
        raise RuntimeError(f"{method} {path} failed: HTTP {response.status_code}: {response.text[:1000]}")
    return response.json() if response.text.strip() else {}


def find_app_id() -> str:
    payload = request("GET", "/apps", params={"filter[bundleId]": BUNDLE_ID, "limit": 10})
    for item in payload.get("data", []):
        if item.get("attributes", {}).get("bundleId") == BUNDLE_ID:
            return str(item["id"])
    raise RuntimeError(f"Existing app was not found: {BUNDLE_ID}")


def find_build(app_id: str, number: str):
    payload = request(
        "GET",
        "/builds",
        params={"filter[app]": app_id, "filter[version]": number, "sort": "-uploadedDate", "limit": 5},
    )
    for item in payload.get("data", []):
        if item.get("attributes", {}).get("version") == number:
            return item
    raise RuntimeError(f"Build {number} was not found for {BUNDLE_ID}")


def internal_groups(build_id: str):
    payload = request(
        "GET",
        "/betaGroups",
        params={
            "filter[builds]": build_id,
            "filter[isInternalGroup]": "true",
            "limit": 200,
        },
    )
    return [item for item in payload.get("data", []) if item.get("attributes", {}).get("isInternalGroup") is True]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--build-number", required=True)
    parser.add_argument("--source-build-number", required=True)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    if not args.apply:
        raise RuntimeError("Refusing to change TestFlight access without --apply")

    app_id = find_app_id()
    target = find_build(app_id, args.build_number)
    source = find_build(app_id, args.source_build_number)
    if target.get("attributes", {}).get("processingState") != "VALID":
        raise RuntimeError(f"Build {args.build_number} is not VALID")

    source_groups = internal_groups(str(source["id"]))
    if not source_groups:
        raise RuntimeError(
            f"Build {args.source_build_number} has no existing internal beta group to reuse; "
            "no group or tester was created"
        )
    target_groups = internal_groups(str(target["id"]))
    target_ids = {str(item["id"]) for item in target_groups}
    missing = [item for item in source_groups if str(item["id"]) not in target_ids]

    print(json.dumps({
        "sourceBuild": args.source_build_number,
        "targetBuild": args.build_number,
        "existingInternalGroups": [item.get("attributes", {}).get("name") for item in source_groups],
        "groupsToAdd": [item.get("attributes", {}).get("name") for item in missing],
        "externalGroupsAdded": 0,
        "testersAdded": 0,
    }, ensure_ascii=False))

    if missing:
        request(
            "POST",
            f"/builds/{target['id']}/relationships/betaGroups",
            body={"data": [{"type": "betaGroups", "id": str(item["id"])} for item in missing]},
            allow=(204,),
        )

    expected = {str(item["id"]) for item in source_groups}
    deadline = time.monotonic() + 300
    while True:
        applied = internal_groups(str(target["id"]))
        applied_ids = {str(item["id"]) for item in applied}
        detail = request("GET", f"/builds/{target['id']}/buildBetaDetail").get("data", {}).get("attributes", {})
        state = detail.get("internalBuildState")
        if expected.issubset(applied_ids) and state == "IN_BETA_TESTING":
            print(json.dumps({
                "build": args.build_number,
                "internalBuildState": state,
                "internalGroups": [item.get("attributes", {}).get("name") for item in applied],
                "installableForExistingInternalGroup": True,
            }, ensure_ascii=False))
            return 0
        if time.monotonic() >= deadline:
            raise RuntimeError(f"Internal beta assignment did not become active; state={state}")
        time.sleep(15)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
