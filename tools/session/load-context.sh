#!/usr/bin/env bash
# SessionStart hook — reads convention files, status, latest handoff.
# Outputs a context block that Claude Code prepends to the session input.
#
# Exit code 0 always (we never block session start).

set -e

CONTEXT=""

# 1. Always-include: master convention
if [ -f AGENTS.md ]; then
  CONTEXT+="\n\n## AGENTS.md (master conventions)\n"
  CONTEXT+="$(cat AGENTS.md)\n"
fi

# 2. Current state
if [ -f docs/STATUS.md ]; then
  CONTEXT+="\n\n## Current project state (docs/STATUS.md)\n"
  CONTEXT+="$(cat docs/STATUS.md)\n"
fi

# 3. Latest handoff
LATEST_HANDOFF=$(ls -t docs/handoff-*.md 2>/dev/null | head -1 || true)
if [ -n "$LATEST_HANDOFF" ]; then
  CONTEXT+="\n\n## Latest session handoff ($LATEST_HANDOFF)\n"
  CONTEXT+="$(cat "$LATEST_HANDOFF")\n"
fi

# 4. Plan reference
CONTEXT+="\n\n## Plan reference\n"
CONTEXT+="Full plan: C:\\\\Users\\\\kisha\\\\.claude\\\\plans\\\\create-plan-for-creating-staged-cook.md\n"
CONTEXT+="Read the relevant section when working on a specific phase/component.\n"

# 5. Pending warnings
if [ -f docs/PENDING.md ] && [ -s docs/PENDING.md ]; then
  CONTEXT+="\n\n## ⚠️ PENDING warnings from previous session\n"
  CONTEXT+="$(cat docs/PENDING.md)\n"
  CONTEXT+="\n(Acknowledge these after reading.)\n"
fi

# 6. Canonical pattern pointer
CONTEXT+="\n\n## Canonical pattern (read before adding any new component)\n"
CONTEXT+="libs/buttons/src/lib/button/button.component.ts and its siblings.\n"
CONTEXT+="docs/conventions/components.md.\n"

echo -e "$CONTEXT"
exit 0
