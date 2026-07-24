---
name: Pull request
about: Submit a change to the library
title: ''
labels: ''
assignees: ''
---

## What this PR does

A clear, concise description of the change.

## Why

What problem does this solve? Link to any related issues.

## How to verify

Step-by-step instructions for a reviewer to test the change.

- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes (including the 3-mode spec: LTR, RTL, dark)
- [ ] `pnpm run bundle-bench` is green (if you added/changed a component)
- [ ] Storybook story added/updated
- [ ] Docs page added/updated (if a new component)
- [ ] Changeset added (`pnpm changeset`)

## Convention compliance

- [ ] No `@Input()` / `@Output()` decorators (signal APIs only)
- [ ] No `@NgModule` (standalone only)
- [ ] No hex colors (OKLCH tokens via Tailwind)
- [ ] No directional Tailwind utilities (`ml-`, `mr-`, `left-`, `right-`)
- [ ] No `any` types
- [ ] No `console.log`
- [ ] No top-level `window` / `document` / `localStorage`

## Screenshots / videos

If the PR changes visual output, attach before/after screenshots or a short video.

## Additional context

Anything else the reviewer should know.
