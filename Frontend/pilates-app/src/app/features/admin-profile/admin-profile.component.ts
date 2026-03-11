// src/app/features/admin-profile/admin-profile.component.ts (actualizado con servicios reales)
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, UserProfile, UpdateProfileDto, ChangePasswordDto } from '../../core/services/profile.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.scss']
})
export class AdminProfileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private profileService = inject(ProfileService);
  private notificationService = inject(NotificationService);
  private dialogService = inject(DialogService);
  private subscriptions = new Subscription();

  user: UserProfile | null = null;
  isLoading = false;
  isEditing = false;
  changingPassword = false;

  // Formulario de perfil
  profileForm: UpdateProfileDto = {
    name: '',
    email: '',
    phone: ''
  };

  // Formulario de contraseña
  passwordForm: ChangePasswordDto = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadUserData() {
    this.isLoading = true;
    const sub = this.profileService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm = {
          name: user.name,
          email: user.email,
          phone: user.phone || ''
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.notificationService.showError('Error al cargar el perfil');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.changingPassword = false;
    if (!this.isEditing && this.user) {
      // Resetear si cancela
      this.profileForm = {
        name: this.user.name,
        email: this.user.email,
        phone: this.user.phone || ''
      };
    }
  }

  togglePassword() {
    this.changingPassword = !this.changingPassword;
    this.isEditing = false;
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  }

  saveProfile() {
    if (!this.validateProfileForm()) return;

    this.isLoading = true;
    
    const sub = this.profileService.updateProfile(this.profileForm).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.notificationService.showSuccess('Perfil actualizado correctamente');
        this.isEditing = false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.notificationService.showError(error.error?.message || 'Error al actualizar el perfil');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  changePassword() {
    if (!this.validatePasswordForm()) return;

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
    
    const sub = this.profileService.changePassword(this.passwordForm).subscribe({
      next: () => {
        this.notificationService.showSuccess('Contraseña cambiada correctamente');
        this.togglePassword();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.notificationService.showError(error.error?.message || 'Error al cambiar la contraseña');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  validateProfileForm(): boolean {
    if (!this.profileForm.name?.trim()) {
      this.notificationService.showWarning('El nombre es requerido');
      return false;
    }
    if (!this.profileForm.email?.trim()) {
      this.notificationService.showWarning('El email es requerido');
      return false;
    }
    return true;
  }

  validatePasswordForm(): boolean {
    if (!this.passwordForm.currentPassword || !this.passwordForm.newPassword || !this.passwordForm.confirmPassword) {
      this.notificationService.showWarning('Todos los campos son obligatorios');
      return false;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.notificationService.showWarning('Las contraseñas no coinciden');
      return false;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.notificationService.showWarning('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    return true;
  }
}