import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { map, take, switchMap, of, catchError } from 'rxjs';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['role'];

  // Si no hay token, redirigir inmediatamente
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return of(false);
  }

  // Intentar obtener el usuario
  return authService.getUser().pipe(
    take(1),
    switchMap(user => {
      // Si ya tenemos usuario, validar rol
      if (user) {
      
        if (user.role === expectedRole) {         
          return of(true);
        } else {
          router.navigate(['/login']);
          return of(false);
        }
      }
      
      return authService.loadCurrentUser().pipe(
        map(loadedUser => {
          if (loadedUser && loadedUser.role === expectedRole) {
            return true;
          }
          router.navigate(['/login']);
          return false;
        }),
        catchError(error => {
          console.error('❌ RoleGuard - Error cargando usuario:', error);
          router.navigate(['/login']);
          return of(false);
        })
      );
    }),
    catchError(error => {
      console.error('❌ RoleGuard - Error general:', error);
      router.navigate(['/login']);
      return of(false);
    })
  );
};