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
  isAndroid = false;
  isIOS = false;
  showIOSModal = false;

  ngOnInit() {
    this.checkDevice();
    window.addEventListener('resize', this.checkDevice.bind(this));

    // Verificar si ya está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;

    // Verificar si ya cerró el banner antes
    const bannerClosed = localStorage.getItem('pwa-banner-closed');
    
    if (bannerClosed || isStandalone) {
      this.showBanner = false;
      return;
    }

    // Para Android, escuchar el evento de instalación
    if (this.isAndroid) {
      this.subscription = this.pwaInstallService.canInstall$.subscribe(
        canInstall => {
          this.canInstall = canInstall;
        }
      );
    } else if (this.isIOS) {
      // En iOS, siempre puede "instalarse" (añadir a pantalla de inicio)
      this.canInstall = true;
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    window.removeEventListener('resize', this.checkDevice.bind(this));
  }

  checkDevice() {
    const userAgent = navigator.userAgent;
    const isSmallScreen = window.innerWidth <= 768;
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(userAgent);
    
    this.isMobile = isMobileDevice && isSmallScreen;
    this.isAndroid = /Android/i.test(userAgent);
    this.isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  }

  install() {
    if (this.isAndroid) {
      this.pwaInstallService.installPWA();
      this.showBanner = false;
    } else if (this.isIOS) {
      this.showIOSModal = true;
    }
  }

  close() {
    this.showBanner = false;
    localStorage.setItem('pwa-banner-closed', 'true');
  }

  closeIOSModal() {
    this.showIOSModal = false;
    // Opcional: guardar que ya vio las instrucciones
    localStorage.setItem('pwa-ios-instructions-seen', 'true');
  }
}