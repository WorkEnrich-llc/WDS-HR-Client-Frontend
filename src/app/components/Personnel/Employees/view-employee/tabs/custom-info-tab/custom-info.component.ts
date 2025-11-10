import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
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
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PopupComponent],
  templateUrl: './custom-info.component.html',
  styleUrl: './custom-info.component.css'
})
export class CustomInfoComponent implements OnChanges {

  @Output() valueUpdated = new EventEmitter<UpdateCustomValueRequest>();
  @Output() fieldDeleted = new EventEmitter<UpdateFieldRequest>();
  @Input() customFieldValues: CustomFieldValueItem[] = [];

  @Input() isLoading: boolean = false;

  editStates: EditState[] = [];
  isDeleteModalOpen: boolean = false;
  selectedField!: number;

  customInfoForm: FormGroup = new FormGroup({
    fields: new FormArray([])
  });

  get fieldsArray() {
    return this.customInfoForm.get('fields') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['customFieldValues'] && this.customFieldValues) {
      this.buildFormFromData(this.customFieldValues);
    }
  }

  buildFormFromData(items: CustomFieldValueItem[]): void {
    this.fieldsArray.clear();
    items.forEach(item => {
      this.fieldsArray.push(this.createFieldGroup(item));
    });
  }


  createFieldGroup(item: CustomFieldValueItem): FormGroup {
    const fieldOptions = item.custom_field.input_option;

    let htmlInputType = 'text';
    switch (fieldOptions.type) {
      case 'integer':
      case 'number':
        htmlInputType = 'number';
        break;
      case 'email':
        htmlInputType = 'email';
        break;
      case 'date':
        htmlInputType = 'date';
        break;
    }

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
      ),

      htmlType: new FormControl({ value: htmlInputType, disabled: true }),
      placeholder: new FormControl({ value: fieldOptions.placeholder, disabled: true })
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

    if (group.invalid) {
      group.markAllAsTouched();
      return;
    }

    control?.disable();
    const rawData = group.getRawValue();

    const payload: UpdateCustomValueRequest = {
      request_data: {
        id: rawData.value_id,
        value: rawData.value
      }
    };


    this.valueUpdated.emit(payload);

    group.get('originalValue')?.setValue(rawData.value);
  }

  onRemove(index: number): void {
    const group = this.fieldsArray.at(index) as FormGroup;
    const customField = group.get('custom_field')?.value as CustomFieldObject;

    const payload: UpdateFieldRequest = {
      request_data: {
        id: customField.id,
        target_model: customField.target_model,
        input_option: customField.input_option
      }
    };
    this.fieldDeleted.emit(payload);
    this.closeDeleteModal();
  }


  openDeleteModal(index: number): void {
    this.selectedField = index;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
    this.selectedField = null!;
  }

  public getErrorMessage(control: AbstractControl | null): string {
    if (!control || !control.errors || !(control.dirty || control.touched)) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return `This field must be at least ${requiredLength} characters long.`;
    }

    if (control.errors['maxlength']) {
      const requiredLength = control.errors['maxlength'].requiredLength;
      return `This field cannot exceed ${requiredLength} characters.`;
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address.';
    }

    if (control.errors['pattern']) {
      return 'The value format is invalid.';
    }

    return 'Invalid value.';
  }




}
