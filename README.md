# AxisUI

> The modern **Angular 20** UI component library — signals-first, standalone, accessible. 100+ components, Tailwind v4 theming, MIT and free.

**[Docs](https://axisui.dev)** · **[Live demo](https://axisui-demo.pages.dev)** · **[Storybook](https://axisui-storybook.pages.dev)** · **[npm](https://www.npmjs.com/package/@axisui-ng/angular)**

<p>
  <a href="https://www.npmjs.com/package/@axisui-ng/angular"><img alt="npm version" src="https://img.shields.io/npm/v/@axisui-ng/angular?color=e23a2e&label=npm"></a>
  <a href="https://github.com/Kishan009/axisui-ng/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Kishan009/axisui-ng/ci.yml?branch=main&label=CI"></a>
  <a href="LICENSE"><img alt="license MIT" src="https://img.shields.io/npm/l/@axisui-ng/angular?color=e23a2e"></a>
  <a href="https://bundlephobia.com/package/@axisui-ng/buttons"><img alt="minzipped size" src="https://img.shields.io/bundlephobia/minzip/@axisui-ng/buttons?label=buttons%20minzip&color=e23a2e"></a>
  <img alt="Angular 20" src="https://img.shields.io/badge/Angular-20-dd0031?logo=angular&logoColor=white">
  <a href="https://github.com/Kishan009/axisui-ng"><img alt="GitHub stars" src="https://img.shields.io/github/stars/Kishan009/axisui-ng?color=e23a2e"></a>
</p>

## Why

The Angular ecosystem has a persistent aesthetic gap. The libraries that defined "modern component design" since 2023 (shadcn/ui, Radix, Park UI) exist primarily for React, with thin or no Angular ports. Teams building Angular products face a sharp tradeoff: use Angular Material and accept its aesthetic, or assemble ad-hoc Tailwind + headless primitives and absorb the inconsistency cost.

AxisUI closes that gap. Signal-native. Standalone-by-default. Tailwind v4 + OKLCH. Accessible in CI. Install only what you need.

## Install

```bash
# everything, one install (wires up Tailwind v4 + tokens):
ng add @axisui-ng/angular

# or install only what you need:
npm i @axisui-ng/buttons @axisui-ng/forms
```

## Usage

```ts
import { Component } from '@angular/core';
import { AxButtonComponent } from '@axisui-ng/angular';

@Component({
  imports: [AxButtonComponent],
  template: `
    <ax-button variant="primary" size="md" (clickEvent)="onClick()">
      Click me
    </ax-button>
  `,
})
export class MyComponent {}
```

## What you get

- **100+ components** — primitives, buttons, forms, data display, charts, overlays, navigation, feedback, layout, and more.
- **Angular 20, done right** — signals (`input()` / `output()` / `model()`), standalone, OnPush, zoneless-ready. No `NgModule`.
- **Accessible by default** — WCAG 2.2 AA, with `jest-axe` run on every component in CI across LTR / RTL / dark.
- **Tailwind v4 + OKLCH theming** — density, industry presets, and a light/dark cascade from `@theme` tokens.
- **Install-as-you-go** — per-category packages; a consumer who only wants a Button ships a Button.
- **SSR-safe + zoneless-ready** — works in Angular Universal and both zoneless and Zone.js apps.

## Showcase

Production-grade application templates, built entirely from AxisUI components — proof the primitives compose into real products, not just isolated demos:

| | | |
|---|---|---|
| [Analytics](https://axisui-demo.pages.dev/analytics) | [Banking](https://axisui-demo.pages.dev/banking) | [CRM](https://axisui-demo.pages.dev/crm) |
| [Healthcare](https://axisui-demo.pages.dev/healthcare) | [Logistics](https://axisui-demo.pages.dev/logistics) | [Automotive](https://axisui-demo.pages.dev/automotive) |
| [Government](https://axisui-demo.pages.dev/government) | [Data grid](https://axisui-demo.pages.dev/data-grid) | [UI Kit](https://axisui-demo.pages.dev/ui-kit) |

Also included: [auth](https://axisui-demo.pages.dev/auth) and [landing](https://axisui-demo.pages.dev/landing) pages, a ⌘K command palette, and a live theme configurator. **[Browse the full demo →](https://axisui-demo.pages.dev)**

## Documentation

- **Docs & components:** https://axisui.dev
- **Live demo:** https://axisui-demo.pages.dev
- **Storybook:** https://axisui-storybook.pages.dev

## Contributing

Contributions, bug reports, and questions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Please open an issue for bugs and a discussion for questions and ideas.

## License

[MIT](LICENSE). A commercial Pro tier (a visual Theme/Token Studio and more) is planned separately; everything in this repository is MIT and free.
