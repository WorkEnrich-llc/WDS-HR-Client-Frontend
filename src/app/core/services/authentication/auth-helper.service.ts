import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class AuthHelperService {

  constructor(private cookieService: CookieService) { }

  getToken(): string | null {
    const token = this.cookieService.get('token');
    return token ? token : null;
  }

  getSubdomain(): string | null {
    // const host = window.location.hostname;
    // const parts = host.split('.');
    // return parts.length >= 3 ? parts[0] : null;
    const companyInfoStr = localStorage.getItem('company_info');
    if (!companyInfoStr) return null;

    try {
      const companyInfo = JSON.parse(companyInfoStr);
      return companyInfo?.domain || null;
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

    if (!token) {
      alert('You must log in first');
      window.location.href = 'https://client.workenrich.com/auth/login';
      return false;
    }

    if (!subdomain) {
      alert('Subdomain not found');
      window.location.href = 'https://client.workenrich.com/auth/login';
      return false;
    }

    return true;
  }
}