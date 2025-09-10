import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    let userInfo: any = null;

    try {
      const raw = localStorage.getItem('user_info');
      userInfo = raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem('user_info');
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (!userInfo) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    return true;
  }
}
