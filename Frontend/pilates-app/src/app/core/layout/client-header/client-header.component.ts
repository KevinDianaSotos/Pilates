// client-header.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificacionesService, Notificacion } from '../../services/notificaciones.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-client-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-header.component.html',
  styleUrls: ['./client-header.component.scss']
})
export class ClientHeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificacionesService = inject(NotificacionesService);
  private router = inject(Router);
  private subscriptions = new Subscription();

  user: any = null;
  showNotifications = false;
  showUserMenu = false;
  showMobileMenu = false;
  
  notificaciones: Notificacion[] = [];
  notificacionesNoLeidas = 0;

  ngOnInit() {
    // Cargar usuario
    this.subscriptions.add(
      this.authService.getUser().subscribe(user => {
        this.user = user;
      })
    );

    // Cargar notificaciones iniciales
    this.cargarNotificaciones();

    // Polling cada 30 segundos para notificaciones nuevas
    this.subscriptions.add(
      interval(30000).pipe(
        switchMap(() => this.notificacionesService.getNotificacionesCliente(true))
      ).subscribe({
        next: (notis) => {
          this.notificaciones = notis;
          this.notificacionesNoLeidas = notis.length;
        },
        error: (err) => console.error('Error polling notificaciones:', err)
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  cargarNotificaciones() {
    this.notificacionesService.getNotificacionesCliente().subscribe({
      next: (notis) => {
        this.notificaciones = notis;
        this.notificacionesNoLeidas = notis.filter(n => !n.leida).length;
      },
      error: (err) => console.error('Error cargando notificaciones:', err)
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showUserMenu = false;
      this.showMobileMenu = false;
      this.cargarNotificaciones();
    }
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    if (this.showUserMenu) {
      this.showNotifications = false;
      this.showMobileMenu = false;
    }
  }

  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;
    if (this.showMobileMenu) {
      this.showUserMenu = false;
      this.showNotifications = false;
    }
  }

  closeMobileMenu() {
    this.showMobileMenu = false;
  }

  marcarComoLeida(id: string, event?: MouseEvent) {
    if (event) event.stopPropagation();
    
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

  getIconoNotificacion(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'pago_proximo': '⏰',
      'pago_vencido': '⚠️',
      'nueva_clase': '📢'
    };
    return iconos[tipo] || '📢';
  }

  getIconoMaterial(tipo: string): string {
    const iconos: { [key: string]: string } = {
      'pago_proximo': 'schedule',
      'pago_vencido': 'payment',
      'nueva_clase': 'event'
    };
    return iconos[tipo] || 'notifications';
  }

  getColorNotificacion(tipo: string): string {
    const colores: { [key: string]: string } = {
      'pago_proximo': '#f39c12',
      'pago_vencido': '#e74c3c',
      'nueva_clase': '#3498db'
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

  irANotificacion(noti: Notificacion) {
    this.marcarComoLeida(noti.id);
    this.showNotifications = false;

    if (noti.tipo === 'nueva_clase') {
      this.router.navigate(['/client/calendario']);
    } else if (noti.tipo === 'pago_proximo' || noti.tipo === 'pago_vencido') {
      this.router.navigate(['/client/membresia']);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}