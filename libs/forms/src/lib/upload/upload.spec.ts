/**
 * AxUploadComponent — unit + a11y tests. Files are ingested via a `drop` event
 * with a mocked `dataTransfer` (jsdom has no DataTransfer). a11y is asserted in
 * three modes (LTR / RTL / dark) on the rendered host. Run twice (zoneless + Zone.js).
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxUploadComponent } from './upload.component';
import type { UploadFn } from './upload.types';

expect.extend(toHaveNoViolations);

const file = (name: string, type: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type });
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxUploadComponent> {
  const fixture = TestBed.createComponent(AxUploadComponent);
  for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
  fixture.detectChanges();
  return fixture;
}

function drop(fixture: ComponentFixture<AxUploadComponent>, files: File[]) {
  const label = fixture.nativeElement.querySelector('label') as HTMLElement;
  const event = new Event('drop', { bubbles: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files } });
  label.dispatchEvent(event);
  fixture.detectChanges();
}

const rows = (f: ComponentFixture<AxUploadComponent>) =>
  Array.from(f.nativeElement.querySelectorAll('li')) as HTMLElement[];

describe('AxUploadComponent', () => {
  it('collects a dropped file', () => {
    const f = create();
    drop(f, [file('a.png', 'image/png')]);
    expect(f.componentInstance.value().length).toBe(1);
    expect(rows(f).length).toBe(1);
    expect(f.nativeElement.textContent).toContain('a.png');
  });

  it('replaces the file when !multiple', () => {
    const f = create();
    drop(f, [file('a.png', 'image/png')]);
    drop(f, [file('b.png', 'image/png')]);
    expect(f.componentInstance.value().map((x) => x.name)).toEqual(['b.png']);
  });

  it('appends when multiple', () => {
    const f = create({ multiple: true });
    drop(f, [file('a.png', 'image/png')]);
    drop(f, [file('b.png', 'image/png')]);
    expect(f.componentInstance.value().length).toBe(2);
  });

  it('rejects files that fail the accept filter', () => {
    const f = create({ accept: 'image/*' });
    drop(f, [file('doc.pdf', 'application/pdf')]);
    expect(f.componentInstance.value().length).toBe(0);
    drop(f, [file('a.png', 'image/png')]);
    expect(f.componentInstance.value().length).toBe(1);
  });

  it('rejects files over maxSize', () => {
    const f = create({ maxSize: 50 });
    drop(f, [file('big.png', 'image/png', 100)]);
    expect(f.componentInstance.value().length).toBe(0);
  });

  it('caps at maxFiles when multiple', () => {
    const f = create({ multiple: true, maxFiles: 2 });
    drop(f, [file('a.png', 'image/png'), file('b.png', 'image/png'), file('c.png', 'image/png')]);
    expect(f.componentInstance.value().length).toBe(2);
  });

  it('removes a file via its remove button', () => {
    const f = create({ multiple: true });
    drop(f, [file('a.png', 'image/png'), file('b.png', 'image/png')]);
    (rows(f)[0].querySelector('button[aria-label^="Remove"]') as HTMLButtonElement).click();
    f.detectChanges();
    expect(f.componentInstance.value().map((x) => x.name)).toEqual(['b.png']);
  });

  it('CVA: writeValue renders files, setDisabledState disables the input', () => {
    const f = create();
    const cmp = f.componentInstance;
    cmp.writeValue([file('x.pdf', 'application/pdf')]);
    cmp.setDisabledState(true);
    f.detectChanges();
    expect(cmp.value().length).toBe(1);
    expect(rows(f).length).toBe(1);
    expect((f.nativeElement.querySelector('input[type="file"]') as HTMLInputElement).disabled).toBe(true);
  });

  describe('auto-upload', () => {
    it('shows progress while uploading then success on resolve', async () => {
      let resolveUpload!: () => void;
      let onProgress!: (n: number) => void;
      const uploadFn: UploadFn = (_f, op) =>
        new Promise<void>((res) => {
          onProgress = op;
          resolveUpload = res;
        });
      const f = create({ uploadFn });
      drop(f, [file('a.png', 'image/png')]);
      onProgress(40);
      f.detectChanges();
      const bar = f.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;
      expect(bar.getAttribute('aria-valuenow')).toBe('40');

      resolveUpload();
      await flush();
      f.detectChanges();
      expect(f.nativeElement.querySelector('[data-ax-icon="check-circle"]')).toBeTruthy();
      expect(f.nativeElement.querySelector('[role="progressbar"]')).toBeNull();
    });

    it('shows an error when the upload rejects', async () => {
      let rejectUpload!: (e: unknown) => void;
      const uploadFn: UploadFn = () => new Promise<void>((_res, rej) => (rejectUpload = rej));
      const f = create({ uploadFn });
      drop(f, [file('a.png', 'image/png')]);
      rejectUpload(new Error('boom'));
      await flush();
      f.detectChanges();
      expect(f.nativeElement.querySelector('[data-ax-icon="alert-circle"]')).toBeTruthy();
      expect(f.nativeElement.textContent).toContain('boom');
    });
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      const f = create({ ariaLabel: 'Upload files' });
      drop(f, [file('a.pdf', 'application/pdf')]);
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });

    it('has no violations in RTL', async () => {
      const f = create({ ariaLabel: 'Upload files' });
      (f.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });

    it('has no violations in dark mode', async () => {
      const f = create({ ariaLabel: 'Upload files' });
      (f.nativeElement as HTMLElement).classList.add('dark');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
  });
});
