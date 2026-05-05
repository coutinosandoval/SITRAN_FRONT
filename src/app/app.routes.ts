import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { DashboardComponent } from './dashboard/dashboard';
import { authGuard } from './login/auth.guard';
import { VehiculoComponent } from './vehiculos/vehiculo';
import { PilotoComponent } from './pilotos/piloto';
import { MantenimientoComponent } from './mantenimientos/mantenimiento';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '',                          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',                 component: DashboardComponent,     canActivate: [authGuard] },
      { path: 'vehiculos',                 component: VehiculoComponent,      canActivate: [authGuard] },
      { path: 'vehiculos/mantenimientos',  component: MantenimientoComponent, canActivate: [authGuard] },
      { path: 'pilotos',                   component: PilotoComponent,        canActivate: [authGuard] },
    ]
  },
  { path: '**', redirectTo: 'login' }
];