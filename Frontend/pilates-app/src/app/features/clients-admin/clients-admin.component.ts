import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientesService, Cliente, CreateClienteDto, UpdateClienteDto, ClienteStats, ClienteDetalle } from '../../core/services/clientes.service';
import { TarifasService, Tarifa } from '../../core/services/tarifas.service';
import { Subscription } from 'rxjs';
import { DialogService } from '../../core/services/dialog.service';
import { NotificationService } from '../../core/services/notification.service';
import { PagosService } from '../../core/services/pagos.service';

@Component({
  selector: 'app-clients-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clients-admin.component.html',
  styleUrls: ['./clients-admin.component.scss']
})
export class ClientsAdminComponent implements OnInit, OnDestroy {
  private clientesService = inject(ClientesService);
  private tarifasService = inject(TarifasService);
  private dialogService = inject(DialogService);
  private pagosService = inject(PagosService);
  private notificationService = inject(NotificationService);
  private subscriptions: Subscription = new Subscription();

  clients: Cliente[] = [];
  filteredClients: Cliente[] = [];
  searchTerm: string = '';
  selectedFilter: string = 'all';
  isLoading: boolean = false;
  showModal: boolean = false;
  isEditMode: boolean = false;
  selectedClient: Cliente | null = null;

  showDetailsModal: boolean = false;
  selectedClientDetails: ClienteDetalle | null = null;
  tarifas: Tarifa[] = [];

  // Estadísticas
  stats: ClienteStats = {
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    newThisMonth: 0,
    expiringSoon: 0
  };

  // Formulario
  formData: CreateClienteDto | UpdateClienteDto = {
    name: '',
    email: '',
    phone: '',
    password: '',
    tarifaId: null
  };

  ngOnInit() {
    this.loadClients();
    this.loadStats();
    this.loadTarifas();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadClients() {
    this.isLoading = true;
    const sub = this.clientesService.getClientes().subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  registrarPago(cliente: ClienteDetalle) {
    if (!cliente.tarifa) {
      this.notificationService.showWarning('El cliente no tiene una tarifa asignada');
      return;
    }

    // Asegurar que el precio existe y es un número
    const monto = cliente.tarifa.precio;
    if (!monto || monto <= 0) {
      this.notificationService.showError('La tarifa no tiene un precio válido');
      return;
    }

    this.dialogService.confirmConOpciones({
      title: 'Registrar Pago',
      message: `Pago de ${cliente.tarifa.nombre} para ${cliente.name} por ${monto}€`,
      options: [
        { value: 'efectivo', label: 'Efectivo', icon: '💰' },
        { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
        { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
        { value: 'bizum', label: 'Bizum', icon: '📱' }
      ],
      confirmText: 'Registrar Pago',
      cancelText: 'Cancelar',
      type: 'success'
    }).subscribe((result) => {
      if (!result.confirmed || !result.selectedOption) return;

      const pagoData = {
        userId: cliente.id,
        monto: monto, // Usar la variable local validada
        fechaPago: new Date(),
        metodoPago: result.selectedOption,
        notas: `Pago ${cliente.tarifa?.nombre || 'sin tarifa'}`
      };

      this.isLoading = true;
      this.pagosService.registrarPago(pagoData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Pago registrado correctamente');
          this.loadClients();
          this.closeDetailsModal();
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.showError('Error al registrar pago');
          console.error('Error:', error);
          this.isLoading = false;
        }
      });
    });
  }

  loadStats() {
    const sub = this.clientesService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  loadTarifas() {
    const sub = this.tarifasService.getTarifas().subscribe({
      next: (data) => {
        this.tarifas = data;
      },
      error: (error) => {
        console.error('Error loading tarifas:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  filterClients() {
    let filtered = this.clients;

    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(c => c.status === this.selectedFilter);
    }

    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.includes(term)
      );
    }

    this.filteredClients = filtered;
  }

  openCreateModal() {
    this.isEditMode = false;
    this.formData = {
      name: '',
      email: '',
      phone: '',
      password: '',
      tarifaId: null
    };
    this.showModal = true;
  }

  openEditModal(client: Cliente) {
    this.isEditMode = true;
    this.selectedClient = client;
    this.formData = {
      name: client.name,
      email: client.email,
      phone: client.phone,
      tarifaId: client.tarifa?.id || null
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedClient = null;
    this.formData = {
      name: '',
      email: '',
      phone: '',
      password: '',
      tarifaId: null
    };
  }

  saveClient() {
    this.isLoading = true;
    
    if (this.isEditMode && this.selectedClient) {
      const dataToSend = { ...this.formData };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }
      
      const sub = this.clientesService.updateCliente(this.selectedClient.id, dataToSend as UpdateClienteDto).subscribe({
        next: () => {
          this.notificationService.showSuccess('Cliente actualizado correctamente');
          this.loadClients();
          this.loadStats();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.showError('Error al actualizar el cliente: ' + (error.error?.message || error.message));
          console.error('Error updating client:', error);
          this.isLoading = false;
        }
      });
      this.subscriptions.add(sub);
    } else {
      const sub = this.clientesService.createCliente(this.formData as CreateClienteDto).subscribe({
        next: () => {
          this.notificationService.showSuccess('Cliente creado correctamente');
          this.loadClients();
          this.loadStats();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          this.notificationService.showError('Error al crear el cliente: ' + (error.error?.message || error.message));
          console.error('Error creating client:', error);
          this.isLoading = false;
        }
      });
      this.subscriptions.add(sub);
    }
  }

  deleteClient(id: string) {
    this.dialogService.confirm({
      title: 'Confirmar eliminación',
      message: '¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.procesarEliminacion(id);
      }
    });
  }

  procesarEliminacion(id: string) {
    const sub = this.clientesService.deleteCliente(id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Cliente eliminado correctamente');
        this.loadClients();
        this.loadStats();
      },
      error: (error) => {
        this.notificationService.showError('Error al eliminar el cliente: ' + (error.error?.message || error.message));
        console.error('Error deleting client:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  viewClientDetails(client: Cliente) {
    this.isLoading = true;
    const sub = this.clientesService.getClienteById(client.id).subscribe({
      next: (detalle) => {
        this.selectedClientDetails = detalle;
        this.showDetailsModal = true;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading client details:', error);
        alert('Error al cargar los detalles del cliente');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedClientDetails = null;
  }

  openEditModalFromDetails(client: ClienteDetalle) {
    this.closeDetailsModal();
    this.openEditModal(client);
  }

solicitarBaja(cliente: ClienteDetalle) {
  this.dialogService.confirm({
    title: 'Confirmar baja',
    message: `¿Estás seguro de que ${cliente.name} quiere darse de baja? Permanecerá activo hasta fin de mes.`,
    confirmText: 'Sí, dar de baja',
    cancelText: 'Cancelar',
    type: 'warning'
  }).subscribe({
    next: (confirmed) => {
      if (confirmed) {
        this.procesarBaja(cliente);
      } 
    },
    error: (err) => {
    }
  });
}

procesarBaja(cliente: ClienteDetalle) {
  this.isLoading = true;
  
  this.clientesService.solicitarBaja(cliente.id).subscribe({
    next: (response) => {
      this.notificationService.showSuccess(response.message);
      this.loadClients();
      this.closeDetailsModal();
      this.isLoading = false;
    },
    error: (error) => {
      this.notificationService.showError('Error al procesar la baja: ' + (error.error?.message || error.message));
      this.isLoading = false;
    }
  });
}

  // Actualizar método reactivarCliente
  reactivarCliente(cliente: ClienteDetalle) {
    this.dialogService.confirm({
      title: 'Confirmar reactivación',
      message: `¿Estás seguro de que quieres reactivar a ${cliente.name}?`,
      confirmText: 'Sí, reactivar',
      cancelText: 'Cancelar',
      type: 'success'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.procesarReactivacion(cliente);
      }
    });
  }

  procesarReactivacion(cliente: ClienteDetalle) {
    this.isLoading = true;
    this.clientesService.reactivarCliente(cliente.id).subscribe({
      next: (response) => {
        this.notificationService.showSuccess(response.message);
        this.loadClients();
        this.closeDetailsModal();
        this.isLoading = false;
      },
      error: (error) => {
        this.notificationService.showError('Error al reactivar el cliente: ' + (error.error?.message || error.message));
        console.error('Error al reactivar:', error);
        this.isLoading = false;
      }
    });
  }

  getStatusBadge(status: string): string {
    const badges: { [key: string]: string } = {
      active: 'badge-active',
      inactive: 'badge-inactive',
      pending: 'badge-pending'
    };
    return badges[status] || '';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente'
    };
    return texts[status] || status;
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}