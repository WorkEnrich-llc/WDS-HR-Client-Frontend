import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { Employee } from 'app/core/interfaces/employee';
import { CustomFieldObject, CustomFieldValueItem, CustomFieldValuesParams, UpdateCustomValueRequest, UpdateFieldRequest } from 'app/core/models/custom-field';
import { CustomFieldsService } from 'app/core/services/personnel/custom-fields/custom-fields.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

interface CustomField {
  label: string;
  value: string;
}

interface EditState {
  isEditing: boolean;
  editValue: string;
}

@Component({
  selector: 'app-custom-info',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PopupComponent],
  templateUrl: './custom-info.component.html',
  styleUrl: './custom-info.component.css'
})
export class CustomInfoComponent implements OnInit {
  @Input() employee: Employee | null = null;
  @Output() fieldsUpdated = new EventEmitter<CustomField[]>();
  private route = inject(ActivatedRoute);
  private customFieldsService = inject(CustomFieldsService);
  private toasterService = inject(ToasterMessageService);
  customFieldValues: CustomFieldValueItem[] = [];
  editStates: EditState[] = [];
  isDeleteModalOpen: boolean = false;
  selectedField!: number;
  isLoading = false
  readonly app_name = 'personnel';

  customInfoForm: FormGroup = new FormGroup({
    fields: new FormArray([])
  });

  get fieldsArray() {
    return this.customInfoForm.get('fields') as FormArray;
  }

  ngOnInit(): void {
    const modelName = this.route.snapshot.parent?.data['model_name'];
    console.log('Model Name:', modelName);

    const objectId = this.route.snapshot.paramMap.get('id');
    console.log('Object ID:', objectId);
    this.loadCustomValues();

  }


  createFieldGroup(item: CustomFieldValueItem): FormGroup {
    const fieldOptions = item.custom_field.input_option;

    return new FormGroup({
      value_id: new FormControl(item.id),
      custom_field: new FormControl(item.custom_field),
      originalValue: new FormControl(item.value.value),
      label: new FormControl({ value: fieldOptions.label, disabled: true }),
      value: new FormControl(
        { value: item.value.value, disabled: true },
        [
          fieldOptions.required ? Validators.required : null,
          fieldOptions.min_length ? Validators.minLength(fieldOptions.min_length) : null,
          fieldOptions.max_length ? Validators.maxLength(fieldOptions.max_length) : null,
        ].filter(v => v !== null) as ValidatorFn[]
      )
    });
  }

  onEdit(index: number): void {
    this.fieldsArray.at(index)?.get('value')?.enable();
  }

  onCancel(index: number): void {
    const group = this.fieldsArray.at(index) as FormGroup;
    const control = group.get('value');
    const originalValue = group.get('originalValue')?.value;

    if (control) {
      control.setValue(originalValue);
      control.disable();
    }
  }


  onConfirm(index: number): void {
    const group = this.fieldsArray.at(index) as FormGroup;
    const control = group.get('value');
    if (!group || !control) return;
    if (group.invalid) {
      group.markAllAsTouched();
      return;
    }
    control.disable();
    const rawData = group.getRawValue();
    const payload: UpdateCustomValueRequest = {
      request_data: {
        id: rawData.value_id,
        value: rawData.value
      }
    };
    this.isLoading = true;
    this.customFieldsService.updateCustomFieldValue(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.toasterService.showSuccess('Updated successfully');
        group.get('originalValue')?.setValue(rawData.value);
      },
      error: (err) => {
        this.isLoading = false;
        control.enable();
        this.toasterService.showError('Error updating value');
        console.error('Update Failed:', err);
      }
    });
  }



  onRemove(index: number): void {
    const group = this.fieldsArray.at(index) as FormGroup;
    const customField = group.get('custom_field')?.value as CustomFieldObject;
    if (!customField) {
      console.error(" Custom field data not found.");
      return;
    }
    const payload: UpdateFieldRequest = {
      request_data: {
        id: customField.id,
        target_model: customField.target_model,
        input_option: customField.input_option
      }
    };

    this.isLoading = true;
    this.customFieldsService.deleteCustomFieldValue(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.closeDeleteModal();
        this.toasterService.showSuccess('Deleted successfully');
        this.fieldsArray.removeAt(index);
      },
      error: (err) => {
        this.isLoading = false;
        this.closeDeleteModal();

        console.error('Delete Failed:', err);
      }
    });
  }



  loadCustomValues(): void {
    this.isLoading = true;

    // const modelName = this.route.snapshot.parent?.data['model_name'];
    const modelName = 'employees';
    console.log('Model Name:', modelName);

    const objectId = this.route.snapshot.paramMap.get('id');
    console.log('Object ID:', objectId);

    if (!modelName || !objectId) {
      console.error('Could not load custom field values');
      this.isLoading = false;
      return;
    }

    const params: CustomFieldValuesParams = {
      app_name: this.app_name,
      model_name: modelName,
      object_id: objectId
    };


    this.customFieldsService.getCustomFieldValues(params).subscribe({
      next: (response) => {
        this.customFieldValues = response.data.list_items;
        console.log('Custom Field Values:', this.customFieldValues);

        this.fieldsArray.clear();
        this.customFieldValues.forEach(item => {
          this.fieldsArray.push(this.createFieldGroup(item));
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error(' Error get data:', err);
      }
    });
  }

  openDeleteModal(index: number): void {
    this.selectedField = index;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedField = null!;
  }


}
