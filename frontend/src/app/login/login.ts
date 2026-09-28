import { AfterViewInit, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, errorMessage } from '../auth/auth.service';
import { loadGoogleIdentity } from '../auth/google-identity';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly buttonHost = viewChild.required<ElementRef<HTMLElement>>('googleButton');

  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  async ngAfterViewInit(): Promise<void> {
    try {
      const [{ googleClientId }, google] = await Promise.all([
        this.auth.getConfig(),
        loadGoogleIdentity()
      ]);
      google.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => this.signIn(credential)
      });
      google.renderButton(this.buttonHost().nativeElement, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 280
      });
    } catch {
      this.error.set('Google sign-in is unavailable. Check that the backend is running.');
    }
  }

  private async signIn(credential: string): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      await this.auth.loginWithGoogle(credential);
      await this.router.navigate(['/']);
    } catch (err) {
      this.error.set(errorMessage(err, 'Sign-in failed. Please try again.'));
    } finally {
      this.busy.set(false);
    }
  }
}
