import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';

import { LoginComponent } from '../app/features/auth/login/login.component';
import { DashboardAdminComponent } from '../app/features/dashboard-admin/dashboard-admin.component';
import { DashboardClientComponent } from '../app/features/dashboard-client/dashboard-client.component';

import { AdminLayoutComponent } from '../app/core/layout/admin-layout/admin-layout.component';
import { ClientLayoutComponent } from '../app/core/layout/client-layout/client-layout.component';

import { AuthGuard } from '../app/core/guards/auth.guard';
import { RoleGuard } from '../app/core/guards/role.guard';

export const appRoutes: Routes = [

  { 
    path: '', 
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) 
  },

  { path: 'login', component: LoginComponent },

  // ==================== RUTAS ADMIN ====================
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'Admin' },
    children: [
      {
        path: 'dashboard',
        component: DashboardAdminComponent
      },
      {
        path: 'clientes',
        loadComponent: () => import('../app/features/clients-admin/clients-admin.component').then(m => m.ClientsAdminComponent)
      },
      {
        path: 'tarifas',
        loadComponent: () => import('../app/features/tarifas/tarifas.component').then(m => m.TarifasComponent)
      },
      {
        path: 'instructores',
        loadComponent: () => import('./features/instructors/instructors.component').then(m => m.InstructorsComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/admin-profile/admin-profile.component').then(m => m.AdminProfileComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  // ==================== RUTAS CLIENTE ====================
  {
    path: 'client',
    component: ClientLayoutComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'Client' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../app/features/dashboard-client/dashboard-client.component').then(m => m.DashboardClientComponent)
      },
      {
        path: 'calendario',
        loadComponent: () => import('../app/features/client-calendar/client-calendar.component').then(m => m.ClientCalendarComponent)
      },
      {
        path: 'reservas',
        loadComponent: () => import('../app/features/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent)
      },

      {
        path: 'perfil',
        loadComponent: () => import('../app/features/client-profile/client-profile.component').then(m => m.ClientProfileComponent)
      },
      /*{
        path: 'membresia',
        loadComponent: () => import('../app/features/client/membership/client-membership.component').then(m => m.ClientMembershipComponent)
      },*/
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  { path: '**', redirectTo: 'login' }
];

export const appRouter = provideRouter(appRoutes);