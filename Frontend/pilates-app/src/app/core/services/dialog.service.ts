// dialog.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

export interface DialogOption {
  value: string;
  label: string;
  icon?: string;
}

export interface DialogConfig {
  title: string;
  message: string;
  options?: DialogOption[];
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
}

export interface DialogResult {
  confirmed: boolean;
  selectedOption?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private dialogSubject = new BehaviorSubject<DialogConfig | null>(null);
  private resultSubject = new BehaviorSubject<DialogResult | null>(null);
  
  dialog$ = this.dialogSubject.asObservable();
  
  confirm(config: DialogConfig): Observable<boolean> {
    this.dialogSubject.next(config);
    
    return this.resultSubject.asObservable().pipe(
      filter(result => result !== null),
      take(1),
      map(result => result!.confirmed)
    );
  }
  
  confirmConOpciones(config: DialogConfig): Observable<DialogResult> {
    this.dialogSubject.next(config);
    
    return this.resultSubject.asObservable().pipe(
      filter(result => result !== null),
      take(1)
    );
  }
  
  close(result: DialogResult) {
    this.resultSubject.next(result);
    setTimeout(() => {
      this.dialogSubject.next(null);
      this.resultSubject.next(null);
    }, 300);
  }
}