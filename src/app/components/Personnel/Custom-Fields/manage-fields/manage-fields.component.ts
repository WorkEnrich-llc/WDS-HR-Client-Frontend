import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';

import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { CreateFieldRequest, DataType, InputOption, RequestData, TargetModelItem, UpdateFieldRequest, UpdateFieldRequestData } from 'app/core/models/custom-field';
import { PaginationStateService } from 'app/core/services/pagination-state/pagination-state.service';
import { CustomFieldsService } from 'app/core/services/personnel/custom-fields/custom-fields.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';



@Component({
  selector: 'app-manage-fields',
  imports: [CommonModule, PageHeaderComponent, PopupComponent, ReactiveFormsModule],
  templateUrl: './manage-fields.component.html',
  styleUrl: './manage-fields.component.css'
})
export class ManageFieldsComponent {


  readonly dataTypes: DataType[] = [
    { name: 'text', value: 'text' },
    { name: 'number', value: 'number' },
    { name: 'textarea', value: 'textarea' },
    // { name: 'integer', value: 'integer' },
    { name: 'email', value: 'email' },
    { name: 'date', value: 'date' },
    { name: 'file', value: 'file' },
  ];

  public customFieldForm!: FormGroup;
  private fb = inject(FormBuilder);
  private customFieldService = inject(CustomFieldsService);
  private toasterService = inject(ToasterMessageService);
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);
  private paginationState = inject(PaginationStateService);


  modelItems$!: Observable<TargetModelItem[]>;

  isSubmitting = false;
  isEditMode = false;
  currentFieldId?: number;
  id?: number;
  createDate: string = '';
  updatedDate: string = '';
  isLoading = false;
  isLoadingFieldDetails = false;
  fieldName: string = '';
  initialFormValues: any = null;



  constructor() { }

  ngOnInit(): void {
    this.initFormModel();
    this.modelItems$ = this.customFieldService.getTargetModelItems();

    this.currentFieldId = Number(this.activeRoute.snapshot.paramMap.get('id'));
    this.isEditMode = !!this.currentFieldId;

    if (this.isEditMode) {
      this.loadFieldForEdit(this.currentFieldId);
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
    const currentPage = this.paginationState.getPage('custom-fields/all-custom-fields');
    this.router.navigate(['/custom-fields/all-custom-fields'], { queryParams: { page: currentPage } });
  }


  private initFormModel(): void {
    this.customFieldForm = this.fb.group({
      label: ['', [Validators.required, Validators.maxLength(80)]],
      target_model: ['', [Validators.required]],
      type: ['', [Validators.required]],
      required: [false, [Validators.required]],
      pinned: [false, [Validators.required]],
    });
  }


  private loadFieldForEdit(fieldId: number): void {
    this.isLoadingFieldDetails = true;
    this.customFieldService.getCustomFieldObject(fieldId).subscribe({
      next: (fieldData) => {
        this.currentFieldId = fieldData.id;
        this.fieldName = fieldData.input_option.label || '';

        const formValues = {
          target_model: fieldData.target_model,
          label: fieldData.input_option.label,
          type: fieldData.input_option.type,
          required: fieldData.input_option.required,
          pinned: fieldData.pinned,
        };

        this.customFieldForm.patchValue(formValues);
        // Store initial values for comparison
        this.initialFormValues = { ...formValues };
        this.isLoadingFieldDetails = false;
      },
      error: (err) => {
        console.error('Error loading field details:', err);
        this.isLoadingFieldDetails = false;
      }
    });
  }

  hasFormChanged(): boolean {
    if (!this.isEditMode || !this.initialFormValues) {
      return false;
    }
    
    const currentValues = this.customFieldForm.value;
    return JSON.stringify(this.initialFormValues) !== JSON.stringify(currentValues);
  }



  async createCustomField(): Promise<void> {
    if (this.customFieldForm.invalid) {
      this.customFieldForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    const formValues = this.customFieldForm.value;
    const inputOptions: InputOption = {
      label: formValues.label,
      type: formValues.type,
      required: formValues.required,
      placeholder: formValues.label,
      value: '',
      min_length: 0,
      max_length: 0,
      pattern: "",
      options: [],
      default: null,
      help_text: "",
      generate_signed_url: false,
      file_settings: {
        max_size: null,
        allowed_extensions: []
      }
    };
    
    try {
      if (this.isEditMode) {
        // Update request - includes id
        const updateRequestData: UpdateFieldRequestData = {
          id: this.currentFieldId,
          target_model: formValues.target_model,
          input_option: inputOptions,
          pinned: formValues.pinned
        };
        const updateRequest: UpdateFieldRequest = {
          request_data: updateRequestData
        };
        await firstValueFrom(this.customFieldService.updateCustomField(updateRequest));
        this.toasterService.showSuccess('Custom field updated successfully');
      } else {
        // Create request - no id
        const createRequestData: RequestData = {
          target_model: formValues.target_model,
          input_option: inputOptions,
          pinned: formValues.pinned
        };
        const createRequest: CreateFieldRequest = {
          request_data: createRequestData
        };
        await firstValueFrom(this.customFieldService.createCustomField(createRequest));
        this.toasterService.showSuccess('Custom field created successfully');
      }
      this.router.navigate(['/custom-fields/all-custom-fields']);
    } catch (err) {
      console.error('Create custom field failed', err);
    } finally {
      this.isLoading = false;
    }
  }


}
