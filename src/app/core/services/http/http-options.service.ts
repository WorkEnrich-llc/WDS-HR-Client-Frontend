import { HttpHeaders, HttpParams, HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * Service to build HTTP options with withCredentials always enabled
 * This ensures cookies are sent with all HTTP requests
 */
@Injectable({
  providedIn: 'root'
})
export class HttpOptionsService {
  
  /**
   * Builds HTTP options with withCredentials always set to true
   * @param options Optional HTTP options (headers, params, context, etc.)
   * @returns HTTP options with withCredentials: true
   */
  buildOptions(options?: {
    headers?: HttpHeaders | { [header: string]: string | string[] };
    params?: HttpParams | { [param: string]: any };
    context?: HttpContext;
    observe?: 'body' | 'events' | 'response';
    reportProgress?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  }): any {
    return {
      ...options,
      withCredentials: true // Always send cookies
    };
  }
}

