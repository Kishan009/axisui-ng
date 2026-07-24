# Session Hooks — the enforcer

This directory contains the Claude Code hooks that enforce the conventions in `AGENTS.md` and `docs/conventions/`. The hooks are wired up in `.claude/settings.json`.

## The 6 hooks

| Hook | Event | Purpose |
|---|---|---|
| `load-context.sh` | SessionStart | Loads AGENTS.md, STATUS.md, latest handoff into every session |
| `frame-prompt.sh` | UserPromptSubmit | Injects a one-line "current state" reminder at the top of every user prompt |
| `check-conventions.sh` | PreToolUse (Edit/Write) | Blocks edits that violate conventions (exits with code 2) |
| `update-status.sh` | PostToolUse (Edit/Write) | Updates STATUS.md timestamp + per-day activity log |
| `require-handoff.sh` | Stop | Reminds the agent to generate a handoff and get user approval before stopping |
| `verify-clean-exit.sh` | SessionEnd | Writes PENDING.md if no handoff was written today |

## What each hook does (in detail)

### `load-context.sh`

Reads the master convention file, current project state, and the most recent handoff. Outputs a context block that gets prepended to the session's input. This is how the next session "remembers" what happened in the previous one.

### `frame-prompt.sh`

Adds a one-line state reminder like `[State: Phase 1 | Total: 15/48] [Last handoff: 2026-06-04]` to every user prompt. Keeps the agent oriented without loading the full context.

### `check-conventions.sh`

The **most important hook**. Runs on every Edit/Write. Scans the new content for forbidden patterns:

- `@Input()` / `@Output()` / `@ContentChild()` / `@ViewChild()` / `@HostBinding()` / `@HostListener()` decorators
- `@NgModule` in `libs/*`
- Hex color literals
- Directional Tailwind utilities (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`)
- Top-level `window` / `document` / `localStorage` / `matchMedia`
- `console.log`
- Direct `[style.*]` bindings
- `any` types

If any violation is found, the hook exits with code 2 and the edit is rejected. The error message tells the agent which convention was violated and points to the right docs.

### `update-status.sh`

After every Edit/Write, updates the "Last updated" timestamp in `docs/STATUS.md` and appends to `docs/.activity-YYYY-MM-DD.log` so the next session can see what was changed.

### `require-handoff.sh`

When the agent tries to stop, this fires. It tells the agent (via the response) to:

1. Generate a handoff file at `docs/handoff-YYYY-MM-DD-<id>.md`
2. Update `docs/STATUS.md`
3. Show the user the handoff
4. Get user approval ("approved" or similar) before stopping

### `verify-clean-exit.sh`

Runs on SessionEnd. If no handoff was written today, writes `docs/PENDING.md` so the next session knows the previous one ended uncleanly.

## Testing the hooks locally

```bash
# Test load-context.sh
bash tools/session/load-context.sh | head -50

# Test check-conventions.sh (should block)
echo '{"tool_input": {"file_path": "libs/buttons/src/lib/button/button.component.ts", "new_string": "@Input() foo = \"bar\";"}}' | bash tools/session/check-conventions.sh
echo "Exit: $?"

# Test check-conventions.sh (should pass)
echo '{"tool_input": {"file_path": "libs/buttons/src/lib/button/button.component.ts", "new_string": "variant = input<ButtonVariant>(\"primary\");"}}' | bash tools/session/check-conventions.sh
echo "Exit: $?"
```

## Adding a new check

1. Add the regex + violation message to `check-conventions.sh`
2. Document the new forbidden pattern in `AGENTS.md` and `docs/conventions/anti-patterns.md`
3. Test the new check by running the script with a sample payload that should be blocked

## See also

- `AGENTS.md` — the master convention file
- `docs/conventions/anti-patterns.md` — the full list of forbidden patterns with examples
- `.claude/settings.json` — the hook configuration
