import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AppDownloadPlatform = 'ios' | 'android' | 'web';

@Component({
  selector: 'app-download-app',
  standalone: true,
  imports: [],
  templateUrl: './download-app.component.html',
  styleUrls: ['./download-app.component.css'],
})
export class DownloadAppComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  readonly appStoreUrl =
    'https://apps.apple.com/sa/app/talent-hr/id6751693976?l=ar';
  readonly playStoreUrl =
    'https://play.google.com/store/apps/details?id=com.workenrich.employee';

  readonly appStoreBadgeSrc =
    'assets/images/icons/download-on-the-app-store-apple-logo-svgrepo-com.svg';
  readonly googlePlayBadgeSrc =
    'assets/images/icons/google-play-badge-logo-svgrepo-com.svg';

  /** Same path as favicon (`src/assets/t-logo.png`); SVG fallback if missing. */
  readonly appLogoSrc = 'assets/t-logo.png';

  readonly featureItems = [
    'Check-in and check-out',
    'Monthly and yearly attendance insights',
    'Leave, late arrival, and early leave requests',
    'Balances, team absences, and reports for managers',
  ] as const;

  /** Defaults to web when not in browser (SSR) or before detection. */
  platform: AppDownloadPlatform = 'web';

  useLogoImage = true;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.platform = this.detectPlatform();
    }
  }

  get showAppStore(): boolean {
    return this.platform === 'ios' || this.platform === 'web';
  }

  get showPlayStore(): boolean {
    return this.platform === 'android' || this.platform === 'web';
  }

  get isWeb(): boolean {
    return this.platform === 'web';
  }

  onLogoError(): void {
    this.useLogoImage = false;
  }

  private detectPlatform(): AppDownloadPlatform {
    const ua = navigator.userAgent || '';
    const isIOS =
      /iPad|iPhone|iPod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) {
      return 'ios';
    }
    if (/Android/i.test(ua)) {
      return 'android';
    }
    return 'web';
  }
}
