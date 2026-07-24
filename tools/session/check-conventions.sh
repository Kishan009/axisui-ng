#!/usr/bin/env bash
# PreToolUse hook for Edit/Write — validates the file about to be edited
# against the conventions. Blocks the edit (exits non-zero) if a violation
# is found. Silent on success.
#
# Exit codes:
#   0 — pass
#   2 — block with violation report on stderr

set -e

# Read tool input from stdin (Claude Code pipes it as JSON)
INPUT=$(cat)

# Extract file_path and new_string using node (project dep, always available)
read_file_path() {
  printf '%s' "$INPUT" | node -e "
    let s = '';
    process.stdin.on('data', c => s += c);
    process.stdin.on('end', () => {
      try {
        const d = JSON.parse(s);
        process.stdout.write(d.tool_input?.file_path ?? '');
      } catch (e) {
        process.stdout.write('');
      }
    });
  " 2>/dev/null
}

read_new_content() {
  printf '%s' "$INPUT" | node -e "
    let s = '';
    process.stdin.on('data', c => s += c);
    process.stdin.on('end', () => {
      try {
        const d = JSON.parse(s);
        const v = d.tool_input?.new_string ?? d.tool_input?.content ?? '';
        process.stdout.write(v);
      } catch (e) {
        process.stdout.write('');
      }
    });
  " 2>/dev/null
}

FILE_PATH=$(read_file_path || echo "")
NEW_CONTENT=$(read_new_content || echo "")

# Empty inputs = nothing to check, pass
[ -z "$FILE_PATH" ] && exit 0
[ -z "$NEW_CONTENT" ] && exit 0

# Skip non-source files (.mdx is documentation/markdown, not Angular source)
case "$FILE_PATH" in
  *.md|*.mdx|*.json|*.css|*.html|*.yml|*.yaml|*.sh) exit 0 ;;
esac

VIOLATIONS=""

# 1. Forbidden decorators (Angular)
if echo "$NEW_CONTENT" | grep -qE '@(Input|Output|Bindable|ContentChild|ViewChild|HostBinding|HostListener)\('; then
  VIOLATIONS+="\n❌ FORBIDDEN: @Input() / @Output() / @ContentChild() / @ViewChild() / @HostBinding() / @HostListener() decorators.\n"
  VIOLATIONS+="   Use signal APIs: input(), output(), contentChild(), viewChild(), and the host object in @Component.\n"
  VIOLATIONS+="   See AGENTS.md → Conventions → Signal APIs only.\n"
fi

# 2. NgModule in libs
if echo "$NEW_CONTENT" | grep -qE '@NgModule'; then
  case "$FILE_PATH" in
    libs/*)
      VIOLATIONS+="\n❌ FORBIDDEN: @NgModule in libs/*.\n"
      VIOLATIONS+="   All components are standalone.\n"
      ;;
  esac
fi

# 3. Hex color literals in TS/HTML (allow in comments)
if echo "$NEW_CONTENT" | grep -E '#[0-9a-fA-F]{3,8}\b' | grep -vE '^[[:space:]]*(//|\*|/\*)' | grep -q .; then
  VIOLATIONS+="\n❌ FORBIDDEN: hex color literal in source.\n"
  VIOLATIONS+="   Use Tailwind utility classes that resolve to OKLCH tokens (e.g., bg-primary).\n"
fi

# 4. Directional Tailwind utilities
if echo "$NEW_CONTENT" | grep -qE '\b(ml|mr|pl|pr|left|right)-[0-9]+'; then
  VIOLATIONS+="\n❌ FORBIDDEN: directional Tailwind utilities (ml-, mr-, pl-, pr-, left-, right-).\n"
  VIOLATIONS+="   Use logical variants: ms-, me-, ps-, pe-, start-, end-.\n"
  VIOLATIONS+="   See AGENTS.md → Spacing/position.\n"
fi

# 5. window/document at top level (heuristic: must be near a guard)
if echo "$NEW_CONTENT" | grep -qE '\b(window|document|localStorage|matchMedia)\.'; then
  if ! echo "$NEW_CONTENT" | grep -B2 -A2 -E '\b(window|document|localStorage|matchMedia)\.' | grep -qE '(afterNextRender|ngOnInit|constructor|@Inject|PLATFORM_ID|isPlatformBrowser|@HostListener)'; then
    VIOLATIONS+="\n❌ FORBIDDEN: window/document/localStorage/matchMedia likely at top level.\n"
    VIOLATIONS+="   Wrap in afterNextRender() or guard with isPlatformBrowser().\n"
  fi
fi

# 6. console.log
if echo "$NEW_CONTENT" | grep -qE 'console\.log'; then
  VIOLATIONS+="\n❌ FORBIDDEN: console.log.\n"
  VIOLATIONS+="   Use a logger service (libs/observability) or remove the log.\n"
fi

# 7. Direct [style.*] binding
if echo "$NEW_CONTENT" | grep -qE '\[style\.[a-zA-Z-]+\]'; then
  VIOLATIONS+="\n❌ FORBIDDEN: direct [style.*] binding on elements.\n"
  VIOLATIONS+="   Use cn() and Tailwind classes, or [class.*] for conditional classes.\n"
fi

# 8. any types
if echo "$NEW_CONTENT" | grep -qE ':\s*any\b'; then
  VIOLATIONS+="\n❌ FORBIDDEN: any type.\n"
  VIOLATIONS+="   Use unknown + a type guard.\n"
fi

if [ -n "$VIOLATIONS" ]; then
  echo -e "\n🚫 Convention violation(s) detected in $FILE_PATH:\n$VIOLATIONS" >&2
  exit 2  # Block the edit
fi

exit 0
