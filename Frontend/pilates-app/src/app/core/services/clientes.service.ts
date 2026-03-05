// src/app/core/services/clientes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Tarifa {
  id: string;
  nombre: string;
  precio: number;
  maxClasesMes: number;
  descripcion: string;
}

export interface Cliente {
  id: string;
  name: string;
  email: string;
  phone: string;
  tarifa: Tarifa | null;
  status: 'active' | 'inactive' | 'pending';
  totalBookings: number;
  lastVisit?: Date | string;
  fechaBajaSolicitada?: Date | string | null;
  fechaBajaEfectiva?: Date | string | null;
  
  fechaUltimoPago?: Date | string | null;
  fechaProximoPago?: Date | string | null;
  estadoPago?: 'al_dia' | 'pendiente' | 'vencido';
}

export interface CreateClienteDto {
  name: string;
  email: string;
  phone: string;
  password: string;
  tarifaId?: string | null;
}

export interface UpdateClienteDto {
  name: string;
  email: string;
  phone: string;
  password?: string;
  tarifaId?: string | null;
}

export interface ClienteStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  newThisMonth: number;
  expiringSoon: number;
}

export interface ClienteBooking {
  id: string;
  classId: string;
  className: string;
  date: Date | string;
  attended: boolean;
}

export interface InfoPago {
  estadoPago: 'al_dia' | 'pendiente' | 'vencido';
  fechaUltimoPago?: Date | string | null;
  fechaProximoPago?: Date | string | null;
  ultimoPago?: {
    id: string;
    monto: number;
    fechaPago: Date | string;
    metodoPago: string;
    periodo: string;
  } | null;
}

export interface ClienteDetalle extends Cliente {
  bookings: ClienteBooking[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  infoPago?: InfoPago;
}

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private apiUrl = `${environment.apiUrl}/users/clientes`;

  constructor(private http: HttpClient) { }

  // Obtener todos los clientes
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  // Obtener un cliente por ID
  getClienteById(id: string): Observable<ClienteDetalle> {
    return this.http.get<ClienteDetalle>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo cliente
  createCliente(cliente: CreateClienteDto): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  // Actualizar un cliente
  updateCliente(id: string, cliente: UpdateClienteDto): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  // Eliminar un cliente
  deleteCliente(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Obtener estadísticas
  getStats(): Observable<ClienteStats> {
    return this.http.get<ClienteStats>(`${this.apiUrl}/stats`);
  }

  // Buscar clientes
  searchClientes(term: string): Observable<{ id: string; name: string; email: string; phone: string }[]> {
    return this.http.get<{ id: string; name: string; email: string; phone: string }[]>(
      `${this.apiUrl}/search`, 
      { params: { term } }
    );
  }

  // Solicitar baja de cliente
  solicitarBaja(id: string): Observable<{ message: string; fechaBajaEfectiva: Date }> {
    return this.http.post<{ message: string; fechaBajaEfectiva: Date }>(
      `${this.apiUrl}/${id}/baja`, 
      {}
    );
  }

  // Reactivar cliente
  reactivarCliente(id: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/${id}/reactivar`,
      {}
    );
  }
}