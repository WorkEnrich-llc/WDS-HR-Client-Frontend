import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.ts';
import { ApprovalRequestsResponse, ApprovalRequestFilters } from '../../../interfaces/approval-request';

@Injectable({
  providedIn: 'root'
})
export class ApprovalRequestsService {
  private apiBaseUrl: string;

  constructor(private http: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // Get approval requests with pagination and filters
  getApprovalRequests(
    page: number = 1,
    per_page: number = 10,
    filters: ApprovalRequestFilters = {}
  ): Observable<ApprovalRequestsResponse> {
    let url = `${this.apiBaseUrl}personnel/requests?page=${page}&per_page=${per_page}`;

    // Add filters to the URL
    if (filters.search) {
      url += `&search=${filters.search}`;
    }
    if (filters.status) {
      url += `&status=${filters.status}`;
    }
    if (filters.employee_id) {
      url += `&employee_id=${filters.employee_id}`;
    }
    if (filters.leave_type) {
      url += `&leave_type=${filters.leave_type}`;
    }
    if (filters.from_date) {
      url += `&from_date=${filters.from_date}`;
    }
    if (filters.to_date) {
      url += `&to_date=${filters.to_date}`;
    }
    if (filters.created_from) {
      url += `&created_from=${filters.created_from}`;
    }
    if (filters.created_to) {
      url += `&created_to=${filters.created_to}`;
    }

    return this.http.get<ApprovalRequestsResponse>(url);
  }

  // Get approval requests for a specific employee
  getEmployeeRequests(
    employeeId: number,
    page: number = 1,
    per_page: number = 10,
    search: string = ''
  ): Observable<ApprovalRequestsResponse> {
    const filters: ApprovalRequestFilters = {
      employee_id: employeeId,
      search: search
    };

    return this.getApprovalRequests(page, per_page, filters);
  }
}
