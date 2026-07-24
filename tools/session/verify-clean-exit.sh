#!/usr/bin/env bash
# SessionEnd hook — verifies the session ended cleanly.
# If no handoff was written today, writes a PENDING warning.
#
# Exit code 0 always.

set -e

TODAY=$(date +%Y-%m-%d)
HANDOFF=$(ls -t docs/handoff-${TODAY}-*.md 2>/dev/null | head -1 || true)

if [ -z "$HANDOFF" ]; then
  # No handoff for today — write a PENDING warning
  cat > docs/PENDING.md <<EOF
# ⚠️ Previous session ended without a handoff

Date: $TODAY

The previous session was closed without writing a session handoff file.
Manual review is needed to determine what was done.

## Recovery steps

1. Check git log for commits between $(date -d 'yesterday' +%Y-%m-%d 2>/dev/null || date -v-1d +%Y-%m-%d) and today
2. Inspect \`docs/.activity-*.log\` files for files touched
3. Run \`git status\` to see any uncommitted work
4. Write a recovery handoff at \`docs/handoff-$TODAY-recovery.md\` documenting what was done
EOF
fi

exit 0
