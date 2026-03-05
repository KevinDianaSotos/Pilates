import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ClasesService, ProximaClase, UltimaClase, ClienteStats } from '../../core/services/clases.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-client.component.html',
  styleUrls: ['./dashboard-client.component.scss']
})
export class DashboardClientComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private clasesService = inject(ClasesService);
  private notificationService = inject(NotificationService);
  private subscriptions = new Subscription();

  user: any = null;
  isLoading = true;
  
  // Datos del dashboard
  stats: ClienteStats = {
    proximasClases: 0,
    totalClases: 0,
    clasesAsistidas: 0,
    clasesEsteMes: 0,
    diasRestantes: 0,
    estadoMembresia: 'Cargando...'
  };

  proximasClases: ProximaClase[] = [];
  ultimasClases: UltimaClase[] = [];

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarStats();
    this.cargarProximasClases();
    this.cargarUltimasClases();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  cargarDatosUsuario() {
    this.subscriptions.add(
      this.authService.getUser().subscribe(user => {
        this.user = user;
      })
    );
  }

  cargarStats() {
    const sub = this.clasesService.getStatsCliente().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        this.notificationService.showError('Error al cargar estadísticas');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  cargarProximasClases() {
    const sub = this.clasesService.getProximasClasesCliente().subscribe({
      next: (clases) => {
        this.proximasClases = clases.map(c => ({
          ...c,
          fecha: new Date(c.fecha)
        }));
      },
      error: (error) => {
        console.error('Error cargando próximas clases:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  cargarUltimasClases() {
    const sub = this.clasesService.getUltimasClasesCliente().subscribe({
      next: (clases) => {
        this.ultimasClases = clases.map(c => ({
          ...c,
          fecha: new Date(c.fecha)
        }));
      },
      error: (error) => {
        console.error('Error cargando últimas clases:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  obtenerSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  getEstadoColor(estado: string): string {
    const colores: any = {
      'Activa': '#2ecc71',
      'Por vencer': '#f39c12',
      'Vencida': '#e74c3c',
      'Sin membresía': '#95a5a6'
    };
    return colores[estado] || '#95a5a6';
  }

  getIconoEstado(estado: string): string {
    const iconos: any = {
      'Activa': 'check_circle',
      'Por vencer': 'warning',
      'Vencida': 'error',
      'Sin membresía': 'info'
    };
    return iconos[estado] || 'info';
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}