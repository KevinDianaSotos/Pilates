// header.component.ts
import { Component, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificacionesService, Notificacion } from '../../services/notificaciones.service';
import { Observable, Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Output() toggleMenu = new EventEmitter<void>();

  private authService = inject(AuthService);
  private notificacionesService = inject(NotificacionesService);
  private router = inject(Router);
  private subscriptions = new Subscription();

  showNotifications = false;
  showUserMenu = false;
  currentRoute = 'Dashboard';
  isAdmin = true;
  
  user$: Observable<any> = this.authService.getUser();
  
  // Notificaciones
  notificaciones: Notificacion[] = [];
  noLeidas = 0;

  ngOnInit() {
    this.cargarNotificaciones();
    
    // Polling cada 30 segundos para notificaciones nuevas (admin)
    this.subscriptions.add(
      interval(30000).pipe(
        switchMap(() => this.notificacionesService.getNotificacionesAdmin(true))
      ).subscribe({
        next: (notis) => {
          this.notificaciones = notis;
          this.noLeidas = notis.length;
        },
        error: (err) => console.error('Error polling notificaciones:', err)
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  cargarNotificaciones() {
    this.notificacionesService.getNotificacionesAdmin(true).subscribe({
      next: (notis) => {
        this.notificaciones = notis;
        this.noLeidas = notis.length;
      },
      error: (err) => console.error('Error cargando notificaciones:', err)
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
      this.cargarNotificaciones();
    }
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
    }
  }

  marcarComoLeida(id: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.notificacionesService.marcarComoLeida(id).subscribe({
      next: () => {
        this.cargarNotificaciones();
      },
      error: (err) => console.error('Error marcando notificación:', err)
    });
  }

  marcarTodasComoLeidas() {
    this.notificacionesService.marcarTodasComoLeidas().subscribe({
      next: () => {
        this.cargarNotificaciones();
      },
      error: (err) => console.error('Error marcando todas:', err)
    });
  }

  verTodasLasNotificaciones() {
    this.showNotifications = false;
    this.router.navigate(['/admin/notificaciones']);
  }

  getIconoNotificacion(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'nueva_clase': '📢',
      'clase_eliminada': '❌',
      'clase_llena': '⚠️',
      'pago_proximo': '⏰',
      'pago_vencido': '⚠️'
    };
    return iconos[tipo] || '📢';
  }

  getIconoMaterial(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'nueva_clase': 'event',
      'clase_eliminada': 'cancel',
      'clase_llena': 'warning',
      'pago_proximo': 'schedule',
      'pago_vencido': 'payment'
    };
    return iconos[tipo] || 'notifications';
  }

  getColorNotificacion(tipo: string): string {
    const colores: { [key: string]: string } = {
      'nueva_clase': '#3498db',
      'clase_eliminada': '#95a5a6',
      'clase_llena': '#e74c3c',
      'pago_proximo': '#f39c12',
      'pago_vencido': '#e74c3c'
    };
    return colores[tipo] || '#95a5a6';
  }

  getTiempoRelativo(fecha: Date): string {
    const ahora = new Date();
    const notiFecha = new Date(fecha);
    const diffMs = ahora.getTime() - notiFecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    return `Hace ${diffDias} d`;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}