import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-late-arrive',
  imports: [PageHeaderComponent, PopupComponent, FormsModule],
  templateUrl: './edit-late-arrive.component.html',
  styleUrl: './edit-late-arrive.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditLateArriveComponent {
  constructor(
    private router: Router
  ) { }

  allowPermission = false;
  linkedPolicy = false;

  onPermissionChange() {
    if (!this.allowPermission) {
      this.linkedPolicy = false;
    }
  }

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
    this.router.navigate(['/permissions']);
  }
}
