import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthHelperService } from '../../authentication/auth-helper.service';
import { environment } from '../../../../../environments/environment';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BranchesService {

  private apiBaseUrl: string;
    constructor(private _HttpClient: HttpClient, private authHelper: AuthHelperService) {
      this.apiBaseUrl = environment.apiBaseUrl;
    }
  
    // create a new branch
    createBranch(branchData: any): Observable<any> {
      if (!this.authHelper.validateAuth()) {
        return throwError(() => new Error('Authentication failed'));
      }
  
      const token = this.authHelper.getToken()!;
      const subdomain = this.authHelper.getSubdomain()!;
      const url = `${this.apiBaseUrl}od/branches`;
      const headers = new HttpHeaders().set('Authorization', token).set('SUBDOMAIN', subdomain);
      return this._HttpClient.post(url, branchData, { headers });
    }




    
}
