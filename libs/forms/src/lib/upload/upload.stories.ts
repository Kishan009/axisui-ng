import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AxUploadComponent } from './upload.component';
import type { UploadFn } from './upload.types';

/** Demo uploader: ramps progress to 100% over ~1.5s, then succeeds. */
const demoUpload: UploadFn = (_file, onProgress) =>
  new Promise<void>((resolve) => {
    let pct = 0;
    const id = setInterval(() => {
      pct += 20;
      onProgress(pct);
      if (pct >= 100) {
        clearInterval(id);
        resolve();
      }
    }, 300);
  });

const meta: Meta<AxUploadComponent> = {
  title: 'Forms/Upload',
  component: AxUploadComponent,
  tags: ['autodocs'],
  argTypes: {
    accept: { control: 'text' },
    multiple: { control: 'boolean' },
    maxFiles: { control: 'number' },
    disabled: { control: 'boolean' },
  },
  args: { accept: '', multiple: true, disabled: false },
  decorators: [moduleMetadata({ imports: [AxUploadComponent] })],
  render: (args) => ({
    props: args,
    template: `
      <div class="w-96">
        <ax-upload [accept]="accept" [multiple]="multiple" [maxFiles]="maxFiles" [disabled]="disabled" ariaLabel="Upload files" />
      </div>
    `,
  }),
};
export default meta;

type Story = StoryObj<AxUploadComponent>;

export const Dropzone: Story = {};

export const SingleFile: Story = { args: { multiple: false } };

export const ImagesOnly: Story = { args: { accept: 'image/*', multiple: true } };

export const AutoUpload: Story = {
  render: () => ({
    props: { demoUpload },
    template: `<div class="w-96"><ax-upload [multiple]="true" [uploadFn]="demoUpload" ariaLabel="Upload files" /></div>`,
  }),
};

export const Disabled: Story = { args: { disabled: true } };
