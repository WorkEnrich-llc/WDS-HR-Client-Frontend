import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';

@Component({
  selector: 'app-manage-attendance',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule],
  templateUrl: './manage-attendance.component.html',
  styleUrl: './manage-attendance.component.css'
})
export class ManageAttendanceComponent {
  public newLogForm!: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  createDate: string = '';
  updatedDate: string = '';
  isEditMode = false;
  id?: number;



  // constructor() { }

  ngOnInit(): void {
    this.initFormModel();
    const today = new Date().toLocaleDateString('en-GB');
    this.createDate = today;
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
    this.router.navigate(['/payroll-components/all-payroll-components']);
  }


  private initFormModel(): void {
    this.newLogForm = this.fb.group({
      employee: ['', [Validators.required]],
      date: ['', [Validators.required]],
      start: ['', [Validators.required]],
      end: ['', [Validators.required]],
    });
  }

  createNewLog() {
    if (this.newLogForm.valid) {
      console.log('Creating new attendance log:', this.newLogForm.value);
    }
  }

}
