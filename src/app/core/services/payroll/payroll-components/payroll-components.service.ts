import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PayrollComponent } from 'app/core/models/payroll';
import { environment } from 'environments/environment';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PayrollComponentsService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}payroll/components`;


  constructor() { }


  createComponent(componentData: any): Observable<PayrollComponent> {
    const data = { request_data: componentData };
    return this.http.post<PayrollComponent>(this.url, data);
  }

  // update component
  updateComponent(componentData: PayrollComponent): Observable<PayrollComponent> {
    const data = { request_data: componentData };
    return this.http.put<PayrollComponent>(`${this.url}`, data);
  }

  // Get all payroll components
  getAllComponents(): Observable<PayrollComponent[]> {
    return this.http.get<PayrollComponent[]>(this.url);
  }

  // Get payroll component by ID 
  // getComponentById(id: number): Observable<PayrollComponent> {
  //   return this.http.get<PayrollComponent>(`${this.url}/${id}`);
  // }

  getComponentById(id: number) {
    return this.http.get<PayrollComponent>(`${this.url}/${id}`).pipe(
      map((res: any) => res.data?.object_info ?? null)
    );
  }

  getAllComponent(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
      show_in_payslip?: string;
      branch_id?: number;
      status?: string;
    }
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.updated_from) params = params.set('updated_from', filters.updated_from);
      if (filters.updated_to) params = params.set('updated_to', filters.updated_to);
      if (filters.created_from) params = params.set('created_from', filters.created_from);
      if (filters.created_to) params = params.set('created_to', filters.created_to);
      if (filters.show_in_payslip) params = params.set('show_in_payslip', filters.show_in_payslip);
      if (filters.branch_id != null) params = params.set('branch_id', filters.branch_id.toString());
    }

    return this.http.get(this.url, { params });
  }




}


