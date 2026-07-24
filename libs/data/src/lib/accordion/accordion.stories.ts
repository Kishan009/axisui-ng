import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxAccordionComponent } from './accordion.component';
import { AxAccordionItemComponent } from './accordion-item.component';

const meta: Meta = {
  title: 'Data/Accordion',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxAccordionComponent, AxAccordionItemComponent] })],
};
export default meta;
type Story = StoryObj;

/** Single mode — one panel open at a time; `collapsible` lets the open one close again. */
export const Default: Story = {
  render: () => ({
    template: `
      <ax-accordion class="block w-80" type="single" [collapsible]="true" value="item-1">
        <ax-accordion-item value="item-1">
          <span axAccordionTrigger>Is it accessible?</span>
          <div axAccordionContent class="text-muted-foreground">Yes. It uses aria-expanded and proper button semantics.</div>
        </ax-accordion-item>
        <ax-accordion-item value="item-2">
          <span axAccordionTrigger>Is it styled?</span>
          <div axAccordionContent class="text-muted-foreground">Yes, with token-driven classes throughout.</div>
        </ax-accordion-item>
        <ax-accordion-item value="item-3">
          <span axAccordionTrigger>Can an item be disabled?</span>
          <div axAccordionContent class="text-muted-foreground">Individual items accept a [disabled] input.</div>
        </ax-accordion-item>
      </ax-accordion>
    `,
  }),
};

/** Multiple mode — any number of panels can be open at once. */
export const Multiple: Story = {
  render: () => ({
    template: `
      <ax-accordion class="block w-80" type="multiple" [value]="['a','b']">
        <ax-accordion-item value="a">
          <span axAccordionTrigger>First</span>
          <div axAccordionContent class="text-muted-foreground">Open by default.</div>
        </ax-accordion-item>
        <ax-accordion-item value="b">
          <span axAccordionTrigger>Second</span>
          <div axAccordionContent class="text-muted-foreground">Also open — multiple panels allowed.</div>
        </ax-accordion-item>
        <ax-accordion-item value="c">
          <span axAccordionTrigger>Third</span>
          <div axAccordionContent class="text-muted-foreground">Closed until toggled.</div>
        </ax-accordion-item>
      </ax-accordion>
    `,
  }),
};
