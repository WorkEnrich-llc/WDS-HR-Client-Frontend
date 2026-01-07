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

  getAllPayrollRuns(page: number = 1, per_page: number = 10): Observable<any> {
    return this.http.get(`${this.url}?page=${page}&per_page=${per_page}`);
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
}
