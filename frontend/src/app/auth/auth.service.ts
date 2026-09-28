import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthConfig {
  googleClientId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly currentUser = signal<User | null>(null);
  private sessionChecked = false;

  readonly user = this.currentUser.asReadonly();

  /** Fetches the signed-in user once per page load; later calls reuse the result. */
  async loadMe(): Promise<User | null> {
    if (this.sessionChecked) return this.currentUser();
    try {
      this.currentUser.set(await firstValueFrom(this.http.get<User>('/api/auth/me')));
    } catch {
      this.currentUser.set(null);
    }
    this.sessionChecked = true;
    return this.currentUser();
  }

  getConfig(): Promise<AuthConfig> {
    return firstValueFrom(this.http.get<AuthConfig>('/api/auth/config'));
  }

  async loginWithGoogle(credential: string): Promise<User> {
    const user = await firstValueFrom(this.http.post<User>('/api/auth/google', { credential }));
    this.currentUser.set(user);
    this.sessionChecked = true;
    return user;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>('/api/auth/logout', {}));
    this.currentUser.set(null);
  }
}

/** Pulls the backend's `{ error }` message out of a failed request. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse && typeof err.error?.error === 'string') {
    return err.error.error;
  }
  return fallback;
}
