import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard, guestGuard } from './auth.guard';

function runGuard(guard: typeof authGuard, signedIn: boolean) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { loadMe: async () => (signedIn ? { id: 1 } : null) } },
    ],
  });
  return TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  ) as Promise<boolean | UrlTree>;
}

describe('authGuard', () => {
  it('allows signed-in users', async () => {
    expect(await runGuard(authGuard, true)).toBe(true);
  });

  it('redirects signed-out users to /login', async () => {
    expect((await runGuard(authGuard, false)).toString()).toBe('/login');
  });
});

describe('guestGuard', () => {
  it('allows signed-out users onto the login page', async () => {
    expect(await runGuard(guestGuard, false)).toBe(true);
  });

  it('redirects signed-in users home', async () => {
    expect((await runGuard(guestGuard, true)).toString()).toBe('/');
  });
});
