import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

  isSubmitting = false;
  isEditMode = false;
  isLoading = false;
  id?: number;
  taxName: string = '';
  createDate: string = '';
  updatedDate: string = '';
  currentTab: 'main-info' | 'tax-brackets' = 'main-info';
  originalBrackets: any[] = []; // Store original brackets for tracking updates/deletes

  constructor() { }

  ngOnInit(): void {
    this.initFormModel();
    this.checkModeAndLoadData();
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

  private initFormModel(): void {
    this.taxForm = this.fb.group({
      id: [null], // Tax ID - editable
      name: ['', [Validators.required, Validators.maxLength(255)]],
      minimum: [0, [Validators.required, Validators.min(0)]],
      maximum: [0, [Validators.required, Validators.min(0)]],
      exemption: [0, [Validators.required, Validators.min(0)]],
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
      minimum: [0, [Validators.required, Validators.min(0)]],
      maximum: [0, [Validators.required, Validators.min(0)]],
      percentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      taxable: [0, [Validators.required, Validators.min(0)]]
    });
    this.bracketsArray.push(bracket);
  }

  removeBracket(index: number): void {
    this.bracketsArray.removeAt(index);
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

          this.taxForm.patchValue({
            id: data.id || null,
            name: data.name || '',
            minimum: minimum,
            maximum: maximum,
            exemption: exemption
          });

          // Load brackets into FormArray and store original brackets
          const brackets = data.brackets || [];
          this.originalBrackets = brackets.map((bracket: any) => ({
            id: bracket.id,
            minimum: bracket.minimum || 0,
            maximum: bracket.maximum || 0,
            percentage: bracket.percentage || 0,
            taxable: bracket.taxable || 0
          }));
          this.bracketsArray.clear();
          brackets.forEach((bracket: any) => {
            const bracketGroup = this.fb.group({
              id: [bracket.id || 0], // Store original id
              minimum: [bracket.minimum || 0, [Validators.required, Validators.min(0)]],
              maximum: [bracket.maximum || 0, [Validators.required, Validators.min(0)]],
              percentage: [bracket.percentage || 0, [Validators.required, Validators.min(0), Validators.max(100)]],
              taxable: [bracket.taxable || 0, [Validators.required, Validators.min(0)]]
            });
            this.bracketsArray.push(bracketGroup);
          });

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
      this.taxForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    
    // Format brackets based on create or update mode
    let formattedBrackets: any[] = [];
    let deletedBrackets: any[] = [];
    
    if (this.isEditMode) {
      // For update: determine which brackets are new, updated, or deleted
      const currentBrackets = (this.taxForm.value.brackets || []).map((bracket: any) => ({
        id: bracket.id || 0,
        minimum: +bracket.minimum || 0,
        maximum: +bracket.maximum || 0,
        percentage: +bracket.percentage || 0,
        taxable: +bracket.taxable || 0
      }));
      
      // Find deleted brackets (in original but not in current)
      const currentIds = currentBrackets.map((b: any) => b.id);
      deletedBrackets = this.originalBrackets
        .filter((orig: any) => orig.id && !currentIds.includes(orig.id))
        .map((bracket: any) => ({
          id: bracket.id,
          minimum: bracket.minimum,
          maximum: bracket.maximum,
          percentage: bracket.percentage,
          taxable: bracket.taxable,
          type: 'delete'
        }));
      
      // Process current brackets: determine if new or updated
      formattedBrackets = currentBrackets.map((bracket: any) => {
        const originalBracket = this.originalBrackets.find((orig: any) => orig.id === bracket.id);
        if (!bracket.id || bracket.id === 0) {
          // New bracket
          return {
            id: 0,
            minimum: bracket.minimum,
            maximum: bracket.maximum,
            percentage: bracket.percentage,
            taxable: bracket.taxable,
            type: 'create'
          };
        } else if (originalBracket) {
          // Updated bracket (always send as update even if unchanged)
          return {
            id: bracket.id,
            minimum: bracket.minimum,
            maximum: bracket.maximum,
            percentage: bracket.percentage,
            taxable: bracket.taxable,
            type: 'update'
          };
        }
        // Fallback: treat as new
        return {
          id: 0,
          minimum: bracket.minimum,
          maximum: bracket.maximum,
          percentage: bracket.percentage,
          taxable: bracket.taxable,
          type: 'create'
        };
      });
      
      // Add deleted brackets
      formattedBrackets = [...formattedBrackets, ...deletedBrackets];
    } else {
      // For create: all brackets are new with id: 0 and type: "create" (required by API)
      formattedBrackets = (this.taxForm.value.brackets || []).map((bracket: any) => ({
        id: 0,
        minimum: +bracket.minimum || 0,
        maximum: +bracket.maximum || 0,
        percentage: +bracket.percentage || 0,
        taxable: +bracket.taxable || 0,
        type: 'create'
      }));
    }
    
    const formData: any = {
      code: '', // Empty code as per API structure
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
        // Include id in formData, service will add it to request_data
        formData.id = this.taxForm.value.id || this.id;
        await firstValueFrom(this.taxesService.update(this.id, formData));
        this.toasterService.showSuccess('Tax updated successfully', "Updated Successfully");
      } else {
        // For create, include id if provided in form
        if (this.taxForm.value.id) {
          formData.id = this.taxForm.value.id;
        }
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
