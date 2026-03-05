import { Component, OnInit, inject, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import { Subscription } from 'rxjs';

import { ClasesService, ClaseDisponible } from '../../../core/services/clases.service';
import { BookingsService } from '../../../core/services/bookings.service';
import { ClientesService } from '../../../core/services/clientes.service';
import { NotificationService } from '../../../core/services/notification.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  private clasesService = inject(ClasesService);
  private bookingsService = inject(BookingsService);
  private clientesService = inject(ClientesService);
  private notificationService = inject(NotificationService);
  private dialogService = inject(DialogService);
  private authService = inject(AuthService);
  private subscriptions = new Subscription();

  // Datos
  clases: ClaseDisponible[] = [];
  instructores: any[] = [];
  selectedClase: ClaseDisponible | null = null;
  userRole: string = '';

  // Estados UI
  isLoading = true;
  isMobile = window.innerWidth < 768;
  errorMessage = '';

  // Modales
  showCreateModal = false;
  showDetailsModal = false;
  showEditModal = false;
  showAsignarModal = false;

  // Formularios
  nuevaClase = {
    fecha: '',
    duracion: 60,
    instructorId: '',
    capacidad: 10
  };

  editarClase = {
    fecha: '',
    duracion: 60,
    instructorId: '',
    capacidad: 10
  };

  // Gestión de clientes
  clientesPorClase: any[] = [];
  clientesDisponibles: any[] = [];
  clienteSeleccionado: string = '';

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
    dateClick: this.handleDateClick.bind(this),
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
    this.authService.getUser().subscribe(user => {
      this.userRole = user?.role || '';
    });
    this.cargarInstructores();
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

  cargarInstructores() {
    this.clasesService.getInstructores().subscribe({
      next: (data) => {
        this.instructores = data;
      },
      error: (error) => {
        console.error('Error cargando instructores:', error);
      }
    });
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
        ...clase
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

  // Handlers de eventos del calendario
  handleDateClick(arg: any) {
    this.nuevaClase.fecha = this.formatearFechaParaInput(arg.date);
    this.abrirModalCrear();
  }

  handleEventClick(arg: any) {
    const claseId = arg.event.id;
    this.selectedClase = this.clases.find(c => c.id === claseId) || null;
    if (this.selectedClase?.isPasada) {
      this.notificationService.showInfo('Esta clase ya ha pasado');
      return;
    }
    if (this.selectedClase) {
      this.showDetailsModal = true;
      this.cargarClientesPorClase(claseId);
    }
  }

  formatearFechaParaInput(fecha: Date): string {
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Gestión de modales
  abrirModalCrear() {
    this.showCreateModal = true;
    this.errorMessage = '';
  }

  cerrarModalCrear() {
    this.showCreateModal = false;
    this.resetFormularioCrear();
  }

  abrirModalEditar() {
    if (this.selectedClase) {
      this.editarClase = {
        fecha: this.formatearFechaParaInput(new Date(this.selectedClase.fecha)),
        duracion: this.selectedClase.duracion,
        instructorId: this.obtenerInstructorId(this.selectedClase.instructor),
        capacidad: this.selectedClase.capacidad
      };
      this.showDetailsModal = false;
      this.showEditModal = true;
    }
  }

  cerrarModalEditar() {
    this.showEditModal = false;
    this.showDetailsModal = true;
  }

  cerrarModalDetalles() {
    this.showDetailsModal = false;
    this.selectedClase = null;
    this.clientesPorClase = [];
  }

  abrirModalAsignar() {
    this.clienteSeleccionado = '';
    this.clientesService.getClientes().subscribe({
      next: (clientes) => {
        const idsEnClase = this.clientesPorClase.map((c: any) => c.userId);
        this.clientesDisponibles = clientes.filter(c => !idsEnClase.includes(c.id));
        this.showAsignarModal = true;
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
      }
    });
  }

  cerrarModalAsignar() {
    this.showAsignarModal = false;
    this.clienteSeleccionado = '';
  }

  resetFormularioCrear() {
    this.nuevaClase = {
      fecha: '',
      duracion: 60,
      instructorId: '',
      capacidad: 10
    };
  }

  obtenerInstructorId(nombre: string): string {
    const instructor = this.instructores.find(i => i.name === nombre);
    return instructor?.id || '';
  }

  // CRUD de clases
  crearClase() {
    if (!this.validarFormularioCrear()) return;

    this.isLoading = true;
    this.errorMessage = '';

    const claseData = {
      date: new Date(this.nuevaClase.fecha).toISOString(),
      instructorId: this.nuevaClase.instructorId,
      maxCapacity: this.nuevaClase.capacidad,
      durationMinutes: this.nuevaClase.duracion
    };

    this.clasesService.createClase(claseData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Clase creada correctamente');
        this.cargarClases();
        this.cerrarModalCrear();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creando clase:', error);
        this.errorMessage = error.error?.message || 'Error al crear la clase';
        this.isLoading = false;
      }
    });
  }

  actualizarClase() {
    if (!this.validarFormularioEditar() || !this.selectedClase) return;

    this.isLoading = true;
    this.errorMessage = '';

    const claseData = {
      id: this.selectedClase.id,
      date: new Date(this.editarClase.fecha).toISOString(),
      instructorId: this.editarClase.instructorId,
      maxCapacity: this.editarClase.capacidad,
      durationMinutes: this.editarClase.duracion
    };

    this.clasesService.updateClase(claseData).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Clase actualizada correctamente');
        this.cargarClases();
        this.cerrarModalEditar();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error actualizando clase:', error);
        this.errorMessage = error.error?.message || 'Error al actualizar la clase';
        this.isLoading = false;
      }
    });
  }

  eliminarClase() {
    if (!this.selectedClase) return;

    this.dialogService.confirm({
      title: 'Eliminar clase',
      message: `¿Estás seguro de eliminar la clase del ${this.formatearFecha(this.selectedClase.fecha)}?\n\nEsta acción no se puede deshacer y se notificará a todos los clientes.`,
      confirmText: 'Sí, eliminar clase',
      cancelText: 'Cancelar',
      type: 'danger'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.procesarEliminacion();
      }
    });
  }

  procesarEliminacion() {
    if (!this.selectedClase) return;

    this.isLoading = true;
    
    this.clasesService.eliminarClase(this.selectedClase.id).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Clase eliminada correctamente');
        
        // Eliminar la clase de la lista local
        this.clases = this.clases.filter(c => c.id !== this.selectedClase?.id);
        this.actualizarEventos();
        
        // Cerrar modales
        this.cerrarModalDetalles();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error eliminando clase:', error);
        this.notificationService.showError(error.error?.message || 'Error al eliminar la clase');
        this.isLoading = false;
      }
    });
  }

  // Método auxiliar para formatear fecha
  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Validaciones
  validarFormularioCrear(): boolean {
    if (!this.nuevaClase.fecha) {
      this.errorMessage = 'La fecha es requerida';
      return false;
    }
    if (!this.nuevaClase.instructorId) {
      this.errorMessage = 'El instructor es requerido';
      return false;
    }
    if (this.nuevaClase.capacidad < 1) {
      this.errorMessage = 'La capacidad debe ser mayor a 0';
      return false;
    }
    if (this.nuevaClase.duracion < 15) {
      this.errorMessage = 'La duración mínima es 15 minutos';
      return false;
    }
    return true;
  }

  validarFormularioEditar(): boolean {
    if (!this.editarClase.fecha) {
      this.errorMessage = 'La fecha es requerida';
      return false;
    }
    if (!this.editarClase.instructorId) {
      this.errorMessage = 'El instructor es requerido';
      return false;
    }
    if (this.editarClase.capacidad < 1) {
      this.errorMessage = 'La capacidad debe ser mayor a 0';
      return false;
    }
    if (this.editarClase.duracion < 15) {
      this.errorMessage = 'La duración mínima es 15 minutos';
      return false;
    }
    return true;
  }

  // Gestión de clientes
  cargarClientesPorClase(claseId: string) {
    this.bookingsService.getClientesPorClase(claseId).subscribe({
      next: (clientes) => {
        this.clientesPorClase = clientes;
      },
      error: (error) => {
        console.error('Error cargando clientes:', error);
      }
    });
  }

  asignarCliente() {
    if (!this.clienteSeleccionado || !this.selectedClase) return;

    this.bookingsService.asignarCliente({
      userId: this.clienteSeleccionado,
      classId: this.selectedClase.id,
      attended: false
    }).subscribe({
      next: () => {
        this.notificationService.showSuccess('Cliente asignado correctamente');
        this.cargarClientesPorClase(this.selectedClase!.id);
        this.cerrarModalAsignar();
        
        // Actualizar la clase localmente
        const index = this.clases.findIndex(c => c.id === this.selectedClase?.id);
        if (index !== -1 && this.selectedClase) {
          this.clases[index] = {
            ...this.clases[index],
            reservadas: this.clases[index].reservadas + 1,
            plazasLibres: this.clases[index].plazasLibres - 1
          };
          this.selectedClase = this.clases[index];
          this.actualizarEventos();
        }
      },
      error: (error) => {
        console.error('Error asignando cliente:', error);
        this.notificationService.showError(error.error?.message || 'Error al asignar cliente');
      }
    });
  }
}