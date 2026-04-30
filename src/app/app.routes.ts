import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { DashboardComponent } from './dashboard/dashboard';
import { authGuard } from './login/auth.guard';
import { VehiculoComponent } from './vehiculos/vehiculo';

export const routes: Routes = [
  // Ruta pública
  { path: 'login', component: LoginComponent },

  // Rutas protegidas dentro del layout
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
      { path: 'vehiculos', component: VehiculoComponent, canActivate: [authGuard] },
    ]
  },

  // Ruta por defecto
  { path: '**', redirectTo: 'login' }
];