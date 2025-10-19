import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { Component, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FcmService } from './core/services/FCM/fcm.service';
import DeviceDetector from 'device-detector-js';
import { AuthenticationService } from './core/services/authentication/authentication.service';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { ViewportScroller } from '@angular/common';
import { filter, firstValueFrom, interval, Subscription } from 'rxjs';
import { environment } from '../environments/environment';
import { NetworkStatusComponent } from './components/shared/network-status/network-status.component';
import { VersionService } from './core/services/version.service';
import { VersionDisplayComponent } from './components/shared/version-display/version-display.component';
import { SubscriptionService } from './core/services/subscription/subscription.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TranslateModule, RouterOutlet, RouterModule, NetworkStatusComponent, VersionDisplayComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'WorkEnrich System';
  private checkTokenSub?: Subscription;
  // private http = inject(HttpClient);

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
    await this.registerDeviceAlways();
    this.startTokenCheck();
  }

  ngOnDestroy(): void {
    this.checkTokenSub?.unsubscribe();
  }

  private async registerDeviceAlways(): Promise<void> {
    try {
      // const deviceInfo = this.deviceDetector.getDeviceInfo();

      const deviceDetector = new DeviceDetector();
      const userAgent = navigator.userAgent;
      const device = deviceDetector.parse(userAgent);

      const formData = new FormData();
      formData.append('device_type', device.device?.type || 'unknown');
      formData.append('d_family', device.device?.brand || 'unknown');
      formData.append('d_model', device.device?.model || 'unknown');
      formData.append('d_os', device.os?.name || 'unknown');
      formData.append('d_version', device.os?.version || 'unknown');
      formData.append('d_browser', device.client?.name || 'unknown');
      formData.append('d_browser_version', device.client?.version || 'unknown');


      // ✅ جلب التوكين فقط إذا المستخدم وافق
      const fcmToken = await this.fcmService.getToken();
      formData.append('fcm_token', fcmToken || '');

      // ✅ تخزين حالة الإذن بدقة
      const isGranted = Notification.permission === 'granted';
      formData.append('is_fcm', isGranted ? '1' : '0');
      localStorage.setItem('is_fcm', isGranted ? 'true' : 'false');

      // ✅ جلب الـ IP
      // const ipResponse: any = await firstValueFrom(
      //   this.http.get('https://api.ipify.org?format=json')
      // );
      // formData.append('ip', ipResponse?.ip || '');

      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      formData.append('ip', data.ip);

      // ✅ تسجيل الجهاز
      const res: any = await this._AuthenticationService.deviceRegister(formData).toPromise();
      if (res?.data?.device_token) {
        localStorage.setItem('device_token', res.data.device_token);
      }

      if (fcmToken) localStorage.setItem('fcm_token', fcmToken);
    } catch (error) {
      console.error('Error registering device:', error);
    }
  }

  private startTokenCheck(): void {
    // ⏱ فحص كل 30 دقيقة بدل 30 ثانية
    this.checkTokenSub = interval(1000 * 30).subscribe(async () => {
      await this.checkTokenChangesPeriodically();
    });
  }

  private async checkTokenChangesPeriodically(): Promise<void> {
    console.log('🔄 Checking FCM token status at:', new Date().toLocaleTimeString());
    try {
      const newToken = await this.fcmService.getToken();
      const oldToken = localStorage.getItem('fcm_token');

      // ⚠️ فقط لو المستخدم وافق على الإشعارات نحدّث التوكين
      if (Notification.permission !== 'granted') {
        console.log('Permission not granted → skipping token update.');
        localStorage.setItem('is_fcm', 'false');
        return;
      }

      if (newToken && newToken !== oldToken) {
        localStorage.setItem('fcm_token', newToken);
        localStorage.setItem('is_fcm', 'true');

        const deviceToken = localStorage.getItem('device_token') || '';
        const formData = new FormData();
        formData.append('device_token', deviceToken);
        formData.append('fcm_token', newToken);

        await this.fcmService.fcmUpdate(formData).toPromise();
        console.log('✅ FCM token updated successfully');
      } else {
        console.log('No token change detected.');
      }
    } catch (err) {
      console.error('Error while checking FCM token:', err);
    }
  }

  // async ngOnInit(): Promise<void> {

  //   const existingToken = localStorage.getItem('device_token');
  //   if (existingToken && existingToken.trim() !== '') {
  //     this.checkTokenChangesPeriodically();
  //     return;
  //   }

  //   const deviceDetector = new DeviceDetector();
  //   const userAgent = navigator.userAgent;
  //   const device = deviceDetector.parse(userAgent);

  //   let d_family = 'unknown';
  //   let d_model = 'unknown';

  //   if (device.device?.type === 'desktop') {
  //     d_family = 'PC';
  //     d_model = 'Laptop | PC';
  //   } else {
  //     d_family = device.device?.brand || 'unknown';
  //     d_model = device.device?.model || 'unknown';
  //   }

  //   const fcmToken = await Promise.race([
  //     this.fcmService.getToken(),
  //     new Promise<string>((resolve) => setTimeout(() => resolve(''), 3000))
  //   ]);

  //   const formData = new FormData();
  //   formData.append('device_type', device.device?.type || 'unknown');
  //   formData.append('d_family', d_family);
  //   formData.append('d_model', d_model);
  //   formData.append('d_os', device.os?.name || 'unknown');
  //   formData.append('d_version', device.os?.version || 'unknown');
  //   formData.append('d_browser', device.client?.name || 'unknown');
  //   formData.append('d_browser_version', device.client?.version || 'unknown');
  //   formData.append('fcm_token', fcmToken || '');

  //   const fcmStatus = Notification.permission === 'granted';
  //   localStorage.setItem('is_fcm', String(fcmStatus));
  //   formData.append('is_fcm', String(fcmStatus));



  //   fetch('https://api.ipify.org?format=json')
  //     .then(res => res.json())
  //     .then(data => {
  //       formData.append('ip_address', data.ip);

  //       this._AuthenticationService.deviceRegister(formData).subscribe({
  //         next: (response) => {
  //           if (response?.data?.device_token) {
  //             localStorage.setItem('device_token', response.data.device_token);
  //           }
  //           if (response?.data?.fcm_token) {
  //             localStorage.setItem('fcm_token', response.data.fcm_token);
  //           }
  //         },
  //         error: (err) => {
  //           console.error("Device registration error:", err);
  //         }
  //       });
  //     });

  //   this.checkTokenChangesPeriodically();
  // }

  // private checkTokenChangesPeriodically(): void {
  //   const app = initializeApp(environment.firebaseConfig);
  //   const messaging = getMessaging(app);

  //   setInterval(async () => {
  //     console.log('Checking FCM token status at: ' + new Date().toLocaleTimeString());
  //     try {
  //       // const newToken = await getToken(messaging, {
  //       //   vapidKey: 'BAZJR-lUBhT5aY0HsiJOszKuU6U9ifiAkgOIGzaY59oe4WO9Wm_ISlnNfolCg2FMuMbMIKOAcOGjz2XcVeQiW9A'
  //       // });
  //       const newToken = await this.fcmService.getToken();
  //       const oldToken = localStorage.getItem('fcm_token');

  //       if (Notification.permission !== 'granted') {
  //         console.warn('Notification permission is not granted. Skipping token check.');
  //         return;
  //       }

  //       if (newToken && newToken !== oldToken) {
  //         localStorage.setItem('fcm_token', newToken);
  //         const deviceToken = localStorage.getItem('device_token') || '';
  //         const updateFormData = new FormData();
  //         updateFormData.append('device_token', deviceToken);
  //         updateFormData.append('fcm_token', newToken);
  //         console.log('New token found, updating...');
  //         this.fcmService.fcmUpdate(updateFormData).subscribe({
  //           next: () => {
  //             console.log('FCM token updated successfully');
  //           },
  //           error: (err) => {
  //             console.error('Error updating FCM token:', err)
  //           }
  //         });
  //       } else {
  //         console.log('FCM token unchanged.');
  //       }

  //     } catch (err) {
  //       console.error('Error while checking FCM token:', err);
  //     }
  //   }, 30000); // 
  // }
}
