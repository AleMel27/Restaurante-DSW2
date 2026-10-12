import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'mesas',
        loadComponent: () => import('./features/mesas/mesas-list.component').then(m => m.MesasListComponent)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./features/pedidos/pedidos-list.component').then(m => m.PedidosListComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MOZO'] }
      },
      {
        path: 'cocina',
        loadComponent: () => import('./features/cocina/cocina.component').then(m => m.CocinaComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'CHEF'] }
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/clientes/clientes-list.component').then(m => m.ClientesListComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MOZO'] }
      },
      {
        path: 'platos',
        loadComponent: () => import('./features/platos/platos-list.component').then(m => m.PlatosListComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'CHEF'] }
      },
      {
        path: 'atenciones',
        loadComponent: () => import('./features/atenciones/atenciones-list.component').then(m => m.AtencionesListComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'MOZO'] }
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/usuarios/usuarios-list.component').then(m => m.UsuariosListComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'consultas-reclamos',
        loadComponent: () => import('./features/atenciones/consultas-reclamos.component').then(m => m.ConsultasReclamosComponent),
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] }
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
