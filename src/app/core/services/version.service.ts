import { Injectable } from '@angular/core';
import { versionInfo } from '../../../environments/version';

declare global {
  interface Window {
    APP_VERSION: typeof versionInfo;
  }
}

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  private readonly version = versionInfo;

  constructor() {
    // Display version info in console
    this.displayVersionInfo();
    
    // Make version available globally
    if (typeof window !== 'undefined') {
      window.APP_VERSION = this.version;
    }
  }

  getVersionInfo() {
    return this.version;
  }

  getVersion(): string {
    return this.version.version;
  }

  getBranch(): string {
    return this.version.branch;
  }

  getCommit(): string {
    return this.version.commit;
  }

  getBuildDate(): string {
    return this.version.buildDate;
  }

  private displayVersionInfo(): void {
    const styles = {
      title: 'color: #2196F3; font-size: 16px; font-weight: bold;',
      info: 'color: #4CAF50; font-size: 12px;',
      value: 'color: #FF9800; font-size: 12px; font-weight: bold;'
    };

    console.group('%c🚀 WDS HR Client - Version Info', styles.title);
    // console.log('%c📦 Version:', styles.info, '%c' + this.version.version, styles.value);
    // console.log('%c🌿 Branch:', styles.info, '%c' + this.version.branch, styles.value);
    // console.log('%c📝 Commit:', styles.info, '%c' + this.version.commit, styles.value);
    console.log('📅 Build Date:', styles.info, '%c' + new Date(this.version.buildDate).toLocaleString(), styles.value);
    console.log('💻 Environment:', styles.info, '%c' + (this.version.branch === 'main' ? 'Production' : this.version.branch), styles.value);
    console.groupEnd();

    // Also log a simple version for easy access
    console.log(`Version: ${this.version.version}`, 'color: #2196F3; font-weight: bold;');
  }

  // Method to display version in UI
  getVersionString(): string {
    return `v${this.version.version} (${this.version.commit})`;
  }

  // Method to check if this is a production build
  isProduction(): boolean {
    return this.version.branch === 'main' || this.version.branch === 'master';
  }

  // Method to check if this is staging
  isStaging(): boolean {
    return this.version.branch === 'staging';
  }

  // Method to check if this is development
  isDevelopment(): boolean {
    return this.version.branch === 'develop' || this.version.branch === 'development';
  }
}
