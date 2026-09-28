import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// inject() only works before the first await, so resolve dependencies up front.

/** Lets signed-in users through; sends everyone else to /login. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.loadMe()) ? true : router.createUrlTree(['/login']);
};

/** Keeps signed-in users off the login page. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.loadMe()) ? router.createUrlTree(['/']) : true;
};
