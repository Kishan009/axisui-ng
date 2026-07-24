## Design System: AxisUI demo

> Applied to `apps/demo` as **layout / type / hierarchy** guidance only.
> Do **not** hard-code the hex table below in components — map roles to
> existing `@axisui-ng/themes` OKLCH tokens so presets and dark mode keep working.

### Design Dials
- **Variance:** 4/10 ΓÇö Balanced / Modern
- **Motion:** 4/10 ΓÇö Standard
- **Density:** 7/10 ΓÇö Standard

### Pattern
- **Name:** Hero-Centric Design
- **Conversion Focus:** One primary CTA. Hero is 60-80% above fold. Mobile: same hierarchy.
- **CTA Placement:** Hero dominant (center/bottom) + Sticky nav CTA
- **Color Strategy:** Hero: High-impact visual. Minimal text. CTA 7:1 contrast.
- **Sections:** 1. Full-bleed Hero (headline + visual), 2. Single value prop strip, 3. Key benefit or proof, 4. Primary CTA

### Style
- **Name:** Swiss Modernism 2.0
- **Mode Support:** Light Γ£ô Full | Dark Γ£ô Full
- **Keywords:** Grid system, Helvetica, modular, asymmetric, international style, rational, clean, mathematical spacing
- **Best For:** Corporate sites, architecture, editorial, SaaS, museums, professional services, documentation
- **Performance:** ΓÜí Excellent | **Accessibility:** Γ£ô WCAG AAA

### Colors
| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#4F46E5` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#6366F1` | `--color-secondary` |
| Accent/CTA | `#EA580C` | `--color-accent` |
| Background | `#EEF2FF` | `--color-background` |
| Foreground | `#312E81` | `--color-foreground` |
| Muted | `#EBEEF8` | `--color-muted` |
| Border | `#C7D2FE` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#4F46E5` | `--color-ring` |

*Notes: Indigo brand + doc hierarchy [Accent adjusted from #F97316 for WCAG 3:1]*

### Typography
- **Heading:** Fira Code
- **Body:** Fira Sans
- **Mood:** dashboard, data, analytics, code, technical, precise
- **Best For:** Dashboards, analytics, data visualization, admin panels
- **Google Fonts:** https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap
- **CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
```

### Key Effects
display: grid, grid-template-columns: repeat(12 1fr), gap: 1rem, mathematical ratios, clear hierarchy

### Motion
**Page Transition** (Standard) ΓÇö Trigger: route change | Duration: 400-600ms | Easing: `power2.inOut`
```js
const tl = gsap.timeline(); tl.to('.transition-overlay', { yPercent: 0, duration: 0.4, ease: 'power2.inOut' }).call(navigate).to('.transition-overlay', { yPercent: -100, duration: 0.4, ease: 'power2.inOut', delay: 0.1 });
```
*Framework notes: Keep the overlay element mounted at the layout root (outside the page component) so it survives the route swap*
- Γ£à Show a lightweight loading indicator if the destination route's data fetch outlasts the overlay
- Γ¥î Don't tie the overlay's reveal directly to data-fetch completion without a max-wait timeout; a slow API stalls the whole transition

### Avoid (Anti-patterns)
- Slow updates
- No automation

### Pre-Delivery Checklist
- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px

