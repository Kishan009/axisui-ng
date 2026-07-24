#!/usr/bin/env bash
# PostToolUse hook for Edit/Write — auto-updates docs/STATUS.md timestamp
# and appends to a per-session activity log.
#
# Exit code 0 always.

set -e

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | grep -oE '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')
[ -z "$FILE_PATH" ] && exit 0

# Skip non-source files
case "$FILE_PATH" in
  *.md) exit 0 ;;
esac

# Skip if this is a tool we don't want to track
[ "$FILE_PATH" = "docs/PENDING.md" ] && exit 0

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Log to per-day activity file
ACTIVITY_FILE="docs/.activity-$(date +%Y-%m-%d).log"
echo "$TIMESTAMP $FILE_PATH" >> "$ACTIVITY_FILE"

# Update STATUS.md's "last updated" timestamp
if [ -f docs/STATUS.md ]; then
  # Cross-platform: use sed -i with backup extension
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/^Last updated: .*/Last updated: $TIMESTAMP/" docs/STATUS.md
  else
    sed -i "s/^Last updated: .*/Last updated: $TIMESTAMP/" docs/STATUS.md
  fi
fi

exit 0
