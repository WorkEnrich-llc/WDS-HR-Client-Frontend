import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PopupComponent } from '../../components/shared/popup/popup.component';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-settings',
  imports: [RouterOutlet,PageHeaderComponent,RouterLink,RouterLinkActive,PopupComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent {

constructor(private cookieService: CookieService) {}


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
  localStorage.clear();

  this.cookieService.deleteAll('/', window.location.hostname);

   window.location.href = 'https://client.workenrich.com/auth/login';
}

}
