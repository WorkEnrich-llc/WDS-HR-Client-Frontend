import { RouterModule, RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FcmService } from './core/services/FCM/fcm.service';
import DeviceDetector from 'device-detector-js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TranslateModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {



  // translate service 
  title = 'WorkEnrich System';


  constructor(private translate: TranslateService, private fcmService: FcmService) {
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



  // ================


  ngOnInit(): void {
    const deviceDetector = new DeviceDetector();
    const userAgent = navigator.userAgent;
    const device = deviceDetector.parse(userAgent);

    let d_family = 'unknown';
    let d_model = 'unknown';

    if (device.device?.type === 'desktop') {
      const osName = device.os?.name?.toLowerCase();
      d_family = 'PC';
      d_model = 'Laptop | PC';

    } else {
      d_family = device.device?.brand || 'unknown';
      d_model = device.device?.model || 'unknown';
    }

    const formData = new FormData();
    formData.append('device_type', device.device?.type || 'unknown');
    formData.append('d_family', d_family);
    formData.append('d_model', d_model);
    formData.append('d_os', device.os?.name || 'unknown');
    formData.append('d_version', device.os?.version || 'unknown');
    formData.append('d_browser', device.client?.name || 'unknown');
    formData.append('d_browser_version', device.client?.version || 'unknown');
    formData.append('fcm_token', 'dummy_fcm_token');

    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        formData.append('ip_address', data.ip);

        console.log('📦 Collected FormData:');
        formData.forEach((value, key) => {
          console.log(`${key}: ${value}`);
        });
      });
  }
}
