import { Component, ViewEncapsulation } from '@angular/core';
import { PopupComponent } from '../../shared/popup/popup.component';

@Component({
  selector: 'app-profile-settings',
  imports: [PopupComponent],
  templateUrl: './profile-settings.component.html',
  styleUrl: './profile-settings.component.css',
})
export class ProfileSettingsComponent {
  // discard popup
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    // logic to deactivate
  }
}
