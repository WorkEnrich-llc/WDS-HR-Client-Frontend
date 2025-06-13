import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header.component';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PopupComponent } from '../../components/shared/popup/popup.component';
import { CookieService } from 'ngx-cookie-service';
import { AuthenticationService } from '../../core/services/authentication/authentication.service';

@Component({
  selector: 'app-settings',
  imports: [RouterOutlet, PageHeaderComponent, RouterLink, RouterLinkActive, PopupComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent {

  constructor(private cookieService: CookieService, private _AuthenticationService: AuthenticationService, private _Router: Router) { }


  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.logout();
  }


 logout(): void {
  this._AuthenticationService.logout().subscribe({
    next: (response) => {
      const deviceToken = localStorage.getItem('device_token');

      localStorage.clear();

      if (deviceToken) {
        localStorage.setItem('device_token', deviceToken);
      }

      this.cookieService.deleteAll('/', window.location.hostname);

      // window.location.href = 'https://client.workenrich.com/auth/login';
      this._Router.navigate(['/auth/login']);
    },
    error: (err) => {
      console.error("Error:", err);
    }
  });
}


}
