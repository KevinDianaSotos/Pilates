import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { BookingsService } from '../../core/services/bookings.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';

export interface MisReservas {
  id: string;
  claseId: string;
  fecha: Date;
  instructor: string;
  duracion: number;
  atendio: boolean;
  puedeCancelar: boolean;
}

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.scss']
})
export class MyBookingsComponent implements OnInit, OnDestroy {
  private bookingsService = inject(BookingsService);
  private notificationService = inject(NotificationService);
  private dialogService = inject(DialogService);
  private subscriptions = new Subscription();

  reservas: MisReservas[] = [];
  reservasFiltradas: MisReservas[] = [];
  isLoading = true;
  filtroActual: 'todas' | 'proximas' | 'pasadas' = 'proximas';
  
  // Estadísticas
  stats = {
    proximas: 0,
    total: 0,
    asistidas: 0
  };

  ngOnInit() {
    this.cargarReservas();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  cargarReservas() {
    this.isLoading = true;
    const sub = this.bookingsService.getMisReservas().subscribe({
      next: (reservas) => {
        this.reservas = reservas.map(r => ({
          ...r,
          fecha: new Date(r.fecha)
        }));
        this.calcularStats();
        this.aplicarFiltro();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando reservas:', error);
        this.notificationService.showError('Error al cargar tus reservas');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  calcularStats() {
    const ahora = new Date();
    this.stats = {
      proximas: this.reservas.filter(r => new Date(r.fecha) > ahora).length,
      total: this.reservas.length,
      asistidas: this.reservas.filter(r => r.atendio).length
    };
  }

  aplicarFiltro() {
    const ahora = new Date();
    
    switch (this.filtroActual) {
      case 'proximas':
        this.reservasFiltradas = this.reservas
          .filter(r => new Date(r.fecha) > ahora)
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        break;
      case 'pasadas':
        this.reservasFiltradas = this.reservas
          .filter(r => new Date(r.fecha) <= ahora)
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        break;
      default:
        this.reservasFiltradas = [...this.reservas]
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    }
  }

  cambiarFiltro(filtro: 'todas' | 'proximas' | 'pasadas') {
    this.filtroActual = filtro;
    this.aplicarFiltro();
  }

  cancelarReserva(reserva: MisReservas) {
    if (!reserva.puedeCancelar) {
      this.notificationService.showWarning('No puedes cancelar una clase que ya pasó');
      return;
    }

    this.dialogService.confirm({
      title: 'Cancelar reserva',
      message: `¿Estás seguro de cancelar la clase del ${this.formatFecha(reserva.fecha)}?`,
      confirmText: 'Sí, cancelar',
      cancelText: 'No, mantener',
      type: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.procesarCancelacion(reserva);
      }
    });
  }

  procesarCancelacion(reserva: MisReservas) {
    this.isLoading = true;
    
    this.bookingsService.cancelarReserva(reserva.id).subscribe({
      next: (response) => {
        // Eliminar de la lista
        this.reservas = this.reservas.filter(r => r.id !== reserva.id);
        this.calcularStats();
        this.aplicarFiltro();
        this.notificationService.showSuccess('Reserva cancelada correctamente');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cancelando reserva:', error);
        this.notificationService.showError(error.error?.message || 'Error al cancelar la reserva');
        this.isLoading = false;
      }
    });
  }

  formatFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoClase(reserva: MisReservas): { texto: string; clase: string } {
    const ahora = new Date();
    const fechaClase = new Date(reserva.fecha);
    
    if (reserva.atendio) {
      return { texto: 'Asistió', clase: 'asistio' };
    }
    if (fechaClase < ahora) {
      return { texto: 'No asistió', clase: 'no-asistio' };
    }
    return { texto: 'Pendiente', clase: 'pendiente' };
  }
}