import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { PerfilService, PerfilUsuario, UpdatePerfilDto, CambiarPasswordDto } from '../../core/services/perfil.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.scss']
})
export class ClientProfileComponent implements OnInit, OnDestroy {
  private perfilService = inject(PerfilService);
  private notificationService = inject(NotificationService);
  private dialogService = inject(DialogService);
  private subscriptions = new Subscription();

  isLoading = true;
  isEditing = false;
  changingPassword = false;

  perfil: PerfilUsuario | null = null;

  // Formulario de edición
  editForm: UpdatePerfilDto = {
    name: '',
    email: '',
    phone: ''
  };

  // Formulario de cambio de contraseña
  passwordForm: CambiarPasswordDto = {
    passwordActual: '',
    passwordNueva: '',
    confirmPassword: ''
  };

  ngOnInit() {
    this.cargarPerfil();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  cargarPerfil() {
    this.isLoading = true;
    const sub = this.perfilService.getMiPerfil().subscribe({
      next: (perfil) => {
        this.perfil = perfil;
        this.editForm = {
          name: perfil.name,
          email: perfil.email,
          phone: perfil.phone
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando perfil:', error);
        this.notificationService.showError('Error al cargar el perfil');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  toggleEdit() {
    if (this.isEditing) {
      // Cancelar edición
      if (this.perfil) {
        this.editForm = {
          name: this.perfil.name,
          email: this.perfil.email,
          phone: this.perfil.phone
        };
      }
    }
    this.isEditing = !this.isEditing;
    this.changingPassword = false;
  }

  togglePassword() {
    this.changingPassword = !this.changingPassword;
    this.isEditing = false;
    if (!this.changingPassword) {
      this.passwordForm = {
        passwordActual: '',
        passwordNueva: '',
        confirmPassword: ''
      };
    }
  }

  guardarPerfil() {
    if (!this.editForm.name || !this.editForm.email || !this.editForm.phone) {
      this.notificationService.showWarning('Todos los campos son obligatorios');
      return;
    }

    this.isLoading = true;
    const sub = this.perfilService.actualizarPerfil(this.editForm).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Perfil actualizado correctamente');
        this.cargarPerfil();
        this.isEditing = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error actualizando perfil:', error);
        this.notificationService.showError(error.error?.message || 'Error al actualizar el perfil');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  cambiarPassword() {
    // Validaciones
    if (!this.passwordForm.passwordActual || !this.passwordForm.passwordNueva || !this.passwordForm.confirmPassword) {
      this.notificationService.showWarning('Todos los campos son obligatorios');
      return;
    }

    if (this.passwordForm.passwordNueva.length < 6) {
      this.notificationService.showWarning('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.passwordForm.passwordNueva !== this.passwordForm.confirmPassword) {
      this.notificationService.showWarning('Las contraseñas no coinciden');
      return;
    }

    this.dialogService.confirm({
      title: 'Cambiar contraseña',
      message: '¿Estás seguro de cambiar tu contraseña?',
      confirmText: 'Sí, cambiar',
      cancelText: 'Cancelar',
      type: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.procesarCambioPassword();
      }
    });
  }

  procesarCambioPassword() {
    this.isLoading = true;
    const sub = this.perfilService.cambiarPassword(this.passwordForm).subscribe({
      next: (response) => {
        this.notificationService.showSuccess('Contraseña actualizada correctamente');
        this.togglePassword();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cambiando contraseña:', error);
        this.notificationService.showError(error.error?.message || 'Error al cambiar la contraseña');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  getEstadoColor(estado: string): string {
    const colores: any = {
      'al_dia': '#2ecc71',
      'pendiente': '#f39c12',
      'vencido': '#e74c3c'
    };
    return colores[estado] || '#95a5a6';
  }

  getEstadoTexto(estado: string): string {
    const textos: any = {
      'al_dia': 'Al día',
      'pendiente': 'Pendiente',
      'vencido': 'Vencido'
    };
    return textos[estado] || estado;
  }
}