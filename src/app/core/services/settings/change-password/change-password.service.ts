import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChangePasswordService {

  http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}main/profile`;

  changePassword(oldPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    const body = new FormData();
    body.append('old_password', oldPassword);
    body.append('password', newPassword);
    body.append('re_password', confirmPassword);

    return this.http.post<any>(this.url, body);
  }
}
