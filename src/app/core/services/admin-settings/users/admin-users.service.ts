import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ISearchParams, IUser } from 'app/core/models/users';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}main/admin-settings/users`;

  createUser(userData: IUser): Observable<IUser> {
    const data = { request_data: userData };
    return this.http.post<IUser>(this.url, data);
  }

  updateUser(userData: IUser): Observable<IUser> {
    const data = { request_data: userData };
    return this.http.put<IUser>(`${this.url}`, data);
  }


  updateUserStatus(id: number, status: any): Observable<any> {
    const url = `${this.url}/${id}/`;
    return this.http.patch(url, status);
  }


  getUserById(id: number) {
    return this.http.get<IUser>(`${this.url}/${id}`).pipe(
      map((res: any) => res.data?.object_info ?? null)
    );
  }

  getAllUsers(params: ISearchParams = {}): Observable<any> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<any>(this.url, { params: httpParams });
  }



  searchUser(email: string): Observable<any> {
    const url = `${environment.apiBaseUrl}main/admin-settings/search-users`;
    return this.http.get(url, {
      params: { q: email }
    });
  }



  resendInvitation(email: string): Observable<any> {
    const url = `${environment.apiBaseUrl}main/admin-settings/resend-invitation`;
    const formData = new FormData();
    formData.append('email', email || '');

    return this.http.put<any>(url, formData);
  }
}





