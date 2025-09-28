import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivateAccountService {

  http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  checkInvitation(payload: {
    tkn: string | null;
    ref: string | null;
    mode: string | null;
    ts: string | null;
    code: string | null;
  }): Observable<any> {
    const url = `${this.baseUrl}main/authentication/check-invitation`;
    const formData = new FormData();
    if (payload.tkn) formData.append('tkn', payload.tkn);
    if (payload.ref) formData.append('ref', payload.ref);
    if (payload.mode) formData.append('mode', payload.mode);
    if (payload.ts) formData.append('ts', payload.ts);
    if (payload.code) formData.append('code', payload.code);

    return this.http.put<any>(url, formData);
  }



  resetPassword(payload: {
    username: string;
    password: string;
    rePassword: string;
    verificationCode: string;
    // securityKey: string;
  }): Observable<any> {
    const url = `${this.baseUrl}main/authentication/forgot-password/new-password`;

    const body = {
      username: payload.username,
      password: payload.password,
      re_password: payload.rePassword,
      verification_code: payload.verificationCode
    };

    return this.http.post<any>(url, body);
  }
}
