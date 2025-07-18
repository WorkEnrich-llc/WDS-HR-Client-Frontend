import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';
import { CreateEmployeeRequest, CreateEmployeeResponse, EmployeesResponse, EmployeeDetailResponse } from '../../../interfaces/employee';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private apiBaseUrl: string;

  constructor(
    private http: HttpClient
  ) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // Create a new employee
  createEmployee(requestData: CreateEmployeeRequest): Observable<CreateEmployeeResponse> {
    const url = `${this.apiBaseUrl}personnel/employees`;
    return this.http.post<CreateEmployeeResponse>(url, requestData);
  }

  // Get employees with pagination and search
  getEmployees(page: number = 1, per_page: number = 10, search: string = ''): Observable<EmployeesResponse> {
    let url = `${this.apiBaseUrl}personnel/employees?page=${page}&per_page=${per_page}`;
    if (search) {
      url += `&search=${search}`;
    }
    return this.http.get<EmployeesResponse>(url);
  }

  // Get a single employee by ID
  getEmployeeById(id: number): Observable<EmployeeDetailResponse> {
    const url = `${this.apiBaseUrl}personnel/employees/${id}/`;
    return this.http.get<EmployeeDetailResponse>(url);
  }

  // Update employee status (activate/deactivate)
  updateEmployeeStatus(id: number, status: boolean): Observable<EmployeeDetailResponse> {
    const url = `${this.apiBaseUrl}personnel/employees/${id}/`;
    const payload = { request_data: { status } };
    // Use PUT to update the employee's active status
    return this.http.put<EmployeeDetailResponse>(url, payload);
  }
  
  // Reschedule join date for an employee
  rescheduleJoinDate(id: number, start_contract: string): Observable<EmployeeDetailResponse> {
    const url = `${this.apiBaseUrl}personnel/employees-reschedule-join-date`;
    const formData = new FormData();
    formData.append('id', id.toString());
    formData.append('start_contract', start_contract);
    return this.http.put<EmployeeDetailResponse>(url, formData);
  }

  // Resend activation link to employee email
  resendActiveLink(id: number): Observable<EmployeeDetailResponse> {
    const url = `${this.apiBaseUrl}personnel/employees-resend-active-link`;
    const formData = new FormData();
    formData.append('id', id.toString());
    return this.http.put<EmployeeDetailResponse>(url, formData);
  }
  
  // Reset password for active employee
  resetPassword(id: number): Observable<EmployeeDetailResponse> {
    const url = `${this.apiBaseUrl}personnel/employees-reset-password`;
    const formData = new FormData();
    formData.append('id', id.toString());
    return this.http.put<EmployeeDetailResponse>(url, formData);
  }
}
