import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('shows the signed-in user and when the session ends', async () => {
    const http = TestBed.inject(HttpTestingController);
    const auth = TestBed.inject(AuthService);
    const login = auth.loginWithGoogle('token');
    http.expectOne('/api/auth/google').flush({
      id: 1,
      email: 'someone@gmail.com',
      name: 'Someone',
      picture: null,
      createdAt: '',
      lastLoginAt: '',
      sessionExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    await login;

    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Someone');
    expect(text).toContain('someone@gmail.com');
    expect(text).toContain('Your session ends at');
    http.verify();
  });

  it('Log out returns to /login even when the backend is unreachable', async () => {
    const http = TestBed.inject(HttpTestingController);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    http.expectOne('/api/auth/logout').error(new ProgressEvent('error'));
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/login']);
    http.verify();
  });
});
