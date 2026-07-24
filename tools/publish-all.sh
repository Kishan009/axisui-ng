#!/usr/bin/env bash
# Publish all public AxisUI packages to npm, in dependency order (meta last).
# IDEMPOTENT: skips private packages and any name@version already on the registry,
# so it is safe to re-run after a partial publish. Pure shell — needs bash + npm + curl.
# Run from repo root AFTER `nx run-many -t build` and `nx build-schematics ui`.
#
#   bash tools/publish-all.sh            # interactive 2FA
#   bash tools/publish-all.sh 123456     # pass a one-time password
set -uo pipefail
cd "$(dirname "$0")/.."

OTP="${1:-}"
otp_flag=(); [ -n "$OTP" ] && otp_flag=(--otp "$OTP")

field() { grep -m1 "\"$2\"" "$1" | sed "s/.*\"$2\"[[:space:]]*:[[:space:]]*\"\{0,1\}//; s/[\",].*//; s/[[:space:]]*$//"; }

publish_one() {
  local d="$1" pj="$1/package.json"
  local name ver enc code
  name=$(field "$pj" name); ver=$(field "$pj" version)
  enc="${name/@/%40}"; enc="${enc//\//%2f}"
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://registry.npmjs.org/$enc/$ver")
  if [ "$code" = "200" ]; then echo "already live, skip: $name@$ver"; return 0; fi
  echo ">> publishing $name@$ver"
  ( cd "$d" && npm publish "${otp_flag[@]}" ) || { echo "!! FAILED: $name"; return 1; }
}

fail=0; meta=""
for d in dist/libs/*/; do
  pj="$d/package.json"; [ -f "$pj" ] || continue
  grep -qE '"private"[[:space:]]*:[[:space:]]*true' "$pj" && { echo "skip (private): $(field "$pj" name)"; continue; }
  [ "$(field "$pj" name)" = "@axisui-ng/angular" ] && { meta="$d"; continue; }
  publish_one "$d" || fail=1
done
[ -n "$meta" ] && { publish_one "$meta" || fail=1; }

if [ "$fail" = 0 ]; then echo "DONE — all public packages are live."; else echo "SOME PUBLISHES FAILED — re-run to retry the missing ones."; exit 1; fi
