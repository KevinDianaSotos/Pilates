import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface Reserva {
  id: string;
  userId: string;
  cliente: string;
  attended: boolean;
  createdAt: Date;
}

export interface MisReservas {
  id: string;
  claseId: string;
  fecha: Date;
  instructor: string;
  duracion: number;
  atendio: boolean;
  puedeCancelar: boolean;
}

export interface CreateBookingDto {
  classId: string;
}

export interface AdminAssignBookingDto {
  userId: string;
  classId: string;
  attended?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BookingsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Para clientes
  getMisReservas(): Observable<MisReservas[]> {
    return this.http.get<MisReservas[]>(`${this.apiUrl}/booking/mis-reservas`);
  }

  reservarClase(dto: CreateBookingDto): Observable<any> {
  const url = `${this.apiUrl}/booking/reservar`;
  return this.http.post(url, dto);
}

  cancelarReserva(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/booking/${id}`);
  }

  // Para admin
  getClientesPorClase(classId: string): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.apiUrl}/booking/admin/clientes-por-clase/${classId}`);
  }

  asignarCliente(dto: AdminAssignBookingDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/booking/admin/asignar`, dto);
  }

  marcarAsistencia(bookingId: string, attended: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/booking/admin/marcar-asistencia/${bookingId}`, attended);
  }
}