// src/app/core/services/instructors.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface Instructor {
  id: string;
  name: string;
  email: string;
  phone: string;
  especialidad?: string;
  bio?: string;
  foto?: string;
  activo: boolean;
  createdAt?: Date;
}

export interface CreateInstructorDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  especialidad?: string;
  bio?: string;
}

export interface UpdateInstructorDto {
  name?: string;
  email?: string;
  phone?: string;
  especialidad?: string;
  bio?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InstructorsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users/instructores`;

  // Obtener todos los instructores
  getInstructores(): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(this.apiUrl);
  }

  // Obtener un instructor por ID
  getInstructorById(id: string): Observable<Instructor> {
    return this.http.get<Instructor>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo instructor
  createInstructor(instructor: CreateInstructorDto): Observable<Instructor> {
    return this.http.post<Instructor>(this.apiUrl, instructor);
  }

  // Actualizar un instructor
  updateInstructor(id: string, instructor: UpdateInstructorDto): Observable<Instructor> {
    return this.http.put<Instructor>(`${this.apiUrl}/${id}`, instructor);
  }

  // Eliminar un instructor
  deleteInstructor(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Cambiar estado (activar/desactivar)
  toggleEstado(id: string, activo: boolean): Observable<Instructor> {
    return this.http.patch<Instructor>(`${this.apiUrl}/${id}/estado`, { activo });
  }

  // Buscar instructores
  searchInstructores(term: string): Observable<Instructor[]> {
    return this.http.get<Instructor[]>(`${this.apiUrl}/search`, { 
      params: { term } 
    });
  }

  // Subir foto de perfil
  uploadFoto(id: string, file: File): Observable<{ fotoUrl: string }> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<{ fotoUrl: string }>(`${this.apiUrl}/${id}/foto`, formData);
  }
}