import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaxesService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}payroll/taxes`;

  /**
   * Get all taxes (with pagination support)
   */
  getAll(
    pageNumber?: number,
    perPage?: number,
    filters?: {
      search?: string;
      status?: string;
      created_from?: string;
      created_to?: string;
    }
  ): Observable<any> {
    let params = new HttpParams();
    
    if (pageNumber) params = params.set('page', pageNumber);
    if (perPage) params = params.set('per_page', perPage);
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.created_from) params = params.set('created_from', filters.created_from);
      if (filters.created_to) params = params.set('created_to', filters.created_to);
    }

    return this.http.get<any>(`${this.url}`, { params }).pipe(
      map((res: any) => res.data ?? null)
    );
  }

  /**
   * Get a single tax by ID
   */
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`).pipe(
      map((res: any) => res.data?.object_info ?? res.data ?? null)
    );
  }

  /**
   * Create a new tax
   */
  create(data: any): Observable<any> {
    const requestData = {
      request_data: data
    };
    return this.http.post<any>(`${this.url}`, requestData);
  }

  /**
   * Update an existing tax
   */
  update(id: number, data: any): Observable<any> {
    // Include id in request_data and use PUT without id in URL
    const requestData = {
      request_data: {
        id: id,
        ...data
      }
    };
    return this.http.put<any>(`${this.url}`, requestData);
  }

  /**
   * Delete a tax
   */
  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.url}/${id}`);
  }

  /**
   * Update tax status (activate/deactivate)
   */
  updateStatus(id: number, status: boolean): Observable<any> {
    const requestData = {
      request_data: {
        status: status
      }
    };
    return this.http.patch<any>(`${this.url}/${id}/status`, requestData);
  }

}
