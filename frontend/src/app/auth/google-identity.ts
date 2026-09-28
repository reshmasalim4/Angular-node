/** Minimal typings for the Google Identity Services script (accounts.google.com/gsi/client). */
export interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: { theme?: string; size?: string; text?: string; shape?: string; width?: number }
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';
let scriptLoad: Promise<GoogleAccountsId> | null = null;

/** Loads the Google Identity Services script once and resolves with its `google.accounts.id` API. */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  scriptLoad ??= new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google.accounts.id);
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () =>
      window.google?.accounts?.id
        ? resolve(window.google.accounts.id)
        : reject(new Error('Google sign-in did not initialize'));
    script.onerror = () => {
      scriptLoad = null;
      reject(new Error('Could not load Google sign-in'));
    };
    document.head.appendChild(script);
  });
  return scriptLoad;
}
