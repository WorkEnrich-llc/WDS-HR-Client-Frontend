// This file is auto-generated. Do not edit manually.
export const versionInfo = {
  "version": "0.0.102",
  "branch": "task/personnel/employee",
  "commit": "db52dd7",
  "buildDate": "2025-08-03T16:44:59.690Z",
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
