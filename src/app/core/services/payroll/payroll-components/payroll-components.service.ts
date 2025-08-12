import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { PayrollComponent } from 'app/core/models/payroll';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PayrollComponentsService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}payroll/components`;


  constructor() { }


  createComponent(componentData: PayrollComponent): Observable<PayrollComponent> {
    const data = { request_data: componentData };
    return this.http.post<PayrollComponent>(this.url, data);
  }

  // update component
  updateComponent(id: number, componentData: PayrollComponent): Observable<PayrollComponent> {
    const data = { request_data: componentData };
    return this.http.patch<PayrollComponent>(`${this.url}/${id}`, data);
  }

  // Get all payroll components
  getComponents(): Observable<PayrollComponent[]> {
    return this.http.get<PayrollComponent[]>(this.url);
  }

  // Get payroll component by ID 
  getComponentById(id: number): Observable<PayrollComponent> {
    return this.http.get<PayrollComponent>(`${this.url}/${id}`);
  }

}


