import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FcmService } from './core/services/FCM/fcm.service';
import DeviceDetector from 'device-detector-js';
import { AuthenticationService } from './core/services/authentication/authentication.service';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs';
import { environment } from '../environments/environment';
import { NetworkStatusComponent } from './components/shared/network-status/network-status.component';
import { VersionService } from './core/services/version.service';
import { VersionDisplayComponent } from './components/shared/version-display/version-display.component';
import { SubscriptionService } from './core/services/subscription/subscription.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TranslateModule, RouterOutlet, RouterModule, NetworkStatusComponent, VersionDisplayComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'WorkEnrich System';

  constructor(
    private translate: TranslateService,
    private fcmService: FcmService,
    private _AuthenticationService: AuthenticationService,
    private router: Router,
    private viewportScroller: ViewportScroller,
    private versionService: VersionService,
    private subService: SubscriptionService
  ) {
    const lang = localStorage.getItem('lang') || 'en';
    this.translate.setDefaultLang('en');
    this.translate.use(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.updateStyles(lang);

    // Scroll to top on navigation
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.viewportScroller.scrollToPosition([0, 0]);
    });
  }

  updateStyles(lang: string) {
    const linkId = 'lang-style';
    let linkElement = document.getElementById(linkId) as HTMLLinkElement;

    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.id = linkId;
      linkElement.rel = 'stylesheet';
      document.head.appendChild(linkElement);
    }

    linkElement.href = lang === 'ar' ? 'assets/rtl.css' : 'assets/ltr.css';
  }

  async ngOnInit(): Promise<void> {

    const existingToken = localStorage.getItem('device_token');
    if (existingToken && existingToken.trim() !== '') {
      this.checkTokenChangesPeriodically();
      return;
    }

    const deviceDetector = new DeviceDetector();
    const userAgent = navigator.userAgent;
    const device = deviceDetector.parse(userAgent);

    let d_family = 'unknown';
    let d_model = 'unknown';

    if (device.device?.type === 'desktop') {
      d_family = 'PC';
      d_model = 'Laptop | PC';
    } else {
      d_family = device.device?.brand || 'unknown';
      d_model = device.device?.model || 'unknown';
    }

    const fcmToken = await Promise.race([
      this.fcmService.getToken(),
      new Promise<string>((resolve) => setTimeout(() => resolve(''), 3000))
    ]);

    const formData = new FormData();
    formData.append('device_type', device.device?.type || 'unknown');
    formData.append('d_family', d_family);
    formData.append('d_model', d_model);
    formData.append('d_os', device.os?.name || 'unknown');
    formData.append('d_version', device.os?.version || 'unknown');
    formData.append('d_browser', device.client?.name || 'unknown');
    formData.append('d_browser_version', device.client?.version || 'unknown');
    formData.append('fcm_token', fcmToken || '');

    const fcmStatus = Notification.permission === 'granted';
    localStorage.setItem('is_fcm', String(fcmStatus));
    formData.append('is_fcm', String(fcmStatus));

    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        formData.append('ip_address', data.ip);

        this._AuthenticationService.deviceRegister(formData).subscribe({
          next: (response) => {
            if (response?.data?.device_token) {
              localStorage.setItem('device_token', response.data.device_token);
            }
            if (response?.data?.fcm_token) {
              localStorage.setItem('fcm_token', response.data.fcm_token);
            }
          },
          error: (err) => {
            console.error("Device registration error:", err);
          }
        });
      });

    this.checkTokenChangesPeriodically();
  }

  private checkTokenChangesPeriodically(): void {
    const app = initializeApp(environment.firebaseConfig);
    const messaging = getMessaging(app);

    setInterval(async () => {
      try {
        const newToken = await getToken(messaging, {
          vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
        });

        const oldToken = localStorage.getItem('fcm_token');

        if (newToken && newToken !== oldToken) {
          localStorage.setItem('fcm_token', newToken);
          const deviceToken = localStorage.getItem('device_token') || '';
          const updateFormData = new FormData();
          updateFormData.append('device_token', deviceToken);
          updateFormData.append('fcm_token', newToken);

          this.fcmService.fcmUpdate(updateFormData).subscribe({
            next: () => {
              // console.log('FCM token updated successfully')
            },
            error: (err) => {
              console.error('Error updating FCM token:', err)
            }
          });
        }

      } catch (err) {
        console.error('Error while checking FCM token:', err);
      }
    }, 1000);
  }
}
