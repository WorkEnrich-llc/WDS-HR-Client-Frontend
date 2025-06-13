import { RouterModule, RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FcmService } from './core/services/FCM/fcm.service';
import DeviceDetector from 'device-detector-js';
import { AuthenticationService } from './core/services/authentication/authentication.service';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';
import { environment } from './../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TranslateModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'WorkEnrich System';

  constructor(
    private translate: TranslateService,
    private fcmService: FcmService,
    private _AuthenticationService: AuthenticationService
  ) {
    const lang = localStorage.getItem('lang') || 'en';
    this.translate.setDefaultLang('en');
    this.translate.use(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    this.updateStyles(lang);
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
    this.checkAndUpdateFcmStatus();
  }



  // update fcm token 
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
    }, 1 * 1000);
  }



  // update fcm status
checkAndUpdateFcmStatus(): void {
  const sessionToken = localStorage.getItem('session_token') || '';
  const cleanedSessionToken = sessionToken.replace(/^"|"$/g, '');
  const fcmToken = localStorage.getItem('fcm_token') || '';

  const permission = Notification.permission;
  let enabled = false;
  if (permission === 'granted') {
    enabled = true;
  } else if (permission === 'default') {
    enabled = true;
  } else if (permission === 'denied') {
    enabled = false;
  }

  const formData = new FormData();
  formData.append('session_token', cleanedSessionToken);
  formData.append('fcm_status', enabled ? 'true' : 'false');
  formData.append('fcm_token', fcmToken);

for (const [key, value] of formData.entries()) {
  console.log(`${key}: ${value}`);
}

  this.fcmService.fcmChangeStatus(formData).subscribe({
    next: () => {
      // console.log('FCM status updated successfully');
      localStorage.setItem('is_fcm', String(enabled));
    },
    error: (err) => {
      console.error('FCM stutus update error: ', err);
    }
  });
}


}
