# AxisUI

> The modern **Angular 20** UI component library — signals-first, standalone, accessible. 100+ components, Tailwind v4 theming, MIT and free.

**[Docs](https://axisui.dev)** · **[Live demo](https://axisui-demo.pages.dev)** · **[Storybook](https://axisui-storybook.pages.dev)** · **[npm](https://www.npmjs.com/package/@axisui-ng/angular)**

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

## Documentation

- **Docs & components:** https://axisui.dev
- **Live demo:** https://axisui-demo.pages.dev
- **Storybook:** https://axisui-storybook.pages.dev

## Contributing

Contributions, bug reports, and questions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Please open an issue for bugs and a discussion for questions and ideas.

## License

[MIT](LICENSE). A commercial Pro tier (a visual Theme/Token Studio and more) is planned separately; everything in this repository is MIT and free.
