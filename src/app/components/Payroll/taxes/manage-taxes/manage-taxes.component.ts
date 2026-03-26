import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { TaxesService } from 'app/core/services/payroll/taxes/taxes.service';
import { firstValueFrom } from 'rxjs';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-manage-taxes',
  imports: [PageHeaderComponent, PopupComponent, ReactiveFormsModule, NgClass],
  templateUrl: './manage-taxes.component.html',
  styleUrl: './manage-taxes.component.css'
})
export class ManageTaxesComponent implements OnInit {

  public taxForm!: FormGroup;
  private fb = inject(FormBuilder);
  private taxesService = inject(TaxesService);
  private toasterService = inject(ToasterMessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private paginationState = inject(PaginationStateService);
  private destroyRef = inject(DestroyRef);

  isSubmitting = false;
  isEditMode = false;
  isLoading = false;
  id?: number;
  taxName: string = '';
  createDate: string = '';
  updatedDate: string = '';
  currentTab: 'main-info' | 'tax-brackets' = 'main-info';
  originalBrackets: any[] = []; // Store original brackets for tracking updates/deletes

  /** Which min/max control is focused per bracket row (for a single range error at a time). */
  private bracketMinMaxFocusByRow = new Map<number, 'minimum' | 'maximum'>();
  /** After a failed save, show one range message under Minimum until user focuses min/max. */
  private taxFormSubmitAttempted = false;

  constructor() { }

  ngOnInit(): void {
    this.initFormModel();
    this.wireMainSalaryCrossValidation();
    this.taxForm.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.taxForm.valid) {
        this.taxFormSubmitAttempted = false;
      }
    });
    this.checkModeAndLoadData();
  }

  /** Empty number fields use null so inputs show placeholder only (no initial 0). */
  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }

  /** Minimum must not be greater than sibling `maximum` (same FormGroup). */
  private minNotAboveSiblingMaxValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (!parent) {
        return null;
      }
      const maxCtrl = parent.get('maximum');
      const minNum = this.toNumberOrNull(control.value);
      const maxNum = maxCtrl ? this.toNumberOrNull(maxCtrl.value) : null;
      if (minNum === null || maxNum === null) {
        return null;
      }
      return minNum > maxNum ? { minGreaterThanMax: true } : null;
    };
  }

  /** Maximum must not be less than sibling `minimum` (same FormGroup). */
  private maxNotBelowSiblingMinValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (!parent) {
        return null;
      }
      const minCtrl = parent.get('minimum');
      const maxNum = this.toNumberOrNull(control.value);
      const minNum = minCtrl ? this.toNumberOrNull(minCtrl.value) : null;
      if (minNum === null || maxNum === null) {
        return null;
      }
      return maxNum < minNum ? { maxLessThanMinimum: true } : null;
    };
  }

  private wireMainSalaryCrossValidation(): void {
    const min = this.taxForm.get('minimum');
    const max = this.taxForm.get('maximum');
    if (!min || !max) {
      return;
    }
    min.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      max.updateValueAndValidity({ emitEvent: false });
    });
    max.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      min.updateValueAndValidity({ emitEvent: false });
    });
  }

  onMainSalaryRangeChange(): void {
    const min = this.taxForm.get('minimum');
    const max = this.taxForm.get('maximum');
    min?.updateValueAndValidity({ emitEvent: false });
    max?.updateValueAndValidity({ emitEvent: false });
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
    const currentPage = this.paginationState.getPage('taxes/all-taxes');
    this.router.navigate(['/taxes/all-taxes'], { queryParams: { page: currentPage } });
  }

  // remove bracket popup
  isRemoveBracketOpen = false;
  bracketIndexToRemove: number | null = null;

  openRemoveBracketPopup(index: number): void {
    this.bracketIndexToRemove = index;
    this.isRemoveBracketOpen = true;
  }

  closeRemoveBracketPopup(): void {
    this.isRemoveBracketOpen = false;
    this.bracketIndexToRemove = null;
  }

  confirmRemoveBracket(): void {
    if (this.bracketIndexToRemove !== null) {
      this.removeBracket(this.bracketIndexToRemove);
      this.closeRemoveBracketPopup();
    }
  }

  // create/update confirmation popup
  isConfirmSaveOpen = false;

  openConfirmSavePopup(): void {
    this.isConfirmSaveOpen = true;
  }

  closeConfirmSavePopup(): void {
    this.isConfirmSaveOpen = false;
  }

  confirmSave(): void {
    this.closeConfirmSavePopup();
    this.createTax();
  }

  /**
   * Bracket shape required by API (property order matches backend examples).
   */
  private buildTaxBracketRequestPayload(
    minimum: number,
    maximum: number,
    taxable: number,
    percentage: number,
    bracketId: number,
    type: 'create' | 'update' | 'delete'
  ): {
    minimum: number;
    maximum: number;
    taxable: number;
    percentage: number;
    id: number;
    type: 'create' | 'update' | 'delete';
  } {
    return {
      minimum,
      maximum,
      taxable,
      percentage,
      id: bracketId,
      type
    };
  }

  private initFormModel(): void {
    this.taxForm = this.fb.group({
      code: ['', [Validators.maxLength(64)]],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      minimum: [
        null as unknown as number | null,
        [Validators.required, Validators.min(0), this.minNotAboveSiblingMaxValidator()]
      ],
      maximum: [
        null as unknown as number | null,
        [Validators.required, Validators.min(0), this.maxNotBelowSiblingMinValidator()]
      ],
      exemption: [
        null as unknown as number | null,
        [Validators.required, Validators.min(0)]
      ],
      brackets: this.fb.array([])
    });
  }

  // FormArray methods for brackets
  get bracketsArray(): FormArray {
    return this.taxForm.get('brackets') as FormArray;
  }

  addBracket(): void {
    const bracket = this.fb.group({
      id: [0], // New brackets have id: 0
      minimum: [
        null as unknown as number | null,
        [Validators.required, Validators.min(0), this.minNotAboveSiblingMaxValidator()]
      ],
      maximum: [
        null as unknown as number | null,
        [Validators.required, Validators.min(0), this.maxNotBelowSiblingMinValidator()]
      ],
      percentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      taxable: [0]
    });
    this.bracketsArray.push(bracket);
    this.finalizeBracketRow(bracket);
  }

  removeBracket(index: number): void {
    this.bracketsArray.removeAt(index);
    const next = new Map<number, 'minimum' | 'maximum'>();
    this.bracketMinMaxFocusByRow.forEach((field, row) => {
      if (row < index) {
        next.set(row, field);
      } else if (row > index) {
        next.set(row - 1, field);
      }
    });
    this.bracketMinMaxFocusByRow = next;
  }

  /** Taxable amount for a bracket row: max(0, maximum − minimum). */
  computeBracketTaxableAmount(minimum: unknown, maximum: unknown): number {
    const lo = Number(minimum) || 0;
    const hi = Number(maximum) || 0;
    return Math.max(0, hi - lo);
  }

  onBracketRangeChange(index: number): void {
    const g = this.bracketsArray.at(index) as FormGroup;
    if (!g) {
      return;
    }
    this.patchBracketComputedTaxable(g);
    g.get('minimum')?.updateValueAndValidity({ emitEvent: false });
    g.get('maximum')?.updateValueAndValidity({ emitEvent: false });
  }

  onBracketMinMaxFocus(index: number, field: 'minimum' | 'maximum'): void {
    this.bracketMinMaxFocusByRow.set(index, field);
  }

  /**
   * Clear row focus when leaving min/max unless focus moved to the sibling in the same row.
   */
  onBracketMinMaxBlur(index: number): void {
    setTimeout(() => {
      const el = document.activeElement as HTMLElement | null;
      if (el?.id === `minimum-${index}`) {
        this.bracketMinMaxFocusByRow.set(index, 'minimum');
        return;
      }
      if (el?.id === `maximum-${index}`) {
        this.bracketMinMaxFocusByRow.set(index, 'maximum');
        return;
      }
      this.bracketMinMaxFocusByRow.delete(index);
    }, 0);
  }

  /** Range error under Minimum only when that field is focused, or after failed submit (single message). */
  shouldShowBracketMinRangeCrossError(index: number): boolean {
    const g = this.bracketsArray.at(index) as FormGroup | null;
    if (!g) {
      return false;
    }
    const minC = g.get('minimum');
    if (!minC?.touched || !minC.hasError('minGreaterThanMax')) {
      return false;
    }
    const focus = this.bracketMinMaxFocusByRow.get(index);
    if (focus === 'minimum') {
      return true;
    }
    if (focus === 'maximum') {
      return false;
    }
    return this.taxFormSubmitAttempted;
  }

  /** Range error under Maximum only when that field is focused. */
  shouldShowBracketMaxRangeCrossError(index: number): boolean {
    const g = this.bracketsArray.at(index) as FormGroup | null;
    if (!g) {
      return false;
    }
    const maxC = g.get('maximum');
    if (!maxC?.touched || !maxC.hasError('maxLessThanMinimum')) {
      return false;
    }
    return this.bracketMinMaxFocusByRow.get(index) === 'maximum';
  }

  private patchBracketComputedTaxable(group: FormGroup): void {
    const taxableCtrl = group.get('taxable');
    if (!taxableCtrl) {
      return;
    }
    const v = this.computeBracketTaxableAmount(group.get('minimum')?.value, group.get('maximum')?.value);
    taxableCtrl.setValue(v, { emitEvent: false });
  }

  /** Taxable is derived and read-only; still stored for API via getRawValue(). */
  private finalizeBracketRow(group: FormGroup): void {
    const taxableCtrl = group.get('taxable');
    if (!taxableCtrl) {
      return;
    }
    taxableCtrl.clearValidators();
    taxableCtrl.updateValueAndValidity({ emitEvent: false });
    taxableCtrl.disable({ emitEvent: false });
    this.patchBracketComputedTaxable(group);
  }

  private getBracketSnapshotsForSubmit(): {
    id: number;
    minimum: number;
    maximum: number;
    percentage: number;
    taxable: number;
  }[] {
    return this.bracketsArray.controls.map(c => {
      const raw = (c as FormGroup).getRawValue();
      const minimum = +raw.minimum || 0;
      const maximum = +raw.maximum || 0;
      return {
        id: +raw.id || 0,
        minimum,
        maximum,
        percentage: +raw.percentage || 0,
        taxable: this.computeBracketTaxableAmount(minimum, maximum)
      };
    });
  }

  private checkModeAndLoadData(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.id;

    if (this.isEditMode) {
      this.isLoading = true;
      this.taxesService.getById(this.id!).subscribe({
        next: (data) => {
          // Store tax name for header display
          this.taxName = data.name || '';

          // Extract main_salary fields
          const minimum = data.main_salary?.minimum || 0;
          const maximum = data.main_salary?.maximum || 0;
          const exemption = data.main_salary?.exemption || 0;

          const codeStr =
            data.code !== undefined && data.code !== null ? String(data.code).trim() : '';

          this.taxForm.patchValue({
            code: codeStr,
            name: data.name || '',
            minimum: minimum,
            maximum: maximum,
            exemption: exemption
          });
          this.taxForm.get('minimum')?.updateValueAndValidity({ emitEvent: false });
          this.taxForm.get('maximum')?.updateValueAndValidity({ emitEvent: false });

          // Load brackets into FormArray and store original brackets
          const brackets = data.brackets || [];
          this.originalBrackets = brackets.map((bracket: any) => ({
            id: bracket.id,
            minimum: +(bracket.minimum ?? 0) || 0,
            maximum: +(bracket.maximum ?? 0) || 0,
            percentage: +(bracket.percentage ?? 0) || 0,
            taxable: this.computeBracketTaxableAmount(bracket.minimum, bracket.maximum)
          }));
          this.bracketsArray.clear();
          brackets.forEach((bracket: any) => {
            const minV = +(bracket.minimum ?? 0) || 0;
            const maxV = +(bracket.maximum ?? 0) || 0;
            const bracketGroup = this.fb.group({
              id: [bracket.id || 0], // Store original id
              minimum: [
                minV,
                [Validators.required, Validators.min(0), this.minNotAboveSiblingMaxValidator()]
              ],
              maximum: [
                maxV,
                [Validators.required, Validators.min(0), this.maxNotBelowSiblingMinValidator()]
              ],
              percentage: [+(bracket.percentage ?? 0) || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
              taxable: [this.computeBracketTaxableAmount(minV, maxV)]
            });
            this.bracketsArray.push(bracketGroup);
            this.finalizeBracketRow(bracketGroup);
          });
          for (let i = 0; i < this.bracketsArray.length; i++) {
            this.onBracketRangeChange(i);
          }

          this.createDate = data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : '';
          this.updatedDate = data.updated_at ? new Date(data.updated_at).toLocaleDateString('en-GB') : '';
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load tax', err);
          this.isLoading = false;
        }
      });
    } else {
      const today = new Date().toLocaleDateString('en-GB');
      this.createDate = today;
    }
  }

  async createTax(): Promise<void> {
    if (this.taxForm.invalid) {
      this.taxFormSubmitAttempted = true;
      this.taxForm.markAllAsTouched();
      return;
    }
    this.taxFormSubmitAttempted = false;
    this.isSubmitting = true;

    // Format brackets based on create or update mode
    let formattedBrackets: any[] = [];
    let deletedBrackets: any[] = [];

    if (this.isEditMode) {
      // For update: determine which brackets are new, updated, or deleted (includes disabled taxable)
      const currentBrackets = this.getBracketSnapshotsForSubmit();

      // Find deleted brackets (in original but not in current)
      const currentIds = currentBrackets.map((b: any) => b.id);
      deletedBrackets = this.originalBrackets
        .filter((orig: any) => orig.id && !currentIds.includes(orig.id))
        .map((bracket: any) =>
          this.buildTaxBracketRequestPayload(
            +bracket.minimum || 0,
            +bracket.maximum || 0,
            this.computeBracketTaxableAmount(bracket.minimum, bracket.maximum),
            +bracket.percentage || 0,
            +bracket.id,
            'delete'
          )
        );

      // Process current brackets: determine if new or updated
      formattedBrackets = currentBrackets.map((bracket: any) => {
        const originalBracket = this.originalBrackets.find((orig: any) => orig.id === bracket.id);
        if (!bracket.id || bracket.id === 0) {
          return this.buildTaxBracketRequestPayload(
            bracket.minimum,
            bracket.maximum,
            bracket.taxable,
            bracket.percentage,
            0,
            'create'
          );
        }
        if (originalBracket) {
          return this.buildTaxBracketRequestPayload(
            bracket.minimum,
            bracket.maximum,
            bracket.taxable,
            bracket.percentage,
            bracket.id,
            'update'
          );
        }
        return this.buildTaxBracketRequestPayload(
          bracket.minimum,
          bracket.maximum,
          bracket.taxable,
          bracket.percentage,
          0,
          'create'
        );
      });

      // Add deleted brackets
      formattedBrackets = [...formattedBrackets, ...deletedBrackets];
    } else {
      // For create: all brackets are new with id: 0 and type: "create" (required by API)
      formattedBrackets = this.getBracketSnapshotsForSubmit().map((bracket: any) =>
        this.buildTaxBracketRequestPayload(
          bracket.minimum,
          bracket.maximum,
          bracket.taxable,
          bracket.percentage,
          0,
          'create'
        )
      );
    }

    const formData: any = {
      code: (this.taxForm.value.code ?? '').trim(),
      name: this.taxForm.value.name,
      main_salary: {
        minimum: +this.taxForm.value.minimum || 0,
        maximum: +this.taxForm.value.maximum || 0,
        exemption: +this.taxForm.value.exemption || 0
      },
      brackets: formattedBrackets
    };

    try {
      if (this.isEditMode && this.id) {
        await firstValueFrom(this.taxesService.update(this.id, formData));
        this.toasterService.showSuccess('Tax updated successfully', "Updated Successfully");
      } else {
        await firstValueFrom(this.taxesService.create(formData));
        this.toasterService.showSuccess('Tax created successfully', "Created Successfully");
      }
      this.router.navigate(['/taxes/all-taxes']);
    } catch (err) {
      console.error('Create/Update tax failed', err);
    } finally {
      this.isSubmitting = false;
    }
  }

  // Tab navigation methods
  goToNextTab(): void {
    if (this.isFormValidForNext()) {
      this.currentTab = 'tax-brackets';
    }
  }

  goToPreviousTab(): void {
    this.currentTab = 'main-info';
  }

  isFormValidForNext(): boolean {
    return !!this.taxForm && this.taxForm.valid;
  }

}
