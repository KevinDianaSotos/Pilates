// client-calendar.component.ts
import { Component, OnInit, inject, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list'; // Añadir plugin de lista
import esLocale from '@fullcalendar/core/locales/es';
import { Subscription } from 'rxjs';

import { ClasesService, ClaseDisponible } from '../../core/services/clases.service';
import { BookingsService } from '../../core/services/bookings.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-client-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './client-calendar.component.html',
  styleUrls: ['./client-calendar.component.scss']
})
export class ClientCalendarComponent implements OnInit, OnDestroy {
  private clasesService = inject(ClasesService);
  private bookingsService = inject(BookingsService);
  private notificationService = inject(NotificationService);
  private dialogService = inject(DialogService);
  private subscriptions = new Subscription();

  clases: ClaseDisponible[] = [];
  selectedClase: ClaseDisponible | null = null;
  showModal = false;
  isLoading = true;
  isMobile = window.innerWidth < 768;

  // Escuchar cambios de tamaño de ventana
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.isMobile = window.innerWidth < 768;
    this.updateCalendarView();
  }

  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: this.isMobile ? 'listWeek' : 'dayGridMonth,timeGridWeek,listWeek'
    },
    initialView: this.isMobile ? 'listWeek' : 'dayGridMonth',
    events: [],
    locale: esLocale,
    eventClick: this.handleEventClick.bind(this),
    timeZone: 'local',
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    height: 'auto',
    contentHeight: 'auto',
    aspectRatio: this.isMobile ? 1.2 : 1.8,
    expandRows: true,
    stickyHeaderDates: !this.isMobile,
    nowIndicator: true,
    dayMaxEvents: this.isMobile ? 1 : 3,
    eventDisplay: 'block',
    eventTextColor: '#ffffff',
    views: {
      listWeek: { 
        type: 'list',
        duration: { weeks: 1 },
        buttonText: 'Lista'
      }
    }
  };

  ngOnInit() {
    this.cargarClases();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  updateCalendarView() {
    this.calendarOptions = {
      ...this.calendarOptions,
      initialView: this.isMobile ? 'listWeek' : 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: this.isMobile ? 'listWeek' : 'dayGridMonth,timeGridWeek,listWeek'
      },
      aspectRatio: this.isMobile ? 1.2 : 1.8,
      stickyHeaderDates: !this.isMobile,
      dayMaxEvents: this.isMobile ? 1 : 3
    };
  }

  cargarClases() {
    this.isLoading = true;
    const sub = this.clasesService.getClasesDisponibles().subscribe({
      next: (clases) => {
        this.clases = clases;
        this.actualizarEventos();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando clases:', error);
        this.notificationService.showError('Error al cargar las clases');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  actualizarEventos() {
    const events = this.clases.map(clase => ({
      id: clase.id,
      title: `Pilates`,
      start: clase.fecha,
      end: new Date(new Date(clase.fecha).getTime() + clase.duracion * 60000),
      backgroundColor: this.getColorPorOcupacion(clase),
      borderColor: this.getColorPorOcupacion(clase),
      textColor: '#ffffff',
      extendedProps: {
        ...clase,
        isPasada: clase.isPasada
      }
    }));

    this.calendarOptions = {
      ...this.calendarOptions,
      events: events
    };
  }

  getColorPorOcupacion(clase: any): string {
  if (clase.isPasada) return '#95a5a6'; 
  if (clase.plazasLibres === 0) return '#e74c3c';
  const ocupacion = (clase.reservadas / clase.capacidad) * 100;
  if (ocupacion >= 90) return '#e74c3c';
  if (ocupacion >= 70) return '#f39c12';
  return '#2ecc71';
}

  handleEventClick(arg: any) {
    const claseId = arg.event.id;
    this.selectedClase = this.clases.find(c => c.id === claseId) || null;
    if (this.selectedClase?.isPasada) {
      this.notificationService.showInfo('Esta clase ya ha pasado');
      return;
    }
    if (this.selectedClase) {
      this.showModal = true;
    }
  }

  reservarClase() {
    if (!this.selectedClase) return;

    if (this.selectedClase.plazasLibres === 0) {
      this.notificationService.showWarning('Esta clase ya está completa');
      this.showModal = false;
      return;
    }

    this.dialogService.confirm({
      title: 'Confirmar reserva',
      message: `¿Quieres reservar esta clase del ${this.formatFecha(this.selectedClase.fecha)}?`,
      confirmText: 'Sí, reservar',
      cancelText: 'Cancelar',
      type: 'success'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.procesarReserva();
      }
    });
  }

  procesarReserva() {
    if (!this.selectedClase) return;
    
    this.isLoading = true;
    
    this.bookingsService.reservarClase({ classId: this.selectedClase.id }).subscribe({
      next: (response) => {
        const index = this.clases.findIndex(c => c.id === this.selectedClase?.id);
        if (index !== -1 && this.selectedClase) {
          this.clases[index] = {
            ...this.clases[index],
            reservadas: this.clases[index].reservadas + 1,
            plazasLibres: this.clases[index].plazasLibres - 1
          };
          this.selectedClase = this.clases[index];
        }
        
        this.actualizarEventos();
        this.notificationService.showSuccess('¡Clase reservada con éxito!');
        this.showModal = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al reservar:', error);
        this.notificationService.showError(error.error?.message || 'Error al reservar la clase');
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

  cerrarModal() {
    this.showModal = false;
    this.selectedClase = null;
  }
}