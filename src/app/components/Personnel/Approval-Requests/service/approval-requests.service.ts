import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ApprovalRequestsResponse, ApprovalRequestFilters, ApprovalRequestDetailResponse } from '../../../../core/interfaces/approval-request';

@Injectable({
  providedIn: 'root'
})
export class ApprovalRequestsService {

  private apiBaseUrl: string;

  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // get all approval requests with pagination and filters
  getAllApprovalRequests(
    pageNumber: number,
    perPage: number,
    filters?: ApprovalRequestFilters
  ): Observable<ApprovalRequestsResponse> {
    const url = `${this.apiBaseUrl}personnel/requests`;

    let params = new HttpParams()
      .set('page', pageNumber.toString())
      .set('per_page', perPage.toString());

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.employee_id) params = params.set('employee_id', filters.employee_id.toString());
      if (filters.leave_type) params = params.set('leave_type', filters.leave_type);
      if (filters.from_date) params = params.set('from_date', filters.from_date);
      if (filters.to_date) params = params.set('to_date', filters.to_date);
      if (filters.created_from) params = params.set('created_from', filters.created_from);
      if (filters.created_to) params = params.set('created_to', filters.created_to);
    }

    return this._HttpClient.get<ApprovalRequestsResponse>(url, { params });
  }

  // show approval request by ID
  /**
   * Get detailed approval request by ID
   */
  showApprovalRequest(id: number): Observable<ApprovalRequestDetailResponse> {
    const url = `${this.apiBaseUrl}personnel/requests/${id}/`;
    return this._HttpClient.get<ApprovalRequestDetailResponse>(url);
  }

  // approve request
  approveRequest(id: number, approvalData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/requests/${id}/approve`;
    return this._HttpClient.post(url, approvalData);
  }

  // reject request
  rejectRequest(id: number, rejectionData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/requests/${id}/reject`;
    return this._HttpClient.post(url, rejectionData);
  }

  // update approval request status
  updateRequestStatus(id: number, status: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/requests/${id}/`;
    return this._HttpClient.patch(url, status);
  }
}
