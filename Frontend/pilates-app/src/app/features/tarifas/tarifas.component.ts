// src/app/features/tarifas/tarifas.component.ts
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TarifasService, Tarifa } from '../../core/services/tarifas.service';
import { ClientesService } from '../../core/services/clientes.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tarifas.component.html',
  styleUrls: ['./tarifas.component.scss']
})
export class TarifasComponent implements OnInit, OnDestroy {
  private tarifasService = inject(TarifasService);
  private clientesService = inject(ClientesService);
  private subscriptions: Subscription = new Subscription();

  tarifas: Tarifa[] = [];
  filteredTarifas: Tarifa[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  showModal: boolean = false;
  isEditMode: boolean = false;
  selectedTarifa: Tarifa | null = null;

  // Estadísticas
  stats = {
    total: 0,
    activas: 0,
    precioPromedio: 0,
    tarifaMasUsada: { nombre: 'N/A', count: 0 } 
  };

  // Formulario
  formData = {
    nombre: '',
    precio: 0,
    maxClasesMes: 0,
    descripcion: ''
  };

  ngOnInit() {
    this.loadTarifas();
    this.loadClientesParaEstadisticas();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadTarifas() {
    this.isLoading = true;
    const sub = this.tarifasService.getTarifas().subscribe({
      next: (data) => {
        this.tarifas = data;
        this.filteredTarifas = data;
        this.calcularEstadisticasBasicas();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tarifas:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  loadClientesParaEstadisticas() {
    const sub = this.clientesService.getClientes().subscribe({
      next: (clientes) => {
        this.calcularTarifaMasUsada(clientes);
      },
      error: (error) => {
        console.error('Error loading clients for stats:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  calcularEstadisticasBasicas() {
    this.stats.total = this.tarifas.length;
    this.stats.activas = this.tarifas.length; // Todas activas por ahora
    
    if (this.tarifas.length > 0) {
      this.stats.precioPromedio = this.tarifas.reduce((acc, t) => acc + t.precio, 0) / this.tarifas.length;
    } else {
      this.stats.precioPromedio = 0;
    }
  }

  calcularTarifaMasUsada(clientes: any[]) {
    if (!clientes || clientes.length === 0) {
      this.stats.tarifaMasUsada = { nombre: 'N/A', count: 0 };
      return;
    }

    // Contar cuántos clientes tienen cada tarifa
    const conteoTarifas = new Map<string, { nombre: string, count: number }>();
    
    clientes.forEach(cliente => {
      if (cliente.tarifa && cliente.tarifa.id) {
        const tarifaId = cliente.tarifa.id;
        const tarifaNombre = cliente.tarifa.nombre;
        
        if (conteoTarifas.has(tarifaId)) {
          const existing = conteoTarifas.get(tarifaId)!;
          existing.count++;
        } else {
          conteoTarifas.set(tarifaId, { nombre: tarifaNombre, count: 1 });
        }
      }
    });

    // Encontrar la tarifa con más clientes
    let maxCount = 0;
    let tarifaMasUsada = { nombre: 'N/A', count: 0 };

    for (const [_, value] of conteoTarifas) {
      if (value.count > maxCount) {
        maxCount = value.count;
        tarifaMasUsada = value;
      }
    }

    this.stats.tarifaMasUsada = tarifaMasUsada;
  }

  filterTarifas() {
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredTarifas = this.tarifas.filter(t => 
        t.nombre.toLowerCase().includes(term) ||
        t.descripcion.toLowerCase().includes(term)
      );
    } else {
      this.filteredTarifas = this.tarifas;
    }
  }

  openCreateModal() {
    this.isEditMode = false;
    this.formData = {
      nombre: '',
      precio: 0,
      maxClasesMes: 0,
      descripcion: ''
    };
    this.showModal = true;
  }

  openEditModal(tarifa: Tarifa) {
    this.isEditMode = true;
    this.selectedTarifa = tarifa;
    this.formData = {
      nombre: tarifa.nombre,
      precio: tarifa.precio,
      maxClasesMes: tarifa.maxClasesMes,
      descripcion: tarifa.descripcion
    };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedTarifa = null;
  }

  saveTarifa() {
    if (!this.validateForm()) return;

    this.isLoading = true;

    if (this.isEditMode && this.selectedTarifa) {
      const sub = this.tarifasService.updateTarifa(this.selectedTarifa.id, this.formData).subscribe({
        next: () => {
          this.loadTarifas();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error updating tarifa:', error);
          alert('Error al actualizar la tarifa');
          this.isLoading = false;
        }
      });
      this.subscriptions.add(sub);
    } else {
      const sub = this.tarifasService.createTarifa(this.formData).subscribe({
        next: () => {
          this.loadTarifas();
          this.closeModal();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating tarifa:', error);
          alert('Error al crear la tarifa');
          this.isLoading = false;
        }
      });
      this.subscriptions.add(sub);
    }
  }

  deleteTarifa(id: string) {
    if (confirm('¿Estás seguro de eliminar esta tarifa?')) {
      const sub = this.tarifasService.deleteTarifa(id).subscribe({
        next: () => {
          this.loadTarifas();
        },
        error: (error) => {
          console.error('Error deleting tarifa:', error);
          alert(error.error?.message || 'Error al eliminar la tarifa');
        }
      });
      this.subscriptions.add(sub);
    }
  }

  validateForm(): boolean {
    if (!this.formData.nombre?.trim()) {
      alert('El nombre es requerido');
      return false;
    }
    if (this.formData.precio <= 0) {
      alert('El precio debe ser mayor a 0');
      return false;
    }
    if (this.formData.maxClasesMes <= 0) {
      alert('El número de clases debe ser mayor a 0');
      return false;
    }
    return true;
  }

  formatPrecio(precio: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(precio);
  }
}