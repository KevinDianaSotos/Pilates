// src/app/features/instructors/instructors.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InstructorsService, Instructor } from '../../core/services/instructors.service';
import { NotificationService } from '../../core/services/notification.service';
import { DialogService } from '../../core/services/dialog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-instructors',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './instructors.component.html',
  styleUrls: ['./instructors.component.scss']
})
export class InstructorsComponent implements OnInit, OnDestroy {
  private instructorsService = inject(InstructorsService);
  private notificationService = inject(NotificationService);
  private dialogService = inject(DialogService);
  private subscriptions = new Subscription();

  instructores: Instructor[] = [];
  filteredInstructores: Instructor[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  showModal: boolean = false;
  isEditMode: boolean = false;
  selectedInstructor: Instructor | null = null;

  // Estadísticas
  stats = {
    total: 0,
    activos: 0
  };

  // Formulario
  formData = {
    name: '',
    email: '',
    phone: '',
    password: '',
    especialidad: '',
    bio: ''
  };

  ngOnInit() {
    this.loadInstructores();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadInstructores() {
    this.isLoading = true;
    const sub = this.instructorsService.getInstructores().subscribe({
      next: (data) => {
        this.instructores = data;
        this.filteredInstructores = data;
        this.calcularStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading instructors:', error);
        this.notificationService.showError('Error al cargar instructores');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  calcularStats() {
    this.stats.total = this.instructores.length;
    this.stats.activos = this.instructores.filter(i => i.activo).length;
  }

  filterInstructores() {
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredInstructores = this.instructores.filter(i =>
        i.name.toLowerCase().includes(term) ||
        i.email.toLowerCase().includes(term) ||
        (i.especialidad && i.especialidad.toLowerCase().includes(term))
      );
    } else {
      this.filteredInstructores = this.instructores;
    }
  }

  openCreateModal() {
    this.isEditMode = false;
    this.formData = {
      name: '',
      email: '',
      phone: '',
      password: '',
      especialidad: '',
      bio: ''
    };
    this.showModal = true;
  }

  openEditModal(instructor: Instructor) {
    this.isEditMode = true;
    this.selectedInstructor = instructor;
    this.formData = {
      name: instructor.name,
      email: instructor.email,
      phone: instructor.phone,
      password: '',
      especialidad: instructor.especialidad || '',
      bio: instructor.bio || ''
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedInstructor = null;
  }

  saveInstructor() {
    if (!this.validateForm()) return;

    this.isLoading = true;

    if (this.isEditMode && this.selectedInstructor) {
      // Para edición, no enviar password si está vacío
      const dataToSend: any = {
        name: this.formData.name,
        email: this.formData.email,
        phone: this.formData.phone,
        especialidad: this.formData.especialidad,
        bio: this.formData.bio
      };

      const sub = this.instructorsService.updateInstructor(this.selectedInstructor.id, dataToSend).subscribe({
        next: () => {
          this.notificationService.showSuccess('Instructor actualizado correctamente');
          this.loadInstructores();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating instructor:', error);
          this.notificationService.showError('Error al actualizar instructor');
          this.isLoading = false;
        }
      });
      this.subscriptions.add(sub);
    } else {
      const sub = this.instructorsService.createInstructor(this.formData).subscribe({
        next: () => {
          this.notificationService.showSuccess('Instructor creado correctamente');
          this.loadInstructores();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating instructor:', error);
          this.notificationService.showError('Error al crear instructor');
          this.isLoading = false;
        }
      });
      this.subscriptions.add(sub);
    }
  }

  deleteInstructor(id: string) {
    const instructor = this.instructores.find(i => i.id === id);
    
    this.dialogService.confirm({
      title: 'Eliminar instructor',
      message: `¿Estás seguro de eliminar a ${instructor?.name}?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.procesarEliminacion(id);
      }
    });
  }

  procesarEliminacion(id: string) {
    this.isLoading = true;
    const sub = this.instructorsService.deleteInstructor(id).subscribe({
      next: () => {
        this.notificationService.showSuccess('Instructor eliminado correctamente');
        this.loadInstructores();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error deleting instructor:', error);
        this.notificationService.showError('Error al eliminar instructor');
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  validateForm(): boolean {
    if (!this.formData.name?.trim()) {
      this.notificationService.showWarning('El nombre es requerido');
      return false;
    }
    if (!this.formData.email?.trim()) {
      this.notificationService.showWarning('El email es requerido');
      return false;
    }
    if (!this.formData.phone?.trim()) {
      this.notificationService.showWarning('El teléfono es requerido');
      return false;
    }
    if (!this.isEditMode && !this.formData.password?.trim()) {
      this.notificationService.showWarning('La contraseña es requerida');
      return false;
    }
    return true;
  }

  toggleEstado(instructor: Instructor) {
    const sub = this.instructorsService.updateInstructor(instructor.id, {
      activo: !instructor.activo
    }).subscribe({
      next: () => {
        this.loadInstructores();
        this.notificationService.showSuccess(
          instructor.activo ? 'Instructor desactivado' : 'Instructor activado'
        );
      },
      error: (error) => {
        console.error('Error toggling instructor status:', error);
        this.notificationService.showError('Error al cambiar estado');
      }
    });
    this.subscriptions.add(sub);
  }
}