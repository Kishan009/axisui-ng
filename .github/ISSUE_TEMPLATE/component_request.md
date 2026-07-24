---
name: Component request
about: Request a new component (feeds the v0.2+ roadmap)
title: "[Component]: "
labels: component-request
assignees: ''
---

## Component name

What should the component be called? (selector will be `ax-<name>`)

## What it does

A clear description of the component's purpose.

## Use cases

When would you reach for this component? What problem does it solve?

## API sketch

What inputs, outputs, and slots would it have? A rough sketch is fine.

```ts
// Pseudo-API
@Component({ selector: 'ax-thing' })
export class AxThingComponent {
  variant = input<'a' | 'b'>('a');
  // ...
}
```

## Examples

Code examples, screenshots, or links to similar components in other libraries (Material, Radix, shadcn, etc.).

## Category

Which category lib should it live in?
- [ ] Primitives (`libs/primitives`)
- [ ] Buttons (`libs/buttons`)
- [ ] Forms (`libs/forms`)
- [ ] Data display (`libs/data`)
- [ ] Feedback (`libs/feedback`)
- [ ] Overlays (`libs/overlays`)
- [ ] Navigation (`libs/navigation`)
- [ ] Misc (`libs/misc`)
- [ ] Pro (industry pack)

## License tier

Should this be MIT or Pro?
- [ ] MIT (core library, free)
- [ ] Pro (paid add-on)

## Priority

How important is this to you?
- [ ] Critical (blocking my adoption)
- [ ] High (would significantly improve my experience)
- [ ] Medium (nice to have)
- [ ] Low (would be nice, but I can work around it)

## Willing to contribute?

- [ ] I'd like to implement this myself (a maintainer will review and guide)
- [ ] I'd like to help with design / API review
- [ ] I just need it, can't contribute
