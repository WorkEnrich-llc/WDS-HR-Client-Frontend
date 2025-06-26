import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-update-leave-types',
  imports: [PageHeaderComponent, CommonModule, PopupComponent, FormsModule],
  templateUrl: './update-leave-types.component.html',
  styleUrl: './update-leave-types.component.css'
})
export class UpdateLeaveTypesComponent {
  carryoverAllowed: boolean = false;
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router
  ) { }



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
