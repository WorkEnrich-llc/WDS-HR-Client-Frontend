import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { atLeastOnePortionFilled, totalPercentageValidator } from './validator';

@Component({
  selector: 'app-edit-salary-portions',
  imports: [PageHeaderComponent, CommonModule, ReactiveFormsModule, PopupComponent],
  templateUrl: './edit-salary-portions.component.html',
  styleUrls: ['./edit-salary-portions.component.css']
})
export class EditSalaryPortionsComponent implements OnInit {
  portionsForm!: FormGroup;
  isLoading = false;
  private salaryPortionService = inject(SalaryPortionsService);
  private toasterService = inject(ToasterMessageService);
  constructor(
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.portionsForm = this.fb.group({
      portions: this.fb.array([], [atLeastOnePortionFilled, totalPercentageValidator])
    });

    for (let i = 0; i < 3; i++) {
      this.addPortion();
    }

  }

  get portions(): FormArray {
    return this.portionsForm.get('portions') as FormArray;
  }

  addPortion(): void {
    const portionGroup = this.fb.group({
      enabled: new FormControl(false),
      portion: new FormControl({ value: '', disabled: true }),
      percentage: new FormControl({ value: '', disabled: true })
    });


    portionGroup.get('enabled')?.valueChanges.subscribe(enabled => {
      if (enabled) {
        portionGroup.get('portion')?.enable();
        portionGroup.get('percentage')?.enable();
      } else {
        portionGroup.get('portion')?.disable();
        portionGroup.get('percentage')?.disable();
      }
    });

    this.portions.push(portionGroup);
  }




  updateSalaryPortion(): void {
    if (this.portionsForm.invalid) {
      this.portionsForm.markAllAsTouched();
      if (this.portionsForm.hasError('totalIs100')) {
        this.toasterService.showError('The total percentages cannot be 100%.');
      }
      return;
    }
    const formValue = this.portionsForm.getRawValue();
    this.salaryPortionService.updateSalaryPortion(formValue).subscribe({
      next: (response) => {
        console.log('Salary portion updated successfully:', response);
        this.toasterService.showSuccess('Salary portion updated successfully');
        this.router.navigate(['/salary-portions']);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating salary portion:', error);
      }
    });
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
    this.router.navigate(['/salary-portions']);
  }
}
