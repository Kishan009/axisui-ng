# AxisUI demo (Apollo-style template)

Live showcase for `@axisui-ng/angular`: application shell + sample pages that prove token-first theming.

**UI direction:** Swiss Modernism 2.0 (via ui-ux-pro-max) — rational hierarchy, 12-col grids, Fira Sans / Fira Code for the demo shell. Colors stay on `@axisui-ng/themes` OKLCH tokens (presets / dark / density / trust), not a parallel palette.

## Run

```bash
npx nx serve demo
```

## Structure (packaging-ready)

| Folder | Role |
|---|---|
| `src/app/layout/` | **Required** application shell (sidebar, topbar, configurator, theme service, command palette, toasts) |
| `src/app/pages/` | **Optional** sample content |

Theme controls use `@axisui-ng/themes` (`setDarkMode`, `setIndustry`, `setDensity`, `setTrustTier`) only.

## Routes

### Industry apps (deep compositions)

| Route | Showcase focus |
|---|---|
| `/` | E-commerce — product cards, aspect-ratio media, channel segmented, returns timeline, fulfillment stepper |
| `/banking` | Banking — avatars, gauges, Pro data-table ledger, transfer dialog (form-field/mask), leading CTA |
| `/healthcare` | Healthcare — care gauges, booking sheet (date/time/number), CDK virtual patient list |
| `/analytics` | Analytics — KPI cards, heatmap, report stepper, period segmented |
| `/crm` | CRM — account tree, tabs, activity timeline, rich context/view menus |
| `/logistics` | Logistics — dock gauge, hub combobox, reschedule dialog, context actions |
| `/automotive` | Automotive — fault heatmap, service stepper, alerts menu, advisor avatars |
| `/government` | Government — permit stepper, calendar, upload + form-field, FAQ / typography |

### Labs & samples

- `/data-grid` — Enterprise `ax-data-grid` (pin, filter, group, edit, select, density)
- `/layout` — Splitter, scroll-area, CDK virtual scroll, hierarchy org chart
- `/ui-kit` — Full component gallery (router tabs/pagination, dialog service, leading/trailing buttons, swatches, watermark, …)
- `/blocks` — Preset-aware blocks
- `/auth` — Auth sample
- `/landing` — Marketing stub
- `/settings` — Profile + density/trust shortcuts + Pro Theme Studio / token-scope
- `/error/404`, `/error/500` — Error pages

## Shell extras

- Theme configurator (sheet) — primary CTA in topbar
- Command palette — Ctrl/⌘+K or Search in the topbar
- Toast outlet — trigger from UI Kit / Settings
- Skip link to main content (keyboard)
- Sticky topbar with backdrop blur
