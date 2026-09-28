import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, retry, throwError, timer } from 'rxjs';

export interface User {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
  createdAt: string;
  lastLoginAt: string;
  /** ISO time when the session ends; the app signs the user out then. */
  sessionExpiresAt: string;
}

export interface AuthConfig {
  googleClientId: string;
}

/** Retries for /api/auth/me when the backend is briefly unreachable (e.g. restarting). */
const ME_RETRY_COUNT = 3;
const ME_RETRY_DELAY_MS = 1000;

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUser = signal<User | null>(null);
  private sessionChecked = false;
  private expiryTimer: ReturnType<typeof setTimeout> | undefined;

  readonly user = this.currentUser.asReadonly();

  /**
   * Resolves the signed-in user. A 401 means signed out and is remembered; other failures
   * (backend down or restarting) are retried, and if they persist the result is not cached
   * so the next navigation asks again.
   */
  async loadMe(): Promise<User | null> {
    if (this.sessionChecked) return this.currentUser();
    try {
      const user = await firstValueFrom(
        this.http.get<User>('/api/auth/me').pipe(
          retry({
            count: ME_RETRY_COUNT,
            delay: (err) =>
              isUnauthorized(err) ? throwError(() => err) : timer(ME_RETRY_DELAY_MS)
          })
        )
      );
      this.setSession(user);
    } catch (err) {
      this.setSession(null);
      this.sessionChecked = isUnauthorized(err);
    }
    return this.currentUser();
  }

  getConfig(): Promise<AuthConfig> {
    return firstValueFrom(this.http.get<AuthConfig>('/api/auth/config'));
  }

  async loginWithGoogle(credential: string): Promise<User> {
    const user = await firstValueFrom(this.http.post<User>('/api/auth/google', { credential }));
    this.setSession(user);
    return user;
  }

  /**
   * Signs out locally even if the backend can't be reached, so the user is never stuck
   * signed in. The server cookie expires on its own at the end of the session.
   */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post<void>('/api/auth/logout', {}));
    } catch {
      // Ignore: the local sign-out below still happens.
    } finally {
      this.setSession(null);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.expiryTimer);
  }

  private setSession(user: User | null): void {
    clearTimeout(this.expiryTimer);
    this.currentUser.set(user);
    this.sessionChecked = user !== null;
    if (user) {
      const msLeft = Date.parse(user.sessionExpiresAt) - Date.now();
      this.expiryTimer = setTimeout(() => this.expireSession(), Math.max(msLeft, 0));
    }
  }

  private async expireSession(): Promise<void> {
    await this.logout();
    await this.router.navigate(['/login'], { queryParams: { reason: 'expired' } });
  }
}

function isUnauthorized(err: unknown): boolean {
  return err instanceof HttpErrorResponse && err.status === 401;
}

/** Pulls the backend's `{ error }` message out of a failed request. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse && typeof err.error?.error === 'string') {
    return err.error.error;
  }
  return fallback;
}
