# Contributing to @axisui-ng/angular

Thanks for your interest in contributing! This library is built by a small team and the community, and we welcome PRs of all sizes.

## Quick start

```bash
# Fork the repo, then clone
git clone <your-fork-url>
cd axisui-angular

# Install pnpm (if you don't have it)
npm install -g pnpm

# Install dependencies
pnpm install

# Run the build
pnpm build

# Run tests
pnpm test

# Run the docs site
pnpm docs
```

## Code of conduct

By participating, you agree to abide by the [Contributor Covenant](CODE_OF_CONDUCT.md). Be kind, be patient, assume good faith.

## How to contribute

### Reporting bugs

Open a GitHub issue using the **bug report** template. Include:
- A clear, reproducible description
- The library version (`pnpm list @axisui-ng/angular`)
- The Angular version (`pnpm list @angular/core`)
- A minimal code example

### Suggesting features

Open a GitHub issue using the **feature request** template. For new components, use the **component request** template — that feeds directly into the v0.2+ roadmap.

### Submitting PRs

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Make your changes — follow the conventions in [AGENTS.md](AGENTS.md) and [docs/conventions/components.md](docs/conventions/components.md)
4. Add tests — every component has a 3-mode spec (LTR, RTL, dark)
5. Add a changeset: `pnpm changeset`
6. Run the full check: `pnpm affected -t lint test build`
7. Push and open a PR

## Adding a new component

The full step-by-step is in [AGENTS.md](AGENTS.md#adding-a-new-component-do-this-in-order). TL;DR:

1. Identify the right category lib
2. Copy the canonical pattern from `libs/buttons/src/lib/button/`
3. Read [docs/conventions/components.md](docs/conventions/components.md)
4. Create the files (variants, types, component, spec, stories, index)
5. Re-export from the category barrel
6. Add a Storybook story + docs page
7. Run tests in 3 modes + bundle bench

## Adding a new MCP tool

See [docs/conventions/mcp.md](docs/conventions/mcp.md). The pattern is in `libs/mcp/src/tools/get-component.ts`.

## Code style

- All conventions are enforced by the PreToolUse hook (`tools/session/check-conventions.sh`) — you can't merge code that violates them
- TypeScript strict mode (no `any`)
- Conventional Commits
- Conventional Comments in PRs

## Review SLA

- **Bug fixes:** 1 week
- **Feature requests:** best effort, prioritized by 👍 reactions
- **Pro tier bugs:** 48-hour response on issues tagged `pro`

## Recognition

We maintain a [CONTRIBUTORS.md](CONTRIBUTORS.md) file with every contributor. Monthly "top contributor" callouts in the changelog. The "good first issue" label marks accessible entry points for new contributors.

## Questions?

Open a GitHub Discussion or ask in the Discord (link TBD).
