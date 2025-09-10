// This file is auto-generated. Do not edit manually.
export const versionInfo = {
  "version": "0.0.103",
  "buildDate": "2025-09-06T00:00:00.690Z",
  "buildTimestamp": 1754239499691
};

// Make version available globally
declare global {
  interface Window {
    APP_VERSION: typeof versionInfo;
  }
}

// Set global version
if (typeof window !== 'undefined') {
  window.APP_VERSION = versionInfo;
}
