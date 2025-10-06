import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    const isLoggedIn = !!localStorage.getItem('user_info');
    return isLoggedIn ? this.router.createUrlTree(['/dashboard']) : true;
  }
}
