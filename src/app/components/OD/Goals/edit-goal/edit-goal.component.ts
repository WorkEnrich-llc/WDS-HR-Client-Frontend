import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';

@Component({
  selector: 'app-edit-goal',
  imports: [PageHeaderComponent,CommonModule,PopupComponent],
  templateUrl: './edit-goal.component.html',
  styleUrl: './edit-goal.component.css'
})
export class EditGoalComponent {
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
  ) {


  }

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
    this.router.navigate(['/goals']);
  }
}
