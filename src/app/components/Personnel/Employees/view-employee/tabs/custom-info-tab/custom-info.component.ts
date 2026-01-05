
import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { CustomFieldObject, CustomFieldValueItem, CustomFieldValuesParams, UpdateCustomValueRequest, UpdateFieldRequest } from 'app/core/models/custom-field';

export function noLeadingSpaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value && typeof value === 'string' && value.startsWith(' ')) {
      return { 'noLeadingSpace': true };
    }
    return null;
  };
}

export function noWhitespaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  };
}

@Component({
  selector: 'app-custom-info',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, PopupComponent, NgClass],
  templateUrl: './custom-info.component.html',
  styleUrl: './custom-info.component.css'
})
export class CustomInfoComponent implements OnChanges {

  @Output() valueUpdated = new EventEmitter<UpdateCustomValueRequest>();
  @Output() fieldDeleted = new EventEmitter<UpdateFieldRequest>();
  @Input() customFieldValues: CustomFieldValueItem[] = [];

  @Input() isLoading: boolean = false;

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
    // const validators: ValidatorFn[] = [];
    const validators: ValidatorFn[] = [noWhitespaceValidator()];

    if (fieldOptions.required) {
      validators.push(Validators.required);
    }
    if (fieldOptions.min_length) {
      validators.push(Validators.minLength(fieldOptions.min_length));
    }
    if (fieldOptions.max_length) {
      validators.push(Validators.maxLength(fieldOptions.max_length));
    }
    validators.push(noLeadingSpaceValidator());

    let htmlInputType = 'text';
    switch (fieldOptions.type) {
      case 'integer':
      case 'number':
        htmlInputType = 'number';
        break;
      case 'email':
        htmlInputType = 'email';
        validators.push(Validators.email);
        break;
      case 'date':
        htmlInputType = 'date';
        break;
      case 'textarea':
        htmlInputType = 'textarea';
        break;
      default:
        htmlInputType = 'text';
        break;
    }
    return new FormGroup({
      value_id: new FormControl(item.id),
      custom_field: new FormControl(item.custom_field),
      originalValue: new FormControl(item.value.value),
      label: new FormControl({ value: fieldOptions.label, disabled: true }),

      value: new FormControl(
        { value: item.value.value, disabled: true },
        validators
      ),

      htmlType: new FormControl({ value: htmlInputType, disabled: true }),
      placeholder: new FormControl({ value: fieldOptions.placeholder, disabled: true })
    });
  }

  public onFilterInput(index: number, event: Event): void {
    const group = this.fieldsArray.at(index);
    const control = group?.get('value');
    if (!control) return;

    const type = group.get('custom_field')?.value.input_option.type;
    const inputElement = (event.target as HTMLInputElement);
    const originalValue = inputElement.value;
    let newValue = originalValue;

    if (type === 'email') {
      newValue = originalValue.replace(/\s/g, '');
    } else {
      newValue = originalValue.trimStart();
    }

    if (originalValue !== newValue) {
      inputElement.value = newValue;

      control.setValue(newValue, { emitEvent: false });
    }
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
        input_option: customField.input_option,
        pinned: customField.pinned
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

    if (control.errors['whitespace']) {
      return 'This field cannot contain only spaces.';
    }

    if (control.errors['noLeadingSpace']) {
      return 'This field cannot start with a space.';
    }

    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return `This field must be at least ${requiredLength} .`;
    }

    if (control.errors['maxlength']) {
      const requiredLength = control.errors['maxlength'].requiredLength;
      return `This field cannot exceed ${requiredLength}.`;
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
