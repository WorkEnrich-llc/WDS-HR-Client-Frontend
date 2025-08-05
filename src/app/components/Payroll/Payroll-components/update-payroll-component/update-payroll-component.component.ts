import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-update-payroll-component',
  imports: [PageHeaderComponent, PopupComponent],
  templateUrl: './update-payroll-component.component.html',
  styleUrl: './update-payroll-component.component.css'
})
export class UpdatePayrollComponentComponent {
  constructor(private router: Router) { }
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
    this.router.navigate(['/payroll-components/all-payroll-components']);
  }
}
