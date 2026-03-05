// confirm-dialog.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService, DialogResult } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {
  private dialogService = inject(DialogService);
  dialog$ = this.dialogService.dialog$;
  
  selectedOption: string | null = null;

  getIcon(type: string = 'warning'): string {
    const icons: { [key: string]: string } = {
      warning: '⚠️',
      danger: '❌',
      info: 'ℹ️',
      success: '✅'
    };
    return icons[type] || '⚠️';
  }

  selectOption(value: string) {
    this.selectedOption = value;
  }

  onBackdropClick() {
    this.close({ confirmed: false });
  }

  confirm() {
    this.close({ 
      confirmed: true, 
      selectedOption: this.selectedOption || undefined 
    });
  }

  close(result: DialogResult) {
    this.selectedOption = null;
    this.dialogService.close(result);
  }
}