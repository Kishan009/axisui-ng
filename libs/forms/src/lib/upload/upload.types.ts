import type { SafeUrl } from '@angular/platform-browser';

/** Per-file upload status. */
export type UploadStatus = 'ready' | 'uploading' | 'success' | 'error';

/**
 * Optional auto-upload driver. Resolve on success, reject on failure; report
 * progress via `onProgress` (0–100); honour `signal.aborted` for cancellation.
 */
export type UploadFn = (
  file: File,
  onProgress: (percent: number) => void,
  signal: AbortSignal
) => Promise<void>;

/** Internal per-file record tracked by the component. */
export interface UploadItem {
  readonly id: number;
  readonly file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  /** Sanitised object-URL for image previews. */
  previewUrl?: SafeUrl;
  /** Raw object-URL, kept for revocation. */
  objectUrl?: string;
  controller?: AbortController;
}
