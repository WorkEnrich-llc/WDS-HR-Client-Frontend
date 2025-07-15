import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CreateEmployeeRequest, CreateEmployeeResponse, EmployeesResponse } from '../../../interfaces/employee';

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
}
