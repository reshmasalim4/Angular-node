import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Home } from './home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });

  it('shows the signed-in user and the backend message', async () => {
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
    });
    await login;

    const fixture = TestBed.createComponent(Home);
    http.expectOne('/api/message').flush({ message: 'Hello from the Node backend!' });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Someone');
    expect(text).toContain('someone@gmail.com');
    expect(text).toContain('Hello from the Node backend!');
    http.verify();
  });
});
