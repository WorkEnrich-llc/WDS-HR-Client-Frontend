import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserStatus } from '@app/enums';
import { IPermission, IUser, IUserApi, IUserResponse } from 'app/core/models/users';
import { environment } from 'environments/environment';
import { map, Observable, tap } from 'rxjs';

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

  getAllUsers(
    pageNumber: number,
    perPage: number,
    filters?: {
      search?: string;
      name?: string;
    }
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', pageNumber)
      .set('per_page', perPage);
    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.name) params = params.set('name', filters.name);
    }
    return this.http.get<any>(this.url, { params });
  }


  searchUser(email: string): Observable<any> {
    const url = `${environment.apiBaseUrl}main/admin-settings/search-users`;
    return this.http.get(url, {
      params: { q: email }
    });
  }



}
