import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { atLeastOnePortionFilled, totalPercentageValidator } from './validator';
import { SalaryPortion } from 'app/core/models/salary-portions';

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
  salaryPortions: SalaryPortion[] = [];
  salaryPortion?: SalaryPortion;

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.portionsForm = this.fb.group({
      portions: this.fb.array([], [atLeastOnePortionFilled, totalPercentageValidator()])
    });

    for (let i = 0; i < 3; i++) {
      this.createPortion();
    }
    this.loadSalaryPortions();
  }

  get portions(): FormArray {
    return this.portionsForm.get('portions') as FormArray;
  }


  private createPortion(p: any = null, isDefault = false): FormGroup {
    const hasValue = !!(p?.name || p?.percentage);
    const portionGroup = this.fb.group({
      enabled: new FormControl({ value: isDefault ? false : hasValue, disabled: isDefault }),
      name: new FormControl({ value: p?.name || '', disabled: isDefault }),
      percentage: new FormControl({ value: p?.percentage || '', disabled: isDefault })
    });
    if (!isDefault) {
      portionGroup.get('enabled')?.valueChanges.subscribe(enabled => {
        if (enabled) {
          portionGroup.get('name')?.enable();
          portionGroup.get('percentage')?.enable();
        } else {
          portionGroup.get('name')?.disable();
          portionGroup.get('percentage')?.disable();
        }
      });
    }
    return portionGroup;
  }


  private loadSalaryPortions(): void {
    this.salaryPortionService.single().subscribe({
      next: (data) => {
        this.salaryPortion = data;
        this.salaryPortions = data.settings || [];
        this.portions.clear();

        if (this.salaryPortions.length > 0) {
          const returnedFormArray = this.salaryPortions.map((p: any) =>
            this.createPortion(p, p.default)
          );

          // If returned data less than 3 inputs, add empty inputs
          while (returnedFormArray.length < 3) {
            returnedFormArray.push(this.createPortion());
          }

          this.portionsForm.setControl(
            'portions',
            this.fb.array(
              returnedFormArray,
              [atLeastOnePortionFilled, totalPercentageValidator()]
            )
          );
        } else {
          // Default case for first time
          this.portionsForm.setControl(
            'portions',
            this.fb.array(
              [
                this.createPortion({ name: 'basic', percentage: 100 }, true),
                this.createPortion(),
                this.createPortion()
              ],
              [atLeastOnePortionFilled, totalPercentageValidator()]
            )
          );
        }
      },
      error: (err) => {
        console.error('Failed to load single salary portion', err);
        this.portionsForm.setControl(
          'portions',
          this.fb.array(
            [
              this.createPortion({ name: 'basic', percentage: 100 }, true),
              this.createPortion(),
              this.createPortion()
            ],
            [atLeastOnePortionFilled, totalPercentageValidator()]
          )
        );
      }
    });
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
