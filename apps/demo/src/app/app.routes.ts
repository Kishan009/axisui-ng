import type { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then((m) => m.DemoLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard-ecommerce/dashboard-ecommerce.component').then(
            (m) => m.DashboardEcommerceComponent,
          ),
        title: 'Dashboard',
      },
      {
        path: 'banking',
        loadComponent: () =>
          import('./pages/dashboard-banking/dashboard-banking.component').then(
            (m) => m.DashboardBankingComponent,
          ),
        title: 'Banking',
      },
      {
        path: 'healthcare',
        loadComponent: () =>
          import('./pages/dashboard-healthcare/dashboard-healthcare.component').then(
            (m) => m.DashboardHealthcareComponent,
          ),
        title: 'Healthcare',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./pages/dashboard-analytics/dashboard-analytics.component').then(
            (m) => m.DashboardAnalyticsComponent,
          ),
        title: 'Analytics',
      },
      {
        path: 'crm',
        loadComponent: () =>
          import('./pages/crm/crm.component').then((m) => m.CrmPageComponent),
        title: 'CRM',
      },
      {
        path: 'logistics',
        loadComponent: () =>
          import('./pages/dashboard-logistics/dashboard-logistics.component').then(
            (m) => m.DashboardLogisticsComponent,
          ),
        title: 'Logistics',
      },
      {
        path: 'automotive',
        loadComponent: () =>
          import('./pages/dashboard-automotive/dashboard-automotive.component').then(
            (m) => m.DashboardAutomotiveComponent,
          ),
        title: 'Automotive',
      },
      {
        path: 'government',
        loadComponent: () =>
          import('./pages/dashboard-government/dashboard-government.component').then(
            (m) => m.DashboardGovernmentComponent,
          ),
        title: 'Government',
      },
      {
        path: 'data-grid',
        loadComponent: () =>
          import('./pages/data-grid/data-grid.component').then((m) => m.DataGridPageComponent),
        title: 'Data grid',
      },
      {
        path: 'layout',
        loadComponent: () =>
          import('./pages/layout-lab/layout-lab.component').then((m) => m.LayoutLabPageComponent),
        title: 'Layout',
      },
      {
        path: 'ui-kit',
        loadComponent: () =>
          import('./pages/ui-kit/ui-kit.component').then((m) => m.AxKitPageComponent),
        title: 'UI Kit',
      },
      {
        path: 'blocks',
        loadComponent: () =>
          import('./pages/blocks/blocks.component').then((m) => m.BlocksPageComponent),
        title: 'Blocks',
      },
      {
        path: 'auth',
        loadComponent: () =>
          import('./pages/auth/auth.component').then((m) => m.AuthPageComponent),
        title: 'Auth',
      },
      {
        path: 'landing',
        loadComponent: () =>
          import('./pages/landing/landing.component').then((m) => m.LandingPageComponent),
        title: 'Landing',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then((m) => m.SettingsPageComponent),
        title: 'Settings',
      },
      {
        path: 'error/404',
        loadComponent: () =>
          import('./pages/error/error.component').then((m) => m.ErrorPageComponent),
        title: 'Not found',
        data: { code: '404' },
      },
      {
        path: 'error/500',
        loadComponent: () =>
          import('./pages/error/error.component').then((m) => m.ErrorPageComponent),
        title: 'Server error',
        data: { code: '500' },
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pages/error/error.component').then((m) => m.ErrorPageComponent),
        title: 'Not found',
        data: { code: '404' },
      },
    ],
  },
];
