import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthService, User } from './auth.service';

const HOUR_MS = 60 * 60 * 1000;

function makeUser(sessionMs = HOUR_MS): User {
  return {
    id: 1,
    email: 'someone@gmail.com',
    name: 'Someone',
    picture: null,
    createdAt: '2026-09-28 10:00:00',
    lastLoginAt: '2026-09-28 10:00:00',
    sessionExpiresAt: new Date(Date.now() + sessionMs).toISOString(),
  };
}

const unauthorized = { status: 401, statusText: 'Unauthorized' };
const unavailable = { status: 503, statusText: 'Service Unavailable' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('loadMe stores the signed-in user and only asks the backend once', async () => {
    const user = makeUser();
    const first = service.loadMe();
    http.expectOne('/api/auth/me').flush(user);
    expect(await first).toEqual(user);
    expect(service.user()).toEqual(user);

    expect(await service.loadMe()).toEqual(user);
    http.expectNone('/api/auth/me');
  });

  it('loadMe treats 401 as signed out and remembers it', async () => {
    const result = service.loadMe();
    http.expectOne('/api/auth/me').flush({ error: 'Not signed in' }, unauthorized);
    expect(await result).toBeNull();

    expect(await service.loadMe()).toBeNull();
    http.expectNone('/api/auth/me');
  });

  it('loadMe retries when the backend is briefly unavailable', async () => {
    vi.useFakeTimers();
    const user = makeUser();
    const result = service.loadMe();

    http.expectOne('/api/auth/me').flush(null, unavailable);
    await vi.advanceTimersByTimeAsync(1000);
    http.expectOne('/api/auth/me').flush(user);

    expect(await result).toEqual(user);
  });

  it('loadMe does not cache a result when the backend stays unavailable', async () => {
    vi.useFakeTimers();
    const result = service.loadMe();
    for (let attempt = 0; attempt < 4; attempt++) {
      http.expectOne('/api/auth/me').flush(null, unavailable);
      await vi.advanceTimersByTimeAsync(1000);
    }
    expect(await result).toBeNull();

    // The next navigation asks the backend again instead of assuming "signed out".
    const retry = service.loadMe();
    http.expectOne('/api/auth/me').flush(makeUser());
    expect(await retry).not.toBeNull();
  });

  it('loginWithGoogle posts the credential and stores the user', async () => {
    const user = makeUser();
    const result = service.loginWithGoogle('google-id-token');
    const req = http.expectOne('/api/auth/google');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ credential: 'google-id-token' });
    req.flush(user);
    expect(await result).toEqual(user);
    expect(service.user()).toEqual(user);
  });

  it('logout clears the user', async () => {
    const login = service.loginWithGoogle('token');
    http.expectOne('/api/auth/google').flush(makeUser());
    await login;

    const logout = service.logout();
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await logout;
    expect(service.user()).toBeNull();
  });

  it('logout still signs out locally when the backend is unreachable', async () => {
    const login = service.loginWithGoogle('token');
    http.expectOne('/api/auth/google').flush(makeUser());
    await login;

    const logout = service.logout();
    http.expectOne('/api/auth/logout').error(new ProgressEvent('error'));
    await expect(logout).resolves.toBeUndefined();
    expect(service.user()).toBeNull();
  });

  it('signs the user out and shows the login page when the session expires', async () => {
    vi.useFakeTimers();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const login = service.loginWithGoogle('token');
    http.expectOne('/api/auth/google').flush(makeUser(HOUR_MS));
    await login;

    await vi.advanceTimersByTimeAsync(HOUR_MS - 1000);
    http.expectNone('/api/auth/logout');
    expect(service.user()).not.toBeNull();

    await vi.advanceTimersByTimeAsync(1000);
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await vi.advanceTimersByTimeAsync(0);

    expect(service.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'expired' } });
  });
});
