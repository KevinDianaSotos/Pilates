import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService {
  private deferredPrompt: any;
  public canInstall$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // Detectar si ya está instalado (modo standalone)
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    
    if (isInstalled) {
      console.log('App ya está instalada');
      return;
    }

    // Escuchar el evento de instalación
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.canInstall$.next(true);
    });

    // Cuando se instala, ocultar el botón
    window.addEventListener('appinstalled', () => {
      console.log('App instalada correctamente');
      this.canInstall$.next(false);
    });
  }

  installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((result: any) => {
        if (result.outcome === 'accepted') {
          console.log('Usuario instaló la app');
        }
        this.deferredPrompt = null;
        this.canInstall$.next(false);
      });
    }
  }
}