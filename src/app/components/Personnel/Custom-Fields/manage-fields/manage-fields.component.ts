import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';

import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { CreateFieldRequest, DataType, InputOption, RequestData, TargetModelItem, UpdateFieldRequestData } from 'app/core/models/custom-field';
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
    { name: 'text', value: 'string' },
    { name: 'number', value: 'number' },
    // { name: 'integer', value: 'integer' },
    { name: 'email', value: 'email' },
    { name: 'date', value: 'date' },
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
  private currentFieldId?: number;
  id?: number;
  createDate: string = '';
  updatedDate: string = '';
  isLoading = false;



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
      label: ['', [Validators.required]],
      target_model: ['', [Validators.required]],
      type: ['', [Validators.required]],
      required: [false, [Validators.required]],
    });
  }


  private loadFieldForEdit(fieldId: number): void {
    this.customFieldService.getCustomFieldObject(fieldId).subscribe(fieldData => {
      this.currentFieldId = fieldData.id;

      this.customFieldForm.patchValue({
        target_model: fieldData.target_model,
        label: fieldData.input_option.label,
        type: fieldData.input_option.type,
        required: fieldData.input_option.required,
      });
    });
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
    const requestData: UpdateFieldRequestData = {
      id: this.currentFieldId,
      target_model: formValues.target_model,
      input_option: inputOptions
    };

    const finalRequest: CreateFieldRequest = {
      request_data: requestData
    };

    if (this.isEditMode && this.id) {
      formValues.id = String(this.id);
    }
    try {
      if (this.isEditMode) {
        await firstValueFrom(this.customFieldService.updateCustomField(finalRequest));
        this.toasterService.showSuccess('Custom field updated successfully');
      } else {
        await firstValueFrom(this.customFieldService.createCustomField(finalRequest));
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
