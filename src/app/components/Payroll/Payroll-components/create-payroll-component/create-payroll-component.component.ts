import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-payroll-component',
  imports: [PageHeaderComponent, PopupComponent],
  templateUrl: './create-payroll-component.component.html',
  styleUrl: './create-payroll-component.component.css'
})
export class CreatePayrollComponentComponent {
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
