import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment.ts';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  private apiBaseUrl: string;
  constructor(private _HttpClient: HttpClient) {
    this.apiBaseUrl = environment.apiBaseUrl;
  }


  // get permissions
  getPermissions(): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/permissions-view`;
    return this._HttpClient.get(url);
  }

  // update permissions
  updatePermission(permissionData: any): Observable<any> {
    const url = `${this.apiBaseUrl}personnel/permissions-update`;
    return this._HttpClient.put(url, permissionData);
  }
}
