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

    this.portionsForm.valueChanges.subscribe(() => {
      this.updateBasicPercentage();
    });

    for (let i = 0; i < 3; i++) {
      this.createPortion();
    }
    this.loadSalaryPortions();
  }



  private createPortion(p: any = null, isDefault = false): FormGroup {
    const hasValue = !!(p?.name || p?.percentage);
    const enabled = isDefault ? false : hasValue;

    const portionGroup = this.fb.group({
      enabled: new FormControl({ value: enabled, disabled: isDefault }),
      name: new FormControl({ value: p?.name || '', disabled: !enabled || isDefault }),
      percentage: new FormControl({ value: p?.percentage || '', disabled: !enabled || isDefault })
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



  get isSaveDisabled(): boolean {
    if (this.isLoading) return true;
    if (this.portionsForm.invalid) return true;
    return this.portions.controls.some(portion => {
      const enabled = portion.get('enabled')?.value;
      const name = portion.get('name')?.value;
      const percentage = portion.get('percentage')?.value;
      return enabled && (!name || !percentage);
    });
  }

  get portions(): FormArray<FormGroup> {
    return this.portionsForm.get('portions') as FormArray<FormGroup>;
  }

  updateSalaryPortion(): void {
    const formValue = this.portionsForm.getRawValue();
    const invalidPortion = this.portions.controls.some(portion => {
      const enabled = portion.get('enabled')?.value;
      const name = portion.get('name')?.value;
      const percentage = portion.get('percentage')?.value;
      return enabled && (!name || !percentage);
    });

    if (invalidPortion) {
      this.portionsForm.markAllAsTouched();
      this.toasterService.showError('Please fill in all enabled portions before saving.');
      return;
    }
    const total = this.portions.controls.reduce((sum, group) => {
      const enabled = group.get('enabled')?.value;
      if (!enabled) return sum;
      const num = Number(group.get('percentage')?.value) || 0;
      return sum + num;
    }, 0);

    if (total > 100) {
      this.toasterService.showError('The total percentages cannot be more than 100%.');
      return;
    }

    this.isLoading = true;
    this.salaryPortionService.updateSalaryPortion(formValue).subscribe({
      next: () => {
        this.toasterService.showSuccess('Salary portion updated successfully');
        this.router.navigate(['/salary-portions']);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating salary portion:', error);
        this.isLoading = false;
      }
    });
  }


  // Update the basic portion percentage in runtime
  private updateBasicPercentage(): void {
    if (!this.portions || !this.portions.length) return;
    let total = 0;
    let basicPortion: FormGroup | undefined;

    this.portions.controls.forEach(group => {
      const fGroup = group as FormGroup;
      const name = String(fGroup.get('name')?.value || '').toLowerCase();
      const enabled = fGroup.get('enabled')?.value;
      const percentage = Number(fGroup.get('percentage')?.value) || 0;

      if (name === 'basic') {
        basicPortion = fGroup;
      } else if (enabled) {
        total += percentage;
      }
    });
    if (basicPortion) {
      const newValue = 100 - total;
      basicPortion.get('percentage')?.setValue(
        newValue < 0 ? 0 : newValue,
        { emitEvent: false }
      );
    }
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
