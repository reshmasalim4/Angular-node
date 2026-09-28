import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;
  protected readonly message = signal('Loading...');

  constructor() {
    this.http.get<{ message: string }>('/api/message').subscribe({
      next: (res) => this.message.set(res.message),
      error: () => this.message.set('Could not reach the backend. Is it running on port 3000?')
    });
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
