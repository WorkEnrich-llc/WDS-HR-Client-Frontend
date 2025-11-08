import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ILeaveBalanceFilters, ILeaveBalanceResponse, IUpdateLeaveBalance } from 'app/core/models/leave-balance';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeaveBalanceService {

  http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}personnel/employees/all-leave-balance`;

  getAllLeaveBalance(params: ILeaveBalanceFilters = {}): Observable<ILeaveBalanceResponse> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('page', String(params.page ?? 1));
    httpParams = httpParams.set('per_page', String(params.per_page ?? 10));
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return this.http.get<ILeaveBalanceResponse>(this.baseUrl, { params: httpParams });
  }

  updateLeaveBalance(data: IUpdateLeaveBalance): Observable<any> {
    const url = this.baseUrl;
    const body = {
      request_data: data
    };
    return this.http.put<any>(url, body);
  }

}


