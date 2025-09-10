import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from './../../../../../environments/environment';
import { CreateEmployeeRequest, CreateEmployeeResponse, EmployeesResponse, EmployeeDetailResponse } from '../../../interfaces/employee';
import { ContractsResponse, ContractAdjustmentsResponse } from '../../../interfaces/contract';

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
    return this.http.patch<EmployeeDetailResponse>(url, payload);
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
    const url = `${this.apiBaseUrl}personnel/employees-re-password`;
    const formData = new FormData();
    formData.append('id', id.toString());
    return this.http.put<EmployeeDetailResponse>(url, formData);
  }
  
  // Update an existing employee record
  updateEmployee(requestData: any): Observable<CreateEmployeeResponse> {
    const url = `${this.apiBaseUrl}personnel/employees`;
    return this.http.put<CreateEmployeeResponse>(url, requestData);
  }

  // Upload employee document
  uploadEmployeeDocument(employeeId: number, fileName: string, file: File): Observable<HttpEvent<any>> {
    const url = `${this.apiBaseUrl}personnel/employees-documents`;
    const formData = new FormData();
    formData.append('employee_id', employeeId.toString());
    formData.append('file_name', fileName);
    formData.append('file', file);
    return this.http.post<any>(url, formData, { reportProgress: true, observe: 'events' });
  }
  
  // Get existing employee documents
  getEmployeeDocuments(employeeId: number): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/employees-documents/${employeeId}/`;
    return this.http.get<any>(url);
  }

  // Get attendance log for a specific date and employee
  getAttendanceLog(date: string, employeeId: number): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/attendance-log?date=${date}&employee=${employeeId}`;
    return this.http.get<any>(url);
  }

  // Delete an uploaded employee document
  deleteEmployeeDocument(documentId: number, employeeId: number): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/employees-documents/${documentId}/`;
    const formData = new FormData();
    formData.append('employee_id', employeeId.toString());
    // Send employee_id in body as form-data
    return this.http.delete<any>(url, { body: formData });
  }

  // Get employee contracts
  getEmployeeContracts(employeeId: number): Observable<ContractsResponse> {
    const url = `${this.apiBaseUrl}personnel/employees-contracts/${employeeId}/`;
    return this.http.get<ContractsResponse>(url);
  }

  // Create new employee contract
  createEmployeeContract(requestData: {
    employee_id: number;
    contract_type: number;
    start_contract: string;
    end_contract: string;
    salary: number;
    insurance_salary: number;
  }): Observable<ContractsResponse> {
    const url = `${this.apiBaseUrl}personnel/employees-contracts`;
    return this.http.post<ContractsResponse>(url, { request_data: requestData });
  }

  // Cancel employee contract
  cancelEmployeeContract(contractId: number): Observable<ContractsResponse> {
    const url = `${this.apiBaseUrl}personnel/employees-contracts/${contractId}/`;
    return this.http.patch<ContractsResponse>(url, {});
  }
  
  // Adjust employee contract (appraisal, correction, raise)
  adjustEmployeeContractAdjustment(requestData: { contract_id: number; adjustment_type: number; new_salary: number; start_date: string; }): Observable<ContractAdjustmentsResponse> {
    const url = `${this.apiBaseUrl}personnel/employees-contracts-adjustments`;
    return this.http.post<ContractAdjustmentsResponse>(url, { request_data: requestData });
  }
  
  // Get contract adjustments history for a specific contract
  getEmployeeContractAdjustments(contractId: number): Observable<ContractAdjustmentsResponse> {
    const url = `${this.apiBaseUrl}personnel/employees-contracts-adjustments/${contractId}/`;
    return this.http.get<ContractAdjustmentsResponse>(url);
  }
}
