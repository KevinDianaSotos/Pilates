import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

interface UserMe {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private token: string | null = null;
  private user$ = new BehaviorSubject<UserMe | null>(null);
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    // 🔹 Hidratamos token desde localStorage al iniciar
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this.token = storedToken;
      // 🔹 Cargamos usuario automáticamente
      this.loadCurrentUser().subscribe();
    }
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(res => {
          this.token = res.token;
          localStorage.setItem('token', res.token);
        })
      );
  }

  loadCurrentUser() {
    return this.http.get<UserMe>(`${this.apiUrl}/users/me`)
      .pipe(
        tap(user => this.user$.next(user))
      );
  }

  logout() {
    this.token = null;
    this.user$.next(null);
    localStorage.removeItem('token');
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user$.asObservable();
  }

  isLoggedIn() {
    return !!this.token;
  }
}