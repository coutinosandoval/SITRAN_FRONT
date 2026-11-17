import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';

// Guard que protege rutas por permiso.
// Cada ruta indica el permiso que necesita en `data: { permiso: '...' }`
// (acepta un texto o una lista; con la lista basta tener uno).
// Sin sesión → login. Con sesión pero sin permiso → dashboard.
export const permisoGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1) Debe estar autenticado
  if (!authService.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  // 2) Si la ruta no declara permiso, solo se exige estar autenticado
  const requerido = route.data?.['permiso'] as string | string[] | undefined;
  if (!requerido) return true;

  // 3) Basta con tener cualquiera de los permisos declarados
  const lista = Array.isArray(requerido) ? requerido : [requerido];
  if (lista.some((p) => authService.tienePermiso(p))) return true;

  // 4) Sin permiso: se devuelve al dashboard
  router.navigate(['/dashboard']);
  return false;
};