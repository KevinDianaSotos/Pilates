import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  private authService = inject(AuthService);
  private router = inject(Router);
  private subscriptions = new Subscription();

  user: any = null;
  isSuperAdmin: boolean = false;

  ngOnInit() {
    // Suscribirse al observable del usuario
    const sub = this.authService.getUser().subscribe(user => {
      this.user = user;
      this.isSuperAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  onClose() {
    this.closeSidebar.emit();
  }

  logout() {
    this.authService.logout();
    this.onClose();
    this.router.navigate(['/login']);
  }
}