  import { Injectable } from '@angular/core';
  import { Router } from '@angular/router';
  import { CookieService } from 'ngx-cookie-service';
  import { RouterModule } from '@angular/router';

  @Injectable({
    providedIn: 'root'
  })
  export class AuthHelperService {

    constructor(private cookieService: CookieService,private _Router: Router) { }

    getToken(): string | null {
      // const token = this.cookieService.get('token');
      const token=localStorage.getItem('token');
      return token ? token.replace(/^"|"$/g, '') : null;
    }
    getSessionToken(): string | null {
      // const session_token = this.cookieService.get('session_token');
      const session_token=localStorage.getItem('session_token');
      return session_token ? session_token.replace(/^"|"$/g, '') : null;
    }

    

    getSubdomain(): string | null {
      // const host = window.location.hostname;
      // const parts = host.split('.');
      // return parts.length >= 3 ? parts[0] : null;
      const companyInfoStr = localStorage.getItem('company_info');
      if (!companyInfoStr) return null;

      try {
        const companyInfo = JSON.parse(companyInfoStr);
        return companyInfo?.domain?.split('.')[0] || null;
        // return companyInfo?.domain || null;
      } catch (e) {
        console.error('Failed to parse company_info from localStorage', e);
        return null;
      }
    }

    isAuthenticated(): boolean {
      return !!this.getToken();
    }

    validateAuth(): boolean {
      const token = this.getToken();
      const subdomain = this.getSubdomain();

      if (!token || !subdomain) {
        return false;
      }
      return true;
    }
    
  }