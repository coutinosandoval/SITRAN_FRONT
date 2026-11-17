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
import { PorteriaComponent } from './porteria/porteria';
import { ReporteCuponesVehiculo } from './reportes/reporte-cupones-vehiculo/reporte-cupones-vehiculo';
import { ReporteCombustibleComponent } from './reportes/reporte-combustible/reporte-combustible';
import { permisoGuard } from './login/permiso.guard';
import { SolicitudCombustibleComponent } from './cupones/solicitud-combustible/solicitud-combustible';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  // Ruta para solicitar recuperación de contraseña (sin autenticación)
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },

  // Bitácora (está fuera del layout, al inicio del archivo)
  {
    path: 'bitacora',
    loadComponent: () => import('./reportes/bitacora/bitacora').then((m) => m.Bitacora),
    canActivate: [permisoGuard],
    data: { permiso: 'VER_BITACORA' },
  },

  // Ruta para restablecer contraseña con token (sin autenticación)
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  // Ruta para cambio obligatorio de contraseña al primer ingreso
  {
    path: 'cambiar-clave',
    loadComponent: () => import('./auth/cambiar-clave/cambiar-clave').then((m) => m.CambiarClave),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard: es la página de inicio y también el destino cuando falta un permiso,
      // por eso solo pide sesión (con guard por permiso causaría un ciclo de redirecciones)
      { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },

      // ── Opciones ocultas temporalmente en el menú: por ahora solo piden sesión ──
      { path: 'porteria', component: PorteriaComponent, canActivate: [authGuard] },
      { path: 'comisiones', component: ComisionComponent, canActivate: [authGuard] },
      { path: 'comision-local', component: ComisionLocalComponent, canActivate: [authGuard] },
      {
        path: 'cupones/solicitudes-talonario',
        component: SolicitudTalonarioComponent,
        canActivate: [authGuard],
      },
      {
        path: 'reportes/combustible',
        component: ReporteCombustibleComponent,
        canActivate: [authGuard],
      },

      // ── Vehículos ──
      {
        path: 'vehiculos',
        component: VehiculoComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_VEHICULOS' },
      },
      {
        path: 'vehiculos/mantenimientos',
        component: MantenimientoComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_VEHICULOS' },
      },
      {
        path: 'vehiculos/historico-kilometraje',
        component: HistoricoKmComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_VEHICULOS' },
      },

      // ── Pilotos y catálogos ──
      {
        path: 'pilotos',
        component: PilotoComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_PILOTOS' },
      },
      {
        path: 'catalogos',
        component: CatalogoComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_CATALOGOS' },
      },

      // ── Cupones ──
      {
        path: 'cupones/talonarios',
        component: TalonarioComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_TALONARIOS' },
      },
      {
        path: 'compras',
        component: ComprasComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'GESTIONAR_COMPRAS_TALONARIOS' },
      },
      {
        path: 'solicitudes-cupones',
        component: SolicitudCuponesComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_SOLICITUDES_CUPONES' },
      },
      {
        path: 'solicitud-combustible',
        component: SolicitudCombustibleComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_COMBUSTIBLE_VEHICULOS' },
      },

      // ── Seguridad ──
      {
        path: 'seguridad/usuarios',
        component: SeguridadComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_SEGURIDAD_USUARIOS' },
      },
      {
        path: 'seguridad/roles',
        component: SeguridadComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_SEGURIDAD_ROLES' },
      },

      // ── Reportes ──
      {
        path: 'reportes-ia',
        component: ReporteIAComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_REPORTES_IA' },
      },
      {
        path: 'reportes/vehiculos',
        component: BitacoraVehiculosComponent,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_REPORTES_VEHICULOS' },
      },
      {
        path: 'reportes/cupones',
        loadComponent: () =>
          import('./reportes/reporte-cupones/reporte-cupones').then(
            (m) => m.ReporteCuponesComponent,
          ),
        canActivate: [permisoGuard],
        data: { permiso: 'VER_REPORTE_CUPONES_SEDE' },
      },
      {
        path: 'reportes/cupones-vehiculo',
        component: ReporteCuponesVehiculo,
        canActivate: [permisoGuard],
        data: { permiso: 'VER_REPORTE_CUPONES_VEHICULO' },
      },
      {
        path: 'reportes/libro-control',
        loadComponent: () =>
          import('./reportes/libro-control/libro-control').then((m) => m.LibroControl),
        canActivate: [permisoGuard],
        data: { permiso: 'VER_LIBRO_CONTROL_ALMACEN' },
      },
      {
        path: 'reportes/libro-control-sedes',
        loadComponent: () =>
          import('./reportes/libro-control-sedes/libro-control-sedes').then(
            (m) => m.LibroControlSedes,
          ),
        canActivate: [permisoGuard],
        data: { permiso: 'VER_LIBRO_CONTROL_SEDES' },
      },
      {
        path: 'folios',
        loadComponent: () => import('./folios/control-folios').then((m) => m.ControlFolios),
        canActivate: [permisoGuard],
        data: { permiso: 'GESTIONAR_FOLIOS' },
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
