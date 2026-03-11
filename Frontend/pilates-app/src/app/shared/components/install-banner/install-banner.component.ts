import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaInstallService } from '../../../core/services/pwa-install.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-install-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './install-banner.component.html',
  styleUrls: ['./install-banner.component.scss']
})
export class InstallBannerComponent implements OnInit, OnDestroy {
  private pwaInstallService = inject(PwaInstallService);
  private subscription = new Subscription();
  
  canInstall = false;
  showBanner = true;
  isMobile = false;
  showIOSModal = false;

  ngOnInit() {
    // Detectar por tamaño de pantalla (simple y universal)
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));

    // Verificar si ya está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    // Verificar si ya cerró el banner antes
    const bannerClosed = localStorage.getItem('pwa-banner-closed');
    
    if (bannerClosed || isStandalone) {
      this.showBanner = false;
      return;
    }

    // Detectar si es iOS por user agent
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Solo escuchar el evento de instalación si NO es iOS
    if (!isIOS) {
      this.subscription = this.pwaInstallService.canInstall$.subscribe(
        canInstall => {
          this.canInstall = canInstall;
          console.log('canInstall (Android/PC):', canInstall);
        }
      );
    } else {
      // En iOS, siempre puede "instalarse"
      this.canInstall = true;
      console.log('canInstall (iOS):', true);
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  checkScreenSize() {
    // Consideramos móvil cualquier pantalla menor a 768px
    this.isMobile = window.innerWidth <= 768;
    console.log('Screen width:', window.innerWidth, 'isMobile:', this.isMobile);
  }

  install() {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isIOS) {
      this.showIOSModal = true;
    } else {
      this.pwaInstallService.installPWA();
      this.showBanner = false;
    }
  }

  close() {
    this.showBanner = false;
    localStorage.setItem('pwa-banner-closed', 'true');
  }

  closeIOSModal() {
    this.showIOSModal = false;
  }
}