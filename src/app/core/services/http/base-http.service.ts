import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpContext, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Base HTTP Service that automatically includes withCredentials: true in all requests
 * 
 * Usage:
 * 1. Inject this service instead of HttpClient in your services
 * 2. Use the same methods (get, post, put, patch, delete) as HttpClient
 * 3. All requests will automatically include withCredentials: true
 * 
 * Example:
 * constructor(private http: BaseHttpService) {}
 * this.http.get(url).subscribe(...)
 */
@Injectable({
  providedIn: 'root'
})
export class BaseHttpService {
  private http = inject(HttpClient);

  /**
   * Ensures withCredentials is always included in HTTP options
   * Defaults observe to 'body' if not specified to match HttpClient default behavior
   */
  private ensureCredentials(options?: any): any {
    return {
      ...options,
      withCredentials: true, // Always send cookies
      observe: options?.observe || 'body' // Default to 'body' if not specified
    };
  }

  get<T>(url: string, options?: {
    headers?: HttpHeaders | { [header: string]: string | string[] };
    params?: HttpParams | { [param: string]: any };
    context?: HttpContext;
    observe?: 'body' | 'events' | 'response';
    reportProgress?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  }): Observable<T> {
    const opts = this.ensureCredentials(options);
    return this.http.get<T>(url, opts) as Observable<T>;
  }

  post<T>(url: string, body: any, options?: {
    headers?: HttpHeaders | { [header: string]: string | string[] };
    params?: HttpParams | { [param: string]: any };
    context?: HttpContext;
    observe?: 'body' | 'events' | 'response';
    reportProgress?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  }): Observable<T> {
    const opts = this.ensureCredentials(options);
    return this.http.post<T>(url, body, opts) as Observable<T>;
  }

  put<T>(url: string, body: any, options?: {
    headers?: HttpHeaders | { [header: string]: string | string[] };
    params?: HttpParams | { [param: string]: any };
    context?: HttpContext;
    observe?: 'body' | 'events' | 'response';
    reportProgress?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  }): Observable<T> {
    const opts = this.ensureCredentials(options);
    return this.http.put<T>(url, body, opts) as Observable<T>;
  }

  patch<T>(url: string, body: any, options?: {
    headers?: HttpHeaders | { [header: string]: string | string[] };
    params?: HttpParams | { [param: string]: any };
    context?: HttpContext;
    observe?: 'body' | 'events' | 'response';
    reportProgress?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  }): Observable<T> {
    const opts = this.ensureCredentials(options);
    return this.http.patch<T>(url, body, opts) as Observable<T>;
  }

  delete<T>(url: string, options?: {
    headers?: HttpHeaders | { [header: string]: string | string[] };
    params?: HttpParams | { [param: string]: any };
    context?: HttpContext;
    observe?: 'body' | 'events' | 'response';
    reportProgress?: boolean;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  }): Observable<T> {
    const opts = this.ensureCredentials(options);
    return this.http.delete<T>(url, opts) as Observable<T>;
  }
}

