/**
 * Global patch to ensure withCredentials is always true for all XMLHttpRequest instances
 * This is applied once at application startup to ensure cookies are sent with ALL requests.
 *
 * For login → dashboard (subdomain) flow: the backend must set session/CSRF cookies
 * so they are sent to the dashboard origin (e.g. Domain=.example.com). Otherwise the
 * first API call from the subdomain may get 401 and trigger a redirect back to login.
 */
export function enableCredentialsGlobally(): void {
  // Store original methods
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  // Patch open to always set withCredentials after opening
  XMLHttpRequest.prototype.open = function(
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    const result = originalOpen.call(this, method, url, async !== false, username, password);
    // Always ensure withCredentials is true
    this.withCredentials = true;
    return result;
  };
  
  // Patch send to ensure withCredentials is set before sending (as a safety net)
  XMLHttpRequest.prototype.send = function(data?: Document | XMLHttpRequestBodyInit | null) {
    // Ensure withCredentials is always true before sending
    this.withCredentials = true;
    return originalSend.call(this, data);
  };
}

