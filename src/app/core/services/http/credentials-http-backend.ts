/**
 * Global patch to ensure withCredentials is always true for all XMLHttpRequest instances
 * This is applied once at application startup to ensure cookies are sent with ALL requests
 * 
 * This is the cleanest global approach - it patches XMLHttpRequest once at startup,
 * ensuring all HTTP requests (including Angular HttpClient) automatically send cookies.
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

