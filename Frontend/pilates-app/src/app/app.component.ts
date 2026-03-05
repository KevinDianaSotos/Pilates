import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ConfirmDialogComponent, ToastComponent],
  template: `<router-outlet></router-outlet>
    <app-confirm-dialog></app-confirm-dialog>
    <app-toast></app-toast>`,
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.authService.loadCurrentUser().subscribe();
    }
  }
}