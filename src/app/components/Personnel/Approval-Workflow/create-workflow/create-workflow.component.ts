import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-create-workflow',
  imports: [PageHeaderComponent,PopupComponent],
  providers:[DatePipe],
  templateUrl: './create-workflow.component.html',
  styleUrl: './create-workflow.component.css'
})
export class CreateWorkflowComponent {
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
    this.router.navigate(['/workflow/all-workflows']);
  }
}
