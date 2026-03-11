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
  
  // Para admin
  private apiUrlAdmin = `${environment.apiUrl}/users/perfil-admin`;
  
  // Para clientes (si lo necesitas)
  private apiUrlClient = `${environment.apiUrl}/users/perfil`;

  // Obtener perfil del admin
  getProfileAdmin(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrlAdmin);
  }

  // Actualizar perfil del admin
  updateProfileAdmin(data: UpdateProfileDto): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.apiUrlAdmin, data);
  }

  // Cambiar contraseña del admin
  changePasswordAdmin(data: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/users/perfil-admin/cambiar-password`, data);
  }

  // Obtener perfil del cliente
  getProfileClient(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.apiUrlClient);
  }

  // Actualizar perfil del cliente
  updateProfileClient(data: UpdateProfileDto): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.apiUrlClient, data);
  }

  // Cambiar contraseña del cliente
  changePasswordClient(data: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/users/cambiar-password`, data);
  }

  // Subir foto de perfil
  uploadFoto(file: File): Observable<{ fotoUrl: string }> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<{ fotoUrl: string }>(`${environment.apiUrl}/users/perfil/foto`, formData);
  }
}
