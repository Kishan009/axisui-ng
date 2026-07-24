import { defineConfig, passthroughImageService } from 'astro/config';
import starlight from '@astrojs/starlight';

// A labeled sidebar group wraps its autogenerate config in `items` (Starlight v0.39+).
const group = (label, directory) => ({ label, items: [{ autogenerate: { directory } }] });

// https://starlight.astro.build/reference/configuration/
export default defineConfig({
  site: 'https://axisui.dev',
  image: { service: passthroughImageService() },
  srcDir: './src',
  outDir: './dist',
  integrations: [
    starlight({
      title: 'AxisUI',
      logo: { src: './src/assets/logo.svg', alt: 'AxisUI' },
      favicon: '/favicon.svg',
      customCss: ['./src/styles/landing.css'],
      description: 'AxisUI — the modern Angular 20 UI component library. Signals-first, standalone, accessible (WCAG 2.2 AA, CI-enforced), Tailwind v4 + OKLCH. MIT, install-as-you-go.',
      head: [
        { tag: 'meta', attrs: { name: 'keywords', content: 'angular, angular 20, angular ui, angular components, angular component library, angular ui library, signals, standalone components, zoneless, tailwind, tailwind v4, oklch, accessible, wcag, axisui' } },
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: 'AxisUI — Angular 20 UI Library' } },
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://axisui.dev/og.png' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://axisui.dev/og.png' } },
        {
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'AxisUI',
            alternateName: 'AxisUI Angular UI Library',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            description: 'Angular 20 UI component library — signals-first, standalone, accessible, Tailwind v4.',
            url: 'https://axisui.dev',
            softwareRequirements: 'Angular 20+',
            keywords: 'angular, angular ui, angular components, signals, standalone, tailwind, accessible',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            author: { '@type': 'Person', name: 'Kishan' },
          }),
        },
      ],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Kishan009/UI-Library' }],
      sidebar: [
        group('Getting started', 'docs/guides'),
        { label: 'Accessibility', link: '/accessibility/' },
        { label: 'Support', link: '/support/' },
        { label: 'Report an issue', link: '/report/' },
        { label: 'Roadmap', link: '/docs/roadmap/', badge: { text: 'New', variant: 'tip' } },
        { label: 'Live demo', link: 'https://axisui-demo.pages.dev/', attrs: { target: '_blank' }, badge: { text: '↗', variant: 'note' } },
        { label: 'Storybook', link: 'https://axisui-storybook.pages.dev/', attrs: { target: '_blank' }, badge: { text: '↗', variant: 'note' } },
        {
          label: 'Components',
          items: [
            group('Primitives', 'docs/components/primitives'),
            group('Buttons', 'docs/components/buttons'),
            group('Forms', 'docs/components/forms'),
            group('Data display', 'docs/components/data'),
            group('Charts', 'docs/components/charts'),
            group('Overlays', 'docs/components/overlays'),
            group('Navigation', 'docs/components/navigation'),
            group('Feedback', 'docs/components/feedback'),
            group('Layout', 'docs/components/layout'),
            group('Misc', 'docs/components/misc'),
            group('Flow', 'docs/components/flow'),
            group('Tree', 'docs/components/tree'),
            group('CDK', 'docs/components/cdk'),
            group('Blocks', 'docs/components/blocks'),
          ],
        },
      ],
    }),
  ],
});
