import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateUser } from 'app/core/models/users';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminUsersService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}main/admin-settings/users`;
  constructor() { }

  createUser(userData: CreateUser): Observable<CreateUser> {
    const data = { request_data: userData };
    return this.http.post<CreateUser>(this.url, data);
  }


}
