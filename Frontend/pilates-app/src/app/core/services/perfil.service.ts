import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PerfilUsuario {
  id: string;
  name: string;
  email: string;
  phone: string;
  tarifa?: {
    id: string;
    nombre: string;
    precio: number;
    maxClasesMes: number;
    descripcion: string;
  } | null;
  fechaRegistro: Date;
  estadoMembresia: string;
  fechaProximoPago?: Date | null;
}

export interface UpdatePerfilDto {
  name: string;
  email: string;
  phone: string;
}

export interface CambiarPasswordDto {
  passwordActual: string;
  passwordNueva: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getMiPerfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilUsuario>(`${this.apiUrl}/users/perfil`);
  }

  actualizarPerfil(data: UpdatePerfilDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/perfil`, data);
  }

  cambiarPassword(data: CambiarPasswordDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/cambiar-password`, data);
  }
}