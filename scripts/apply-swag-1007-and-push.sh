#!/usr/bin/env bash
set -euo pipefail
# This release's actual application is done from a verified fresh checkout.
# Never use checkout -B, force push, or extract an unverified ZIP over a working tree.
echo 'Use the verified SWAG release package. This helper does not overwrite or push files.'
git status --short
