#!/usr/bin/env bash
# UserPromptSubmit hook — injects a one-line "current state" reminder
# at the top of every user prompt.
#
# Exit code 0 always.

set -e

# Read the user's prompt from stdin
USER_PROMPT=$(cat)

# Build a state summary
SUMMARY=""

if [ -f docs/STATUS.md ]; then
  CURRENT_PHASE=$(grep -E "^\*\*Phase:" docs/STATUS.md | head -1 | sed 's/.*: //' | xargs)
  [ -z "$CURRENT_PHASE" ] && CURRENT_PHASE=$(grep -E "^## Current phase" -A1 docs/STATUS.md | tail -1 | xargs)
  SHIPPED=$(grep -E "^\*\*Total:" docs/STATUS.md | head -1 | xargs)
  if [ -n "$CURRENT_PHASE" ]; then
    SUMMARY="[State: $CURRENT_PHASE"
    [ -n "$SHIPPED" ] && SUMMARY+=" | $SHIPPED"
    SUMMARY+="]"
  fi
fi

LATEST_HANDOFF=$(ls -t docs/handoff-*.md 2>/dev/null | head -1 || true)
if [ -n "$LATEST_HANDOFF" ]; then
  HANDOFF_DATE=$(basename "$LATEST_HANDOFF" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
  SUMMARY+=" [Last handoff: $HANDOFF_DATE]"
fi

# Output the framed prompt (this gets prepended to the prompt)
echo -e "$SUMMARY\n\n$USER_PROMPT"
exit 0
