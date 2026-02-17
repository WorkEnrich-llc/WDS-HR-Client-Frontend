import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private router: Router) { }

  canActivate(): boolean | UrlTree {
    let userInfo: any = null;

    try {
      const raw = localStorage.getItem('user_info');
      userInfo = raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem('user_info');
      return this.router.createUrlTree(['/auth/login']);
    }

    if (userInfo) return true;
    return this.router.createUrlTree(['/auth/login']);
  }
}
