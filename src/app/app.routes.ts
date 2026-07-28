import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { DashboardComponent } from './dashboard/dashboard';
import { authGuard } from './login/auth.guard';
import { VehiculoComponent } from './vehiculos/vehiculo';
import { PilotoComponent } from './pilotos/piloto';
import { MantenimientoComponent } from './vehiculos/mantenimientos/mantenimiento';
import { HistoricoKmComponent } from './vehiculos/historico-km/historico-km';
import { CatalogoComponent } from './catalogos/catalogo';
import { TalonarioComponent } from './cupones/talonario/talonario';
import { SolicitudTalonarioComponent } from './cupones/solicitud-talonario/solicitud-talonario';
import { ComisionComponent } from './comisiones/comision';
import { SeguridadComponent } from './seguridad/seguridad';
import { RegistroComponent } from './registro/registro';
import { ReporteIAComponent } from './reportes/reporte-ia';
import { BitacoraVehiculosComponent } from './reportes/bitacora-vehiculos/bitacora-vehiculos';
import { ComprasComponent } from './compras/compras';
import { SolicitudCuponesComponent } from './cupones/solicitud-cupones/solicitud-cupones';
import { ComisionLocalComponent } from './comisiones/comision-local/comision-local';
import { SolicitudCombustibleComponent } from './cupones/solicitud-combustible/solicitud-combustible';
import { ReporteCombustibleComponent } from './reportes/reporte-combustible/reporte-combustible';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
      { path: 'vehiculos', component: VehiculoComponent, canActivate: [authGuard] },
      {
        path: 'vehiculos/mantenimientos',
        component: MantenimientoComponent,
        canActivate: [authGuard],
      },
      {
        path: 'vehiculos/historico-kilometraje',
        component: HistoricoKmComponent,
        canActivate: [authGuard],
      },
      { path: 'pilotos', component: PilotoComponent, canActivate: [authGuard] },
      { path: 'catalogos', component: CatalogoComponent, canActivate: [authGuard] },
      { path: 'cupones/talonarios', component: TalonarioComponent, canActivate: [authGuard] },
      {
        path: 'cupones/solicitudes-talonario',
        component: SolicitudTalonarioComponent,
        canActivate: [authGuard],
      },
      { path: 'comisiones', component: ComisionComponent, canActivate: [authGuard] },
      { path: 'comision-local', component: ComisionLocalComponent, canActivate: [authGuard] },
      { path: 'seguridad/usuarios', component: SeguridadComponent, canActivate: [authGuard] },
      { path: 'compras', component: ComprasComponent, canActivate: [authGuard] },
      { path: 'seguridad/roles', component: SeguridadComponent, canActivate: [authGuard] },
      { path: 'reportes-ia', component: ReporteIAComponent },
      {
        path: 'reportes/vehiculos',
        component: BitacoraVehiculosComponent,
        canActivate: [authGuard],
      },
      {
        path: 'solicitudes-cupones',
        component: SolicitudCuponesComponent,
        canActivate: [authGuard],
      },
      {
        path: 'reportes/cupones',
        loadComponent: () =>
          import('./reportes/reporte-cupones/reporte-cupones').then(
            (m) => m.ReporteCuponesComponent,
          ),
      },
      {
        path: 'solicitud-combustible',
        component: SolicitudCombustibleComponent,
        canActivate: [authGuard],
      },
      {
        path: 'reportes/combustible',
        component: ReporteCombustibleComponent,
        canActivate: [authGuard],
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
