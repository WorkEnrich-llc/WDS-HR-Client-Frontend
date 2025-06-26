import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-leave-type',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule],
  providers: [DatePipe],
  templateUrl: './create-leave-type.component.html',
  styleUrl: './create-leave-type.component.css'
})
export class CreateLeaveTypeComponent {
  carryoverAllowed: boolean = false;
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService,
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }


  // next and prev
  currentStep = 1;

  goNext() {
    this.currentStep++;

  }

  goPrev() {
    this.currentStep--;
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
    this.router.navigate(['/leave-types/all-leave-types']);
  }

}
