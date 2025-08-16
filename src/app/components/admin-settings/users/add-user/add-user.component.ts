import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-add-user',
  imports: [PageHeaderComponent,PopupComponent],
  providers: [DatePipe],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css'
})
export class AddUserComponent {
todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private datePipe: DatePipe,
    private router: Router
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
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
    this.router.navigate(['/users']);
  }
}
