import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';

@Component({
  selector: 'app-department-checklist',
  imports: [PageHeaderComponent,RouterLink,PopupComponent],
  templateUrl: './department-checklist.component.html',
  styleUrl: './department-checklist.component.css',
  encapsulation:ViewEncapsulation.None
})
export class DepartmentChecklistComponent {
checks = [
  { name: 'Verify department goals are documented' },
  { name: 'Ensure team members are assigned tasks' },
  { name: 'Confirm budget allocation is approved' },
  { name: 'Review department KPIs' },
  { name: 'Schedule weekly progress meeting' }
];




  deactivateOpen = false;
  activateOpen = false;
  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  confirmDeactivate() {
    this.deactivateOpen = false;

    const deptStatus = {
      request_data: {
        status: false
      }
    };


  }

  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }
  confirmActivate() {
    this.activateOpen = false;
    const deptStatus = {
      request_data: {
        status: true
      }
    };


  }
}
