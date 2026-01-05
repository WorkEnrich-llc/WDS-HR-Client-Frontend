import { Injectable } from '@angular/core';
import { versionInfo } from '../../../environments/version';

declare global {
  interface Window {
    APP_VERSION: typeof versionInfo;
  }
}

// Strongly-typed shape for version info; some fields may be missing depending on generation
interface VersionInfo {
  version?: string;
  buildDate?: string;
  buildTimestamp?: number;
  branch?: string;
  commit?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  private readonly version: VersionInfo = versionInfo as VersionInfo;

  constructor() {
    // Display version info in console
    this.displayVersionInfo();

    // Make version available globally
    if (typeof window !== 'undefined') {
      // Cast to any because generated `versionInfo` has a stricter type in the env file
      (window as any).APP_VERSION = this.version as any;
    }
  }

  getVersionInfo() {
    return this.version;
  }

  getVersion(): string {
    return this.version.version ?? '0.0.0';
  }

  // Return branch if available, otherwise an empty string
  getBranch(): string {
    return this.version.branch ?? '';
  }

  // Return commit hash if available
  getCommit(): string {
    return this.version.commit ?? '';
  }

  // Return buildDate if available
  getBuildDate(): string {
    return this.version.buildDate ?? '';
  }

  private displayVersionInfo(): void {
    // const styles = {
    //   title: 'color: #2196F3; font-size: 16px; font-weight: bold;',
    //   info: 'color: #4CAF50; font-size: 12px;',
    //   value: 'color: #FF9800; font-size: 12px; font-weight: bold;'
    // };

    // console.group('%c🚀 WDS HR Client - Version Info', styles.title);
    // console.log('%c📦 Version:', styles.info, '%c' + (this.version.version ?? 'unknown'), styles.value);

    if (this.version.branch) {
      // console.log('%c🌿 Branch:', styles.info, '%c' + this.version.branch, styles.value);
    } else {
      // console.log('%c🌿 Branch:', styles.info, '%cunknown', styles.value);
    }

    if (this.version.commit) {
      // console.log('%c📝 Commit:', styles.info, '%c' + this.version.commit, styles.value);
    }

    if (this.version.buildDate) {
      try {
        // console.log('📅 Build Date:', styles.info, '%c' + d.toLocaleString(), styles.value);
      } catch (e) {
        // console.log('📅 Build Date:', styles.info, '%c' + this.version.buildDate, styles.value);
      }
    } else if (this.version.buildTimestamp) {
      // const d = new Date(Number(this.version.buildTimestamp));
      // console.log('📅 Build Timestamp:', styles.info, '%c' + (isNaN(d.getTime()) ? String(this.version.buildTimestamp) : d.toLocaleString()), styles.value);
    } else {
      // console.log('� Build Date:', styles.info, '%cunknown', styles.value);
    }
    // console.log('💻 Environment:', styles.info, '%c' + envLabel, styles.value);
    console.groupEnd();

    // Also log a simple version for easy access
    // console.log(`Version: ${this.version.version ?? 'unknown'}`, 'color: #2196F3; font-weight: bold;');
  }

  // Method to display version in UI
  // Returns a compact version string; include commit only when present
  getVersionString(): string {
    const v = this.version.version ?? '0.0.0';
    const c = this.getCommit();
    return c ? `v${v} (${c})` : `v${v}`;
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
