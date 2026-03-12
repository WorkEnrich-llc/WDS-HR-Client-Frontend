/**
 * Global patch to ensure withCredentials is true for own-origin requests only.
 * Third-party domains (Google Maps, Firebase, CDNs, etc.) do NOT support
 * Access-Control-Allow-Credentials, so they must be excluded to avoid CORS errors.
 *
 * For login → dashboard (subdomain) flow: the backend must set session/CSRF cookies
 * so they are sent to the dashboard origin (e.g. Domain=.example.com). Otherwise the
 * first API call from the subdomain may get 401 and trigger a redirect back to login.
 */

/** Domains that must NOT receive withCredentials=true */
const THIRD_PARTY_DOMAINS = [
  'googleapis.com',
  'google.com',
  'firebase.google.com',
  'firebaseio.com',
  'firebaseapp.com',
  'gstatic.com',
  'cdnjs.cloudflare.com',
  'cloudflare.com',
];

function isThirdParty(url: string | URL): boolean {
  try {
    const hostname = new URL(url.toString(), window.location.href).hostname;
    return THIRD_PARTY_DOMAINS.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
}

export function enableCredentialsGlobally(): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  // Track the URL on each XHR instance so send() can check it
  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    const result = originalOpen.call(this, method, url, async !== false, username, password);
    if (!isThirdParty(url)) {
      this.withCredentials = true;
    }
    return result;
  };

  XMLHttpRequest.prototype.send = function (data?: Document | XMLHttpRequestBodyInit | null) {
    // withCredentials was already set correctly in open(); no override needed here.
    return originalSend.call(this, data);
  };
}


