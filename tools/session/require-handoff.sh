#!/usr/bin/env bash
# Stop hook — when the agent tries to stop, this writes a marker and
# injects a reminder that the agent must generate a handoff and get
# user approval before the session can end.
#
# Exit code 0 always (we don't block stop — we just remind).

set -e

# Touch a "stop requested" flag
mkdir -p .claude
touch .claude/.stop-requested

# Output a JSON decision that the system uses to inject a system-reminder
cat <<EOF
{
  "decision": "approve",
  "reason": "Stop requested. Before stopping: (1) generate a session handoff at docs/handoff-\$(date +%Y-%m-%d)-<session-id>.md, (2) update docs/STATUS.md with new state, (3) show the user the full handoff in your response, (4) ask the user to approve with 'approved' or similar. Do not stop without explicit user approval."
}
EOF

exit 0
