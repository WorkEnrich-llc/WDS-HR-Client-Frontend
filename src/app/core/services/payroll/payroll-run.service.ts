import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PayrollRunService {
  private readonly url = `${environment.apiBaseUrl}payroll/run`;
  constructor(private http: HttpClient) { }

  getAllPayrollRuns(page: number = 1, per_page: number = 10, filters?: any): Observable<any> {
    let url = `${this.url}?page=${page}&per_page=${per_page}`;
    
    // Add filter parameters if provided
    if (filters) {
      if (filters.run_cycle) {
        url += `&run_cycle=${filters.run_cycle}`;
      }
      if (filters.created_at) {
        url += `&created_at=${filters.created_at}`;
      }
    }
    
    return this.http.get(url);
  }

  getPayrollRunById(id: number | string): Observable<any> {
    return this.http.get(`${this.url}/${id}/`);
  }

  getAllSheets(page: number = 1, per_page: number = 10): Observable<any> {
    return this.http.get(`${this.url}/all-sheets?page=${page}&per_page=${per_page}`);
  }

  configurePayroll(formData: FormData): Observable<any> {
    return this.http.put(`${environment.apiBaseUrl}payroll/configure`, formData);
  }

  startPayrollRun(formData: FormData): Observable<any> {
    return this.http.post(`${this.url}`, formData);
  }

  createOffCyclePayroll(data: any): Observable<any> {
    return this.http.post(`${this.url}/off-cycle`, { request_data: data });
  }

  createPayrollSheet(formData: FormData): Observable<any> {
    return this.http.post(`${environment.apiBaseUrl}cloud/files/`, formData);
  }

  revertToDraft(formData: FormData): Observable<any> {
    return this.http.put(`${this.url}/revert-draft`, formData);
  }

  restartPayrollRun(formData: FormData): Observable<any> {
    return this.http.put(`${this.url}/restart`, formData);
  }

  publishPayrollRun(formData: FormData): Observable<any> {
    return this.http.put(`${this.url}/publish`, formData);
  }

  getViewEmployee(id: number | string, employeeId: number | string): Observable<any> {
    return this.http.get(`${this.url}/view-employee?id=${id}&employee_id=${employeeId}`);
  }
}
