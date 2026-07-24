# Contributing to AxisUI

Thanks for your interest! AxisUI welcomes contributions of all sizes — bug fixes, new components, docs, and accessibility improvements.

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 11 (`npm i -g pnpm`)
- The repo uses **Nx** — run tasks with `npx nx ...`

## Setup

```bash
git clone https://github.com/Kishan009/axisui-ng
cd axisui-ng
pnpm install
```

## Common commands

```bash
npx nx run-many -t build          # build all libraries
npx nx run-many -t test           # tests (Jest + @testing-library/angular + jest-axe)
npx nx run-many -t lint           # lint
npx nx dev docs                   # run the docs site locally
npx nx run storybook:storybook    # run Storybook
```

Before opening a PR, make sure `npx nx affected -t lint test build` passes.

## Conventions (enforced in CI)

Every component follows these — checked by ESLint + `tools/session/check-conventions.sh`:

- **Signals only** — `input()`, `input.required()`, `output()`, `model()`, `viewChild()`, `contentChild()`. Never `@Input()` / `@Output()` / `@ViewChild()`.
- **Standalone + OnPush** — no `NgModule` in `libs/*`.
- **Selector prefix `ax-`** (e.g. `ax-button`); class name `AxButtonComponent`.
- **Class composition** via `cn()` (clsx + tailwind-merge) + `cva` for variants.
- **Design tokens** — Tailwind v4 `@theme` tokens in `libs/themes/src/tokens.css` are the single source of truth. **OKLCH only**; no hex/rgb in component code.
- **Logical CSS only** — `ms-`, `me-`, `start-`, `end-` (never `ml-`, `left-`, …).
- **Accessibility** — WAI-ARIA pattern + keyboard nav + a `jest-axe` test for every component, in 3 modes (LTR / RTL / dark).
- **SSR-safe** — no top-level `window` / `document` / `localStorage`; guard with `afterNextRender()` / `isPlatformBrowser()`.
- **No `any`** — use `unknown` + type guards.

The canonical reference is `libs/buttons/src/lib/button/` — copy that pattern when in doubt.

## Adding a component

1. Pick the category lib (`libs/buttons`, `libs/forms`, `libs/data`, …).
2. Copy the structure from `libs/buttons/src/lib/button/`: `<name>.variants.ts`, `<name>.types.ts`, `<name>.component.ts`, `<name>.spec.ts`, `<name>.stories.ts`, `index.ts`.
3. Re-export from the category barrel (`libs/<category>/src/index.ts`).
4. Add a docs page under `apps/docs/src/content/docs/docs/components/<category>/`.
5. Run `npx nx run <category>:test` and `npx nx run <category>:lint`.

## Reporting issues

- **Bugs** → [open an issue](https://github.com/Kishan009/axisui-ng/issues/new): include the AxisUI + Angular version, a minimal repro, and expected vs actual behavior.
- **Feature / component requests** → the feature / component-request templates.
- **Questions & ideas** → [GitHub Discussions](https://github.com/Kishan009/axisui-ng/discussions).
- **Security** → see [SECURITY.md](SECURITY.md); please don't open a public issue.

## Pull requests

1. Fork + branch (`git checkout -b feat/my-thing`).
2. Follow the conventions above; keep tests green.
3. Ensure `npx nx affected -t lint test build` passes.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for messages.
5. Open the PR against `main`; CI must pass.

## Code of conduct

By participating you agree to the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind, assume good faith.

## Recognition

Contributors are listed in [CONTRIBUTORS.md](CONTRIBUTORS.md), and `good first issue` labels mark friendly entry points. Thank you!
