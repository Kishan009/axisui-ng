import { type Preview } from '@storybook/angular';

import { setIndustry, setDarkMode, setDensity, type PresetName } from '@axisui-ng/themes';

// The themed stylesheet is served statically and linked via `previewHead` in
// main.ts (pre-compiled Tailwind) — not imported through webpack.
//
// Only the industry presets are runtime-switchable via `setIndustry()` (they are
// `:root[data-industry="…"]` scoped blocks in tokens.css). The consumer presets
// (blue/zinc/stone/neutral/rose/violet) are standalone base-theme CSS files chosen
// at build time, so they aren't offered in this runtime toolbar. 'none' = the
// default (blue) base theme.
const PRESETS: (PresetName | 'none')[] = [
  'none',
  'banking',
  'healthcare',
  'automotive',
  'logistics',
  'government',
];

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
    a11y: { context: '#storybook-root' },
  },
  globalTypes: {
    preset: {
      description: 'Industry / consumer preset',
      defaultValue: 'blue',
      toolbar: { title: 'Preset', icon: 'paintbrush', items: PRESETS, dynamicTitle: true },
    },
    theme: {
      description: 'Color scheme',
      defaultValue: 'light',
      toolbar: { title: 'Theme', icon: 'circlehollow', items: ['light', 'dark'], dynamicTitle: true },
    },
    density: {
      description: 'Density',
      defaultValue: 'comfortable',
      toolbar: { title: 'Density', icon: 'component', items: ['comfortable', 'compact'], dynamicTitle: true },
    },
  },
  decorators: [
    // Apply preset / theme / density from the toolbar before each render.
    (story, ctx) => {
      const g = ctx.globals;
      setIndustry(g['preset'] === 'none' ? null : (g['preset'] as PresetName));
      setDarkMode(g['theme'] === 'dark', false);
      setDensity(g['density'] as 'comfortable' | 'compact');
      return story();
    },
  ],
};

export default preview;
