/* notification.service.ts */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();
  private nextId = 0;

  showSuccess(message: string, duration: number = 3000) {
    this.show({ type: 'success', message, duration });
  }

  showError(message: string, duration: number = 5000) {
    this.show({ type: 'error', message, duration });
  }

  showWarning(message: string, duration: number = 4000) {
    this.show({ type: 'warning', message, duration });
  }

  showInfo(message: string, duration: number = 3000) {
    this.show({ type: 'info', message, duration });
  }

  private show(notification: Omit<Notification, 'id'>) {
    const id = this.nextId++;
    const newNotification = { ...notification, id };
    
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, newNotification]);

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => this.removeNotification(id), notification.duration);
    }
  }

  removeNotification(id: number) {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next(current.filter(n => n.id !== id));
  }
}