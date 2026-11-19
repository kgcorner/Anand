import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dev/components',
    loadComponent: () =>
      import('./features/dev/component-catalog/component-catalog').then((m) => m.ComponentCatalog),
  },
];
