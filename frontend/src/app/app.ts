import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly http = inject(HttpClient);

  protected readonly message = signal('Loading...');

  constructor() {
    this.http.get<{ message: string }>('/api/message').subscribe({
      next: (res) => this.message.set(res.message),
      error: () => this.message.set('Could not reach the backend. Is it running on port 3000?')
    });
  }
}
