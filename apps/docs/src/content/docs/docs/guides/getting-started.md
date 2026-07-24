---
title: Getting started
description: Install @axisui-ng/angular and render your first component.
---

`@axisui-ng/angular` is a signals-first Angular 20 component library. Components are standalone,
`OnPush`, and themed with Tailwind v4 tokens.

## Install

```bash
pnpm add @axisui-ng/angular
```

Each category also ships as its own package (`@axisui-ng/buttons`, `@axisui-ng/forms`, …) so you can depend
on only what you use. The meta-package re-exports them all.

## Theme tokens

The components read their colors, radii, spacing, and motion from Tailwind v4 `@theme` tokens. Import
the token stylesheet once at your app root:

```css
@import '@axisui-ng/themes/tokens.css';
```

Density, industry presets, and light/dark are driven by `data-density`, `data-industry`, and the
`.dark` class on an ancestor element — no per-component inputs.

## Use a component

Components are standalone — import the one you need directly:

```ts
import { Component } from '@angular/core';
import { AxButtonComponent } from '@axisui-ng/buttons';

@Component({
  selector: 'app-example',
  imports: [AxButtonComponent],
  template: `<ax-button variant="primary" (clickEvent)="save()">Save</ax-button>`,
})
export class ExampleComponent {
  save() {}
}
```

## Interactive examples

Every component has a live Storybook story with controls. Run it locally:

```bash
pnpm storybook
```
