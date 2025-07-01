import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { RouterLink } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-view-restricted-days',
  imports: [PageHeaderComponent,RouterLink,PopupComponent],
  templateUrl: './view-restricted-days.component.html',
  styleUrl: './view-restricted-days.component.css'
})
export class ViewRestrictedDaysComponent {

  // activate and deactivate

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

    // this._DepartmentsService.updateDeptStatus(this.departmentData.id, deptStatus).subscribe({
    //   next: (response) => {
    //     this.departmentData = response.data.object_info;
    //     // console.log(this.departmentData);

    //     this.sortDirection = 'desc';
    //     this.sortBy('id');
    //   },
    //   error: (err) => {
    //     console.log(err.error?.details);
    //   }
    // });
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

    // this._DepartmentsService.updateDeptStatus(this.departmentData.id, deptStatus).subscribe({
    //   next: (response) => {
    //     this.departmentData = response.data.object_info;
    //     // console.log(this.departmentData);

    //     this.sortDirection = 'desc';
    //     this.sortBy('id');
    //   },
    //   error: (err) => {
    //     console.log(err.error?.details);
    //   }
    // });
  }
}
