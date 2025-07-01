import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-update-restricted-days',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './update-restricted-days.component.html',
  styleUrl: './update-restricted-days.component.css'
})
export class UpdateRestrictedDaysComponent {
  todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private toasterMessageService: ToasterMessageService,
    private fb: FormBuilder
  ) {
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
    this.router.navigate(['/restricted-days/all-restricted-days']);
  }
}
