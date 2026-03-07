import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface Alumno {
  id: string;
  name: string;
  attended: boolean;
}

export interface Clase {
  id: string;
  title: string;
  date: string;          
  durationMinutes: number; 
  start?: string;         
  end?: string;           
  alumnos: Alumno[];
  maxCapacity?: number;
  occupiedSpots?: number;
  instructor?: { id: string; name: string };
}

export interface ClaseDisponible {
  id: string;
  title: string;
  fecha: Date;
  duracion: number;
  instructor: string;
  capacidad: number;
  reservadas: number;
  plazasLibres: number;
  isCompleted: boolean;
  isPasada: boolean;
}

export interface CreateClaseDto {
  date: string;
  instructorId: string;
  maxCapacity: number;
  durationMinutes: number;
}

export interface UltimaClase {
  id: string;
  claseId: string;
  fecha: Date;
  instructor: string;
  duracion: number;
  atendio: boolean;
}

export interface ClienteStats {
  proximasClases: number;
  totalClases: number;
  clasesAsistidas: number;
  clasesEsteMes: number;
  diasRestantes: number;
  estadoMembresia: string;
}

export interface ProximaClase {
  id: string;
  claseId: string;
  fecha: Date;
  instructor: string;
  duracion: number;
  plazasLibres: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClasesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getClases(): Observable<Clase[]> {
    return this.http.get<Clase[]>(`${this.apiUrl}/class`);
  }

  getClasesDisponibles(): Observable<ClaseDisponible[]> {
    return this.http.get<ClaseDisponible[]>(`${this.apiUrl}/class/disponibles`);
  }

  createClase(clase: CreateClaseDto) {
    return this.http.post<any>(`${this.apiUrl}/class`, clase);
  }

  updateClase(clase: { id: string; date: string; instructorId: string; maxCapacity: number; durationMinutes: number; }): Observable<any> {
    return this.http.put(`${this.apiUrl}/class/${clase.id}`, clase);
  }

  eliminarClase(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/class/${id}`);
  }

  getInstructores(): Observable<{id: string, name: string}[]> {
    return this.http.get<{id: string, name: string}[]>(`${this.apiUrl}/admin/dashboard/instructores`);
  }

  getProximasClasesCliente(): Observable<ProximaClase[]> {
    return this.http.get<ProximaClase[]>(`${this.apiUrl}/class/cliente/proximas`);
  }

  getUltimasClasesCliente(): Observable<UltimaClase[]> {
    return this.http.get<UltimaClase[]>(`${this.apiUrl}/class/cliente/ultimas`);
  }

  getStatsCliente(): Observable<ClienteStats> {
    return this.http.get<ClienteStats>(`${this.apiUrl}/class/cliente/stats`);
  }
}