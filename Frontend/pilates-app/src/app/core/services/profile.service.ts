import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  foto?: string;
  createdAt?: Date;
}

export interface UpdateProfileDto {
  name: string;
  email: string;
  phone: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users/perfil`;

  // Obtener perfil del usuario actual
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrl);
  }

  // Actualizar perfil
  updateProfile(data: UpdateProfileDto): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.apiUrl, data);
  }

  // Cambiar contraseña
  changePassword(data: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/users/cambiar-password`, data);
  }

  // Subir foto de perfil
  uploadFoto(file: File): Observable<{ fotoUrl: string }> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<{ fotoUrl: string }>(`${this.apiUrl}/foto`, formData);
  }

  // Eliminar cuenta (opcional)
  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/users/eliminar-cuenta`);
  }
}