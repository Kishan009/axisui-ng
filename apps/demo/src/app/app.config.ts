import {
  provideZonelessChangeDetection,
  type ApplicationConfig,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(appRoutes, withComponentInputBinding()),
    // Licensed demos (charts / data-table) — same key as Storybook preview
  ],
};
