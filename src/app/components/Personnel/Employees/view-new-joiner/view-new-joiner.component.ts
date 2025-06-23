import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-view-new-joiner',
  imports: [PageHeaderComponent, CommonModule,PopupComponent],
  providers: [DatePipe],
  templateUrl: './view-new-joiner.component.html',
  styleUrl: './view-new-joiner.component.css'
})
export class ViewNewJoinerComponent {
  todayFormatted: string = '';


  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }

  employeeData = {
    id: 1,
    name: "John Smith",
    employeeStatus: "New Joiner",
    accountStatus: "active",
    // accountStatus: "inactive",
    jobTitle: "Software Engineer",
    branch: "New York",
    joinDate: "2025-6-15T00:00:00.000Z"
  }





  // popups
  isModalOpen = false;
  isSuccessModalOpen = false;

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  confirmAction() {
    this.isModalOpen = false;
    this.router.navigate(['/employees/all-employees']);
  }

  openSuccessModal() {
    this.isSuccessModalOpen = true;
  }

  closeSuccessModal() {
    this.isSuccessModalOpen = false;
  }

  viewEmployees() {
    this.closeSuccessModal();
    this.router.navigate(['/employees/all-employees']);
  }

  createAnother() {
    this.closeSuccessModal();
    // Reset form or navigate to create again
  }
}
