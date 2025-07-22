import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-early-leave',
  imports: [PageHeaderComponent, PopupComponent, FormsModule],
  templateUrl: './edit-early-leave.component.html',
  styleUrl: './edit-early-leave.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditEarlyLeaveComponent {
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
