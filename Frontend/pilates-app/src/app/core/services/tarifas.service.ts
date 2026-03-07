// src/app/core/services/tarifas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface Tarifa {
  id: string;
  nombre: string;
  precio: number;
  maxClasesMes: number;
  descripcion: string;
}

export interface CreateTarifaDto {
  nombre: string;
  precio: number;
  maxClasesMes: number;
  descripcion: string;
}

export interface UpdateTarifaDto {
  nombre: string;
  precio: number;
  maxClasesMes: number;
  descripcion: string;
}

@Injectable({
  providedIn: 'root'
})
export class TarifasService {
  private apiUrl = `${environment.apiUrl}/tarifas`;

  constructor(private http: HttpClient) { }

  // Obtener todas las tarifas
  getTarifas(): Observable<Tarifa[]> {
    return this.http.get<Tarifa[]>(this.apiUrl);
  }

  // Obtener una tarifa por ID
  getTarifaById(id: string): Observable<Tarifa> {
    return this.http.get<Tarifa>(`${this.apiUrl}/${id}`);
  }

  // Crear una nueva tarifa
  createTarifa(tarifa: CreateTarifaDto): Observable<Tarifa> {
    return this.http.post<Tarifa>(this.apiUrl, tarifa);
  }

  // Actualizar una tarifa
  updateTarifa(id: string, tarifa: UpdateTarifaDto): Observable<Tarifa> {
    return this.http.put<Tarifa>(`${this.apiUrl}/${id}`, tarifa);
  }

  // Eliminar una tarifa
  deleteTarifa(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}