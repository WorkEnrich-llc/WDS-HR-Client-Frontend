import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { atLeastOnePortionFilled, customTotalValidator, nonWhitespaceValidator } from './validator';
import { SalaryPortion } from 'app/core/models/salary-portions';

@Component({
  selector: 'app-edit-salary-portions',
  imports: [PageHeaderComponent, ReactiveFormsModule, PopupComponent, DatePipe],
  providers: [DatePipe],
  templateUrl: './edit-salary-portions.component.html',
  styleUrls: ['./edit-salary-portions.component.css']
})
export class EditSalaryPortionsComponent implements OnInit {
  portionsForm!: FormGroup;
  isLoading = true;
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
      isFlexible: [false],
      // portions: this.fb.array([], [atLeastOnePortionFilled, totalPercentageValidator()])
      portions: this.fb.array([], [atLeastOnePortionFilled])
    }, { validators: customTotalValidator });

    this.loadSalaryPortions();

    this.portionsForm.get('portions')?.valueChanges.subscribe(() => {
      this.updateBasicPercentage();
    });

    this.portionsForm.get('isFlexible')?.valueChanges.subscribe((isFlexible: boolean) => {
      this.onFlexibleModeChange(isFlexible);
    });

    // Subscribe to form changes to update basic percentage
    this.portionsForm.valueChanges.subscribe(() => {
      this.updateBasicPercentage();
    });
  }

  private onFlexibleModeChange(isFlexible: boolean): void {
    const basicPercentageControl = this.portions.at(0)?.get('percentage');

    if (isFlexible) {
      basicPercentageControl?.enable();
    } else {
      basicPercentageControl?.disable();
      this.updateBasicPercentage();
    }
    this.portionsForm.updateValueAndValidity();
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
        // Trigger basic percentage update when portion is enabled/disabled
        this.updateBasicPercentage();
      });

      // Subscribe to percentage changes for non-basic portions
      portionGroup.get('percentage')?.valueChanges.subscribe(() => {
        this.updateBasicPercentage();
      });
    }

    return portionGroup;
  }


  private loadSalaryPortions(): void {
    this.isLoading = true;
    this.salaryPortionService.single().subscribe({
      next: (data) => {
        this.isLoading = false;
        this.salaryPortion = data;
        const settingsFromResponse = data.object_info?.settings || data.settings || [];
        this.salaryPortions = settingsFromResponse || [];
        const isFlexibleState = data.is_flexible ?? false;
        this.portions.clear();


        if (this.salaryPortions.length > 0) {
          // Filter out 'gross'
          const filteredPortions = this.salaryPortions.filter((p: any) => {
            const name = typeof p.name === 'string' ? p.name.toLowerCase().trim() : '';
            return name !== 'gross';
          });

          // Determine default portion: prefer explicit default flag, otherwise use first element
          let defaultPortion = filteredPortions.find((p: any) => p.default === true);
          if (!defaultPortion && filteredPortions.length > 0) {
            defaultPortion = filteredPortions[0];
          }

          // Other portions are the remaining items (exclude the chosen default)
          const otherPortions = filteredPortions.filter((p: any) => p !== defaultPortion);

          const returnedFormArray: FormGroup[] = [];

          // Always add default portion first (with locked percentage)
          // Use the actual percentage from response initially, but it will be recalculated
          if (defaultPortion) {
            returnedFormArray.push(this.createPortion({
              name: defaultPortion.name,
              percentage: defaultPortion.percentage || 100
            }, true));
          } else {
            // Fallback: if no default portion found, create one
            returnedFormArray.push(this.createPortion({ name: 'basic', percentage: 100 }, true));
          }

          // Add other portions (max 2)
          otherPortions.slice(0, 2).forEach((p: any) => {
            returnedFormArray.push(this.createPortion(p, false));
          });

          // Fill remaining slots to have exactly 2 open inputs (plus basic = 3 total)
          while (returnedFormArray.length < 3) {
            returnedFormArray.push(this.createPortion());
          }

          this.portionsForm.setControl(
            'portions',
            this.fb.array(
              returnedFormArray,
              [atLeastOnePortionFilled]
            )
          );

          // Calculate initial basic percentage after form is set up
          // setTimeout(() => this.updateBasicPercentage(), 0);
          // setTimeout(() => {
          //   this.onFlexibleModeChange(this.portionsForm.get('isFlexible')?.value);
          // }, 0);
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
              [atLeastOnePortionFilled]
            )
          );

          // Calculate initial basic percentage after form is set up
          // setTimeout(() => this.updateBasicPercentage(), 0);
          // setTimeout(() => {
          //   this.onFlexibleModeChange(this.portionsForm.get('isFlexible')?.value);
          // }, 0);
        }
        setTimeout(() => {
          this.portionsForm.get('isFlexible')?.setValue(isFlexibleState);
          if (!isFlexibleState) {
            this.updateBasicPercentage();
          }
          this.portionsForm.updateValueAndValidity();
        }, 0);
      },
      error: (err) => {
        console.error('Failed to load single salary portion', err);
        this.isLoading = false;
        // Default case: basic + 2 open inputs
        this.portionsForm.setControl(
          'portions',
          this.fb.array(
            [
              this.createPortion({ name: 'basic', percentage: 100 }, true),
              this.createPortion(),
              this.createPortion()
            ],
            [atLeastOnePortionFilled]
          )
        );

        // Calculate initial basic percentage after form is set up
        // setTimeout(() => this.updateBasicPercentage(), 0);
        setTimeout(() => {
          this.portionsForm.get('isFlexible')?.setValue(false);
          this.updateBasicPercentage();
        }, 0);
      }
    });
  }



  get portions(): FormArray<FormGroup> {
    return this.portionsForm.get('portions') as FormArray<FormGroup>;
  }

  updateSalaryPortion(): void {
    this.attemptedSubmit = true;
    const invalidPortion = this.hasInvalidEnabledPortion();

    if (invalidPortion) {
      this.portionsForm.markAllAsTouched();
      return;
    }
    const isFlexible = this.portionsForm.get('isFlexible')?.value;
    const total = this.portions.controls.reduce((sum, group) => {

      const enabled = group.get('enabled')?.value;

      if (!enabled && group !== this.portions.at(0)) return sum;

      const num = Number(group.get('percentage')?.value) || 0;
      return sum + num;
    }, 0);

    //   if (!enabled) return sum;
    //   const num = Number(group.get('percentage')?.value) || 0;
    //   return sum + num;
    // }, 0);

    if (!isFlexible && total > 100) {
      this.portionsForm.markAllAsTouched();
      return;
    }

    // Get default_name from first row (index 0)
    const defaultPortion = this.portions.at(0) as FormGroup;
    const defaultName = defaultPortion?.get('name')?.value?.trim() || 'Basic';

    // Get settings from other rows (indices 1 and 2) that are enabled
    const settings: { name: string; percentage: number }[] = [];
    // always include the first portion (basic) in settings so its percentage is sent
    const startIndex = 0;
    for (let i = startIndex; i < this.portions.length; i++) {
      const portion = this.portions.at(i) as FormGroup;
      const isTargetRow = (i === 0);
      const enabled = portion?.get('enabled')?.value;
      // use getRawValue to ensure we read the control value even if it's disabled
      const raw = portion.getRawValue();
      const name = (raw.name || '').toString().trim();
      const percentage = raw.percentage === '' || raw.percentage === null || raw.percentage === undefined ? 0 : Number(raw.percentage);

      // include the row if:
      // - it's the target row (basic when flexible), or
      // - it's explicitly enabled, or
      // - the user filled a name, or
      // - the user filled a percentage (> 0)
      const hasPercentage = !isNaN(percentage) && percentage > 0;
      const shouldInclude = isTargetRow || enabled || (!!name && name.length > 0) || hasPercentage;
      if (shouldInclude) {
        // prefer sending an empty string name as-is if user provided nothing,
        // but backend expects a name — only push when we have a name or percentage
        settings.push({ name, percentage });
      }
    }

    const isFlexibleValue = this.portionsForm.get('isFlexible')?.value;

    const requestPayload = {
      default_name: defaultName,
      settings: settings,
      is_flexible: isFlexibleValue
    };

    this.isLoading = true;
    this.salaryPortionService.updateSalaryPortion(requestPayload).subscribe({
      next: () => {
        this.toasterService.showSuccess('Salary portion updated successfully', "Updated Successfully");
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

  // Update basic percentage: 100 - sum of other enabled portions
  private updateBasicPercentage(): void {
    if (this.portionsForm.get('isFlexible')?.value === true) {
      return;
    }
    if (!this.portions || this.portions.length === 0) return;

    // Basic is always the first portion (index 0)
    const basicPortion = this.portions.at(0) as FormGroup;
    if (!basicPortion) return;

    // Calculate sum of other enabled portions (indices 1 and 2)
    let sumOfOthers = 0;
    for (let i = 1; i < this.portions.length; i++) {
      const portion = this.portions.at(i) as FormGroup;
      const enabled = portion.get('enabled')?.value;
      if (enabled) {
        const percentageValue = portion.get('percentage')?.value;
        const num = percentageValue === '' || percentageValue === null ? 0 : Number(percentageValue);
        if (!isNaN(num)) {
          sumOfOthers += num;
        }
      }
    }

    // Set basic = 100 - sum of others (minimum 0)
    const newBasicValue = Math.max(0, 100 - sumOfOthers);
    basicPortion.get('percentage')?.setValue(newBasicValue, { emitEvent: false });
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
