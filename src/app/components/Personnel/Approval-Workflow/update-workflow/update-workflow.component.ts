import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-update-workflow',
  imports: [PageHeaderComponent, PopupComponent, CommonModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './update-workflow.component.html',
  styleUrl: './update-workflow.component.css'
})
export class UpdateWorkflowComponent {
 todayFormatted: string = '';
  errMsg: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private datePipe: DatePipe,
    private toasterMessageService: ToasterMessageService,
    private fb: FormBuilder
  ) {
    const today = new Date();
    this.todayFormatted = this.datePipe.transform(today, 'dd/MM/yyyy')!;
  }
  // steps
  showErrors = false;
  steps: { form: FormGroup, name: string }[] = [];
  selectedStepIndex: number = 0;


  createStepForm(): FormGroup {
    return this.fb.group({
      stepName: ['', Validators.required],
      mandatory: [false],
      assignee: ['', Validators.required],
    });
  }

 addStep() {
  const lastStep = this.steps[this.steps.length - 1];

  if (lastStep && !lastStep.form.valid) {
    this.showErrors = true;

    Object.values(lastStep.form.controls).forEach(control => {
      control.markAsTouched();
      control.markAsDirty();
      control.updateValueAndValidity();
    });

    return;
  }

  this.showErrors = false; 

  const newStepForm = this.createStepForm();
  this.steps.push({ form: newStepForm, name: '' });
  this.selectedStepIndex = this.steps.length - 1;
}


  removeStep(index: number) {
    this.steps.splice(index, 1);
    if (this.selectedStepIndex >= this.steps.length) {
      this.selectedStepIndex = this.steps.length - 1;
    }
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
