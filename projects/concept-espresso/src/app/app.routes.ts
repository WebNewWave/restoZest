import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.HomePage),
    title: 'Zest Resto — ресторан европейской и кавказской кухни в Махачкале',
  },
  {
    path: 'menu',
    loadComponent: () => import('./pages/menu/menu').then((m) => m.MenuPage),
    title: 'Меню — Zest Resto',
  },
  {
    path: 'events',
    loadComponent: () => import('./pages/events/events').then((m) => m.EventsPage),
    title: 'Торжества и банкеты — Zest Resto',
  },
  {
    path: 't/:table',
    loadComponent: () => import('./pages/table/table').then((m) => m.TablePage),
    title: 'Заказ со стола — Zest Resto',
  },
  {
    path: 'kitchen',
    loadComponent: () => import('./pages/kitchen/kitchen').then((m) => m.KitchenPage),
    title: 'Кухня — Zest Resto',
  },
  { path: '**', redirectTo: '' },
];
