import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateEmployeeRequest, CreateEmployeeResponse, EmployeesResponse, EmployeeDetailResponse } from '../../../interfaces/employee';
import { ContractsResponse, ContractAdjustmentsResponse, ContractResignationResponse, EmployeeLeaveBalance, EmployeeLeaveBalanceResponse } from '../../../interfaces/contract';
import { environment } from 'environments/environment';

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

  // Get all employees without pagination using it in manage-attendance and users for dropdown 
  getAllEmployees(): Observable<EmployeesResponse> {
    const url = `${this.apiBaseUrl}personnel/employees`;
    return this.http.get<EmployeesResponse>(url);
  }

  // Get employees with pagination and search
  // getEmployees(page: number = 1, per_page: number = 10, search: string = ''): Observable<EmployeesResponse> {
  //   let url = `${this.apiBaseUrl}personnel/employees?page=${page}&per_page=${per_page}`;
  //   if (search) {
  //     url += `&search=${search}`;
  //   }
  //   return this.http.get<EmployeesResponse>(url);
  // }
  getEmployees(page: number = 1, per_page: number = 10, search: string = '', filters: any = {}, end_contract_sort?: string): Observable<EmployeesResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', per_page.toString());
    if (search) {
      params = params.append('search', search);
    }
    if (end_contract_sort) {
      params = params.append('end_contract_sort', end_contract_sort);
    }
    for (const key in filters) {
      const value = filters[key];
      if (value) {
        params = params.append(key, value);
      }
    }
    const url = `${this.apiBaseUrl}personnel/employees`;
    return this.http.get<EmployeesResponse>(url, { params });
  }

  // Get employees in add roles 
  getEmployeesForAddRoles(page: number = 1, per_page: number = 10, search: string = '',): Observable<EmployeesResponse> {
    let url = `${this.apiBaseUrl}personnel/employees?page=${page}&per_page=${per_page}&in_user_roles=true`;
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

  clearEmployeeSession(deviceId: number, employeeId: number): Observable<EmployeeDetailResponse> {
    const url = `${this.apiBaseUrl}personnel/employees/devices`;

    const formData = new FormData();
    formData.append('device_id', deviceId.toString());
    formData.append('employee_id', employeeId.toString());

    return this.http.patch<EmployeeDetailResponse>(url, formData);
  }

  getEmployeeDevices(employeeId: number, page: number = 1, perPage: number = 10): Observable<any> {
    let params = new HttpParams().set('employee_id', employeeId.toString());
    params = params.set('page', page.toString()).set('per_page', perPage.toString());
    const url = `${this.apiBaseUrl}personnel/employees/devices`;
    return this.http.get<any>(url, { params });
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
    notice_period: number;
  }): Observable<ContractsResponse> {
    const url = `${this.apiBaseUrl}personnel/contract/create`;
    return this.http.post<ContractsResponse>(url, { request_data: requestData });
  }

  // Cancel employee contract
  // cancelEmployeeContract(contractId: number): Observable<ContractsResponse> {
  //   const url = `${this.apiBaseUrl}personnel/employees-contracts/${contractId}/`;
  //   return this.http.patch<ContractsResponse>(url, {});
  // }

  // Adjust employee contract (appraisal, correction, raise)
  // adjustEmployeeContractAdjustment(requestData: { contract_id: number; adjustment_type: number; new_salary: number; start_contract: string; end_contract: string; notice_period: string; }): Observable<ContractAdjustmentsResponse> {
  //   const url = `${this.apiBaseUrl}personnel/contract/update`;
  //   return this.http.put<ContractAdjustmentsResponse>(url, { request_data: requestData });
  // }

  adjustEmployeeContractAdjustment(requestData: {
    contract_id: number;
    adjustment_type: number;
    salary: number;
    start_contract: string;
    end_contract: string;
    notice_period: string;
  }): Observable<ContractAdjustmentsResponse> {
    const url = `${this.apiBaseUrl}personnel/contract/update`;

    const formData = new FormData();

    formData.append('contract_id', requestData.contract_id.toString());
    formData.append('adjustment_type', requestData.adjustment_type.toString());
    formData.append('salary', requestData.salary.toString());
    formData.append('start_contract', requestData.start_contract);
    formData.append('end_contract', requestData.end_contract);
    formData.append('notice_period', requestData.notice_period);

    return this.http.put<ContractAdjustmentsResponse>(url, formData);
  }

  // Resign employee contract
  resignEmployeeContract(requestData: {
    contract_id: number;
    last_date: string;
    resign_date: string;
    reason: string;
  }): Observable<ContractResignationResponse> {
    const url = `${this.apiBaseUrl}personnel/contract/resign`;

    const formData = new FormData();

    formData.append('contract_id', requestData.contract_id.toString());
    formData.append('last_date', requestData.last_date.toString());
    formData.append('resign_date', requestData.resign_date.toString());
    formData.append('reason', requestData.reason);
    return this.http.put<ContractResignationResponse>(url, formData);
  }

  // getEmployeeLeaveBalance(status: boolean, employeeId: number): Observable<EmployeeLeaveBalanceResponse> {
  //   const url = `${this.apiBaseUrl}/personnel/employees/leave-balance`;
  //   let params = new HttpParams();
  //   params = params.append('status', status.toString());
  //   params = params.append('employee_id', employeeId.toString());
  //   return this.http.get<EmployeeLeaveBalanceResponse>(url, { params: params });
  // }

  // Get employee leave balance
  getEmployeeLeaveBalance(employeeId: number, page?: number, perPage?: number): Observable<EmployeeLeaveBalanceResponse> {
    const url = `${this.apiBaseUrl}personnel/employees/leave-balance?`;
    let params = new HttpParams();
    params = params.append('employee_id', employeeId.toString());
    if (page) {
      params = params.append('page', page.toString());
    }
    if (perPage) {
      params = params.append('per_page', perPage.toString());
    }
    return this.http.get<EmployeeLeaveBalanceResponse>(url, { params: params });
  }

  // Update employee leave balance
  updateEmployeeLeaveBalance(employeeId: number, leaveId: number, total: number): Observable<EmployeeLeaveBalanceResponse> {
    const url = `${this.apiBaseUrl}personnel/employees/leave-balance`;
    const body = {
      request_data: {
        employee_id: employeeId,
        leave_id: leaveId,
        total: total
      }
    };
    return this.http.put<EmployeeLeaveBalanceResponse>(url, body);
  }


  // Terminate employee contract
  terminateEmployeeContract(requestData: {
    contract_id: number;
    last_date: string;
    reason: string;
  }): Observable<ContractsResponse> {
    const url = `${this.apiBaseUrl}personnel/contract/terminate`;
    const formData = new FormData();
    formData.append('contract_id', requestData.contract_id.toString());
    formData.append('last_date', requestData.last_date);
    formData.append('reason', requestData.reason);

    return this.http.put<ContractsResponse>(url, formData);
  }

  // Cancel employee contract
  cancelEmployeeContract(requestData: {
    contract_id: number;
  }): Observable<ContractsResponse> {
    const url = `${this.apiBaseUrl}personnel/contract/cancel`;
    const formData = new FormData();
    formData.append('contract_id', requestData.contract_id.toString());
    return this.http.put<ContractsResponse>(url, formData);
  }

  // Get contract adjustments history for a specific contract
  getEmployeeContractAdjustments(contractId: number): Observable<ContractAdjustmentsResponse> {
    const url = `${this.apiBaseUrl}personnel/contract/history?contract_id=${contractId}`;
    console.log(url);
    return this.http.get<ContractAdjustmentsResponse>(url);
  }

}
