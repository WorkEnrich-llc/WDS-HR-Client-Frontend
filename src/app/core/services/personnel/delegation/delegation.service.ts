import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface DelegationItem {
  id: number;
  delegator: {
    id: number;
    name: string;
  };
  delegate: {
    id: number;
    name: string;
  };
  from_date: string;
  to_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DelegationDetailItem extends DelegationItem {
  is_active: boolean;
}

export interface DelegationListResponse {
  details: string;
  data: {
    subscription: any;
    list_items: DelegationItem[];
    total_items: number;
    page: string;
    total_pages: number;
  };
}

export interface DelegationDetailResponse {
  details: string;
  data: {
    subscription: any;
    object_info: DelegationDetailItem;
  };
}

export interface CreateDelegationRequest {
  request_data: {
    from_date: string;
    to_date: string;
    delegator_id: number;
    delegate_id: number;
  };
}

export interface UpdateDelegationRequest {
  request_data: {
    id: number;
    from_date: string;
    to_date: string;
    delegator_id: number;
    delegate_id: number;
  };
}

export interface DelegationResponse {
  details: string;
  data: any;
}

export interface DelegationFilters {
  search?: string;
  status?: string;
  start_date?: string;
  from_date?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DelegationService {
  private apiBaseUrl: string;

  constructor(private http: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }

  // Get delegations with pagination and search
  getDelegations(page: number = 1, per_page: number = 10, search: string = '', filters: any = {}): Observable<DelegationListResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', per_page.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.append(key, value);
        }
      });
    }
    const url = `${this.apiBaseUrl}personnel/delegation`;

    return this.http.get<DelegationListResponse>(url, { params });

    // let url = `${this.apiBaseUrl}personnel/delegation?page=${page}&per_page=${per_page}`;
    // if (search) {
    //   url += `&search=${search}`;
    // }
    // return this.http.get<DelegationListResponse>(url);
  }



  // Get a single delegation by ID
  getDelegationById(id: number): Observable<DelegationDetailResponse> {
    const url = `${this.apiBaseUrl}personnel/delegation/${id}/`;
    return this.http.get<DelegationDetailResponse>(url);
  }

  // Create a new delegation
  createDelegation(requestData: CreateDelegationRequest): Observable<DelegationResponse> {
    const url = `${this.apiBaseUrl}personnel/delegation`;
    return this.http.post<DelegationResponse>(url, requestData);
  }

  // Update an existing delegation
  updateDelegation(requestData: UpdateDelegationRequest): Observable<DelegationResponse> {
    const url = `${this.apiBaseUrl}personnel/delegation`;
    return this.http.put<DelegationResponse>(url, requestData);
  }

  updateDelegationStatus(id: number, isActive: boolean): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/delegation/${id}/`;
    const body = { isActive: isActive };
    return this.http.patch(url, body);
  }

  // Delete a delegation
  deleteDelegation(id: number): Observable<DelegationResponse> {
    const url = `${this.apiBaseUrl}personnel/delegation/${id}/`;
    return this.http.delete<DelegationResponse>(url);
  }
}
