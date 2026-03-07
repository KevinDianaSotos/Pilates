// src/app/core/services/notificaciones.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

export interface Notificacion {
  id: string;
  tipo: 'nueva_clase' | 'clase_eliminada' | 'clase_llena' | 'pago_proximo' | 'pago_vencido';
  mensaje: string;
  leida: boolean;
  fechaCreacion: Date;
  referenciaId?: string;
  datos?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private apiUrl = `${environment.apiUrl}/notificacion`;

  constructor(private http: HttpClient) { }

  // Para admin
  getNotificacionesAdmin(soloNoLeidas: boolean = false): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiUrl}?soloNoLeidas=${soloNoLeidas}`);
  }

  // Para cliente
  getNotificacionesCliente(soloNoLeidas: boolean = false): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiUrl}/cliente?soloNoLeidas=${soloNoLeidas}`);
  }

  // Polling para admin (cada 30 segundos)
  getNotificacionesAdminRealtime(): Observable<Notificacion[]> {
    return interval(30000).pipe(
      switchMap(() => this.getNotificacionesAdmin(true))
    );
  }

  // Polling para cliente (cada 30 segundos)
  getNotificacionesClienteRealtime(): Observable<Notificacion[]> {
    return interval(30000).pipe(
      switchMap(() => this.getNotificacionesCliente(true))
    );
  }

  marcarComoLeida(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/leer`, {});
  }

  marcarTodasComoLeidas(): Observable<any> {
    return this.http.post(`${this.apiUrl}/leer-todas`, {});
  }
}