import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxCarouselComponent } from './carousel.component';
import { AxCarouselSlideComponent } from './carousel-slide.component';

const SLIDE =
  'flex h-40 items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground';

const meta: Meta<AxCarouselComponent> = {
  title: 'Data/Carousel',
  component: AxCarouselComponent,
  tags: ['autodocs'],
  argTypes: {
    slidesPerView: { control: { type: 'number', min: 1, max: 4 } },
    loop: { control: 'boolean' },
    autoplay: { control: 'boolean' },
    interval: { control: 'number' },
    showArrows: { control: 'boolean' },
    showIndicators: { control: 'boolean' },
  },
  args: { slidesPerView: 1, loop: false, autoplay: false, interval: 5000, showArrows: true, showIndicators: true },
  decorators: [moduleMetadata({ imports: [AxCarouselComponent, AxCarouselSlideComponent] })],
  render: (args) => ({
    props: { ...args, slides: [1, 2, 3, 4, 5] },
    template: `
      <div class="w-[480px]">
        <ax-carousel
          [slidesPerView]="slidesPerView"
          [loop]="loop"
          [autoplay]="autoplay"
          [interval]="interval"
          [showArrows]="showArrows"
          [showIndicators]="showIndicators"
          ariaLabel="Demo carousel"
        >
          @for (n of slides; track n) {
            <ax-carousel-slide><div class="${SLIDE}">{{ n }}</div></ax-carousel-slide>
          }
        </ax-carousel>
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxCarouselComponent>;

export const Basic: Story = {};

export const MultiItem: Story = { args: { slidesPerView: 2 } };

export const Autoplay: Story = { args: { autoplay: true, loop: true, interval: 2500 } };

export const NoControls: Story = { args: { showArrows: false, showIndicators: false } };
