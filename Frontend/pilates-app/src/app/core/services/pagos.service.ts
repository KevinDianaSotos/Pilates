// src/app/core/services/pagos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Pago {
  id: string;
  userId: string;
  cliente: string;
  monto: number;
  fechaPago: Date;
  fechaProximoPago: Date;
  metodoPago: string;
  periodo: string;
  estado: string;
  referencia?: string;
}

export interface CreatePagoDto {
  userId: string;
  monto: number;
  fechaPago: Date;
  metodoPago: string;
  referencia?: string;
  notas?: string;
}

export interface EstadisticasPagos {
  ingresosMes: number;
  clientesAlDia: number;
  clientesVencidos: number;
}

@Injectable({
  providedIn: 'root'
})
export class PagosService {
  private apiUrl = `${environment.apiUrl}/pagos`;

  constructor(private http: HttpClient) { }

  getPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(this.apiUrl);
  }

  getPagosByCliente(userId: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/cliente/${userId}`);
  }

  getEstadisticas(): Observable<EstadisticasPagos> {
    return this.http.get<EstadisticasPagos>(`${this.apiUrl}/estadisticas`);
  }

  registrarPago(pago: CreatePagoDto): Observable<any> {
    return this.http.post(this.apiUrl, pago);
  }
}