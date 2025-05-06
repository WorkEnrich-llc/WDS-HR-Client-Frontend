import { Component } from '@angular/core';
import { PopupComponent } from '../../shared/popup/popup.component';

@Component({
  selector: 'app-password-settings',
  imports: [PopupComponent],
  templateUrl: './password-settings.component.html',
  styleUrl: './password-settings.component.css'
})
export class PasswordSettingsComponent {
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
