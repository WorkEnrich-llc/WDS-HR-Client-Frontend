import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { atLeastOnePortionFilled, nonWhitespaceValidator, totalPercentageValidator } from './validator';
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
  attemptedSubmit = false;

  constructor(
    private router: Router,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.portionsForm = this.fb.group({
      portions: this.fb.array([], [atLeastOnePortionFilled, totalPercentageValidator()])
    });

    this.loadSalaryPortions();
  }



  private createPortion(p: any = null, isDefault = false): FormGroup {
    const hasValue = !!(p?.name || p?.percentage);
    const enabled = isDefault ? true : hasValue;
    const initialName = typeof p?.name === 'string' ? p.name.trim() : (p?.name || '');
    const initialPercentage = p?.percentage ?? '';

    const portionGroup = this.fb.group({
      // For default (basic) row, checkbox stays enabled so user can toggle it visually
      enabled: new FormControl({ value: enabled, disabled: false }),
      name: new FormControl(
        { value: initialName, disabled: !enabled || false },
        [Validators.required, nonWhitespaceValidator]
      ),
      // For default/basic row, percentage is always disabled; for others it follows "enabled"
      percentage: new FormControl(
        { value: initialPercentage, disabled: isDefault ? true : !enabled },
        [Validators.required]
      )
    });

    if (isDefault) {
      // For the basic portion:
      // - checkbox can be toggled, but it doesn't affect enable/disable logic
      // - name input is always enabled
      // - percentage input is always disabled
      portionGroup.get('name')?.enable({ emitEvent: false });
      portionGroup.get('percentage')?.disable({ emitEvent: false });
      // No subscription on "enabled" – we treat it as a visual toggle only
    } else {
      // For other portions: toggle both name and percentage based on the checkbox
      portionGroup.get('enabled')?.valueChanges.subscribe(enabledValue => {
        if (enabledValue) {
          const currentName = portionGroup.get('name')?.value;
          portionGroup.get('name')?.enable();
          portionGroup.get('percentage')?.enable();
          if (typeof currentName === 'string') {
            portionGroup.get('name')?.setValue(currentName.trim());
          }
        } else {
          portionGroup.get('name')?.disable();
          portionGroup.get('percentage')?.disable();
          portionGroup.get('name')?.reset('');
          portionGroup.get('percentage')?.reset('');
        }
        portionGroup.get('name')?.updateValueAndValidity({ emitEvent: false });
        portionGroup.get('percentage')?.updateValueAndValidity({ emitEvent: false });
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
          // Filter out 'gross' and separate basic from others
          const filteredPortions = this.salaryPortions.filter((p: any) => {
            const name = typeof p.name === 'string' ? p.name.toLowerCase().trim() : '';
            return name !== 'gross';
          });

          const basicPortion = filteredPortions.find((p: any) => {
            const name = typeof p.name === 'string' ? p.name.toLowerCase().trim() : '';
            return name === 'basic';
          });

          const otherPortions = filteredPortions.filter((p: any) => {
            const name = typeof p.name === 'string' ? p.name.toLowerCase().trim() : '';
            return name !== 'basic';
          });

          const returnedFormArray: FormGroup[] = [];

          // Always add basic first (default/basic portion with locked percentage)
          if (basicPortion) {
            returnedFormArray.push(this.createPortion(basicPortion, true));
          } else {
            returnedFormArray.push(this.createPortion({ name: 'basic', percentage: 100 }, true));
          }

          // Add other portions (max 2)
          otherPortions.slice(0, 2).forEach((p: any) => {
            returnedFormArray.push(this.createPortion(p, p.default));
          });

          // Fill remaining slots to have exactly 2 open inputs (plus basic = 3 total)
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
          // Default case for first time: basic + 2 open inputs
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
        // Default case: basic + 2 open inputs
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



  get portions(): FormArray<FormGroup> {
    return this.portionsForm.get('portions') as FormArray<FormGroup>;
  }

  updateSalaryPortion(): void {
    this.attemptedSubmit = true;
    const formValue = this.portionsForm.getRawValue();
    const invalidPortion = this.hasInvalidEnabledPortion();

    if (invalidPortion) {
      this.portionsForm.markAllAsTouched();
      return;
    }
    const total = this.portions.controls.reduce((sum, group) => {
      const enabled = group.get('enabled')?.value;
      if (!enabled) return sum;
      const num = Number(group.get('percentage')?.value) || 0;
      return sum + num;
    }, 0);

    if (total >= 100) {
      this.portionsForm.markAllAsTouched();
      return;
    }

    const cleanedValue = {
      ...formValue,
      portions: formValue.portions
        .filter((portion: any) => {
          // Filter out gross and empty portions
          const name = typeof portion.name === 'string' ? portion.name.toLowerCase().trim() : '';
          return name !== 'gross' && (portion.enabled || name === 'basic');
        })
        .map((portion: any) => ({
          ...portion,
          name: typeof portion.name === 'string' ? portion.name.trim() : portion.name
        }))
    };

    this.isLoading = true;
    this.salaryPortionService.updateSalaryPortion(cleanedValue).subscribe({
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

  private hasInvalidEnabledPortion(): boolean {
    return this.portions.controls.some(portion => {
      const enabled = portion.get('enabled')?.value;
      if (!enabled) return false;
      const nameControl = portion.get('name');
      const percentageControl = portion.get('percentage');
      return (nameControl?.invalid ?? false) || (percentageControl?.invalid ?? false);
    });
  }

  showControlError(index: number, controlName: 'name' | 'percentage'): boolean {
    const portion = this.portions.at(index) as FormGroup;
    const control = portion.get(controlName);
    if (!control || control.disabled) {
      return false;
    }
    return control.invalid && (control.touched || this.attemptedSubmit);
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
