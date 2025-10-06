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

  isLoading: boolean = false;
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.logout();
  }


  logout(): void {
    this.isLoading = true;

    const deviceToken = localStorage.getItem('device_token');
    localStorage.clear();
    if (deviceToken) {
      localStorage.setItem('device_token', deviceToken);
    }

    this.cookieService.deleteAll('/', window.location.hostname);

    this._Router.navigate(['/auth/login']);

    this._AuthenticationService.logout().subscribe({
      next: () => {
        // console.log('Logout request completed successfully');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Logout request failed:', err);
        this.isLoading = false;
      }
    });


  }



}
