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
export const ME_RETRY_COUNT = 3;
export const ME_RETRY_DELAY_MS = 1000;
