import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { Component, } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FcmService } from './core/services/FCM/fcm.service';
import DeviceDetector from 'device-detector-js';
import { AuthenticationService } from './core/services/authentication/authentication.service';
import { ViewportScroller } from '@angular/common';
import { filter, interval, Subscription } from 'rxjs';
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

  title = 'Talent.HR';
  private checkTokenSub?: Subscription;

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
    const existingDeviceToken = localStorage.getItem('device_token');

    if (!existingDeviceToken) {
      await this.registerDeviceAlways();
    }
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

      const fcmToken = await this.fcmService.getToken();
      formData.append('fcm_token', fcmToken || '');

      const isGranted = Notification.permission === 'granted';
      formData.append('is_fcm', isGranted ? '1' : '0');
      localStorage.setItem('is_fcm', isGranted ? 'true' : 'false');

      // const ipResponse: any = await firstValueFrom(
      //   this.http.get('https://api.ipify.org?format=json')
      // );
      // formData.append('ip', ipResponse?.ip || '');

      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      formData.append('ip', data.ip);

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
    this.checkTokenSub = interval(1000 * 60).subscribe(async () => {
      await this.checkTokenChangesPeriodically();
    });
  }

  private async checkTokenChangesPeriodically(): Promise<void> {
    try {
      const newToken = await this.fcmService.getToken();
      const oldToken = localStorage.getItem('fcm_token');
      if (Notification.permission !== 'granted') {
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
        // console.log('FCM token updated successfully');
      } else {
        // console.log('No token change detected.');
      }
    } catch (err) {
      console.error('Error while checking FCM token:', err);
    }
  }


}
