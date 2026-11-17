import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';


// Guard que protege las rutas que requieren autenticación
// Si el usuario no está autenticado lo redirige al login
export const authGuard: CanActivateFn = (route, state) => {

  // Inyectar servicios necesarios
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (authService.estaAutenticado()) {
    // Usuario autenticado, permitir acceso a la ruta
    return true;
  }

  // Usuario no autenticado, redirigir al login
  router.navigate(['/login']);
  return false;
};