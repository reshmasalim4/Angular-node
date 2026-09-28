import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, User } from './auth.service';

const user: User = {
  id: 1,
  email: 'someone@gmail.com',
  name: 'Someone',
  picture: null,
  createdAt: '2026-09-28 10:00:00',
  lastLoginAt: '2026-09-28 10:00:00',
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loadMe stores the signed-in user and only asks the backend once', async () => {
    const first = service.loadMe();
    http.expectOne('/api/auth/me').flush(user);
    expect(await first).toEqual(user);
    expect(service.user()).toEqual(user);

    expect(await service.loadMe()).toEqual(user);
    http.expectNone('/api/auth/me');
  });

  it('loadMe resolves to null when not signed in', async () => {
    const result = service.loadMe();
    http.expectOne('/api/auth/me').flush({ error: 'Not signed in' }, { status: 401, statusText: 'Unauthorized' });
    expect(await result).toBeNull();
    expect(service.user()).toBeNull();
  });

  it('loginWithGoogle posts the credential and stores the user', async () => {
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
    http.expectOne('/api/auth/google').flush(user);
    await login;

    const logout = service.logout();
    http.expectOne('/api/auth/logout').flush(null, { status: 204, statusText: 'No Content' });
    await logout;
    expect(service.user()).toBeNull();
  });
});
