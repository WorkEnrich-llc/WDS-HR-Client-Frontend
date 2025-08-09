import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-view-payroll-component',
  imports: [PageHeaderComponent, PopupComponent, RouterLink],
  templateUrl: './view-payroll-component.component.html',
  styleUrl: './view-payroll-component.component.css'
})
export class ViewPayrollComponentComponent {

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
