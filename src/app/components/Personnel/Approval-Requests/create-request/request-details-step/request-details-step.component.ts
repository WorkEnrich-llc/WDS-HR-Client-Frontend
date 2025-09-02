import { CommonModule } from '@angular/common';
import { Component, inject, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CreateRequestSharedService } from '../services/create-request-shared.service';

@Component({
  selector: 'app-request-details-step',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './request-details-step.component.html',
  styleUrl: './request-details-step.component.css'
})
export class RequestDetailsStepComponent {
  @Output() submitForm = new EventEmitter<void>();
  
  sharedService = inject(CreateRequestSharedService);

  // Helpers to determine which form to show
  selectedRequestType(): number | null {
    return this.sharedService.mainInformation.get('request_type')?.value ?? null;
  }

  isLeaveRequest(): boolean {
    return this.selectedRequestType() === 1;
  }

  isOvertimeRequest(): boolean {
    return this.selectedRequestType() === 2;
  }

  isPermissionRequest(): boolean {
    return this.selectedRequestType() === 3;
  }

  // Return the display name for the selected request type
  selectedRequestTypeName(): string | null {
    const id = this.selectedRequestType();
    const found = this.sharedService.requestTypes().find(t => t.id === id);
    return found ? found.name : null;
  }

  // Typed getters for the subgroups
  get leaveGroup(): FormGroup {
    return this.sharedService.requestDetails.get('leave') as FormGroup;
  }

  get overtimeGroup(): FormGroup {
    return this.sharedService.requestDetails.get('overtime') as FormGroup;
  }

  get permissionGroup(): FormGroup {
    return this.sharedService.requestDetails.get('permission') as FormGroup;
  }

  // Simple in-memory attachments list for UI
  attachments: { id: number; name: string; file?: File }[] = [
    { id: 1, name: 'file292481.pdf' },
    { id: 2, name: 'file292481.pdf' },
    { id: 3, name: 'file292481.pdf' }
  ];

  private nextAttachmentId = 4;

  addAttachments(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const f = files.item(i)!;
      this.attachments.push({ id: this.nextAttachmentId++, name: f.name, file: f });
    }

    // reset input
    input.value = '';
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  downloadAttachment(index: number) {
    const entry = this.attachments[index];
    if (entry.file) {
      const url = URL.createObjectURL(entry.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.name;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // No file blob (placeholder) — fall back to no-op or call API to fetch
      console.warn('No file available for download:', entry.name);
    }
  }

  onPrevious() {
    this.sharedService.previousStep();
  }

  onSubmit() {
    // Ensure all controls are marked as touched so validation messages appear
    this.sharedService.mainInformation.markAllAsTouched();
    this.sharedService.requestDetails.markAllAsTouched();

    // Log for debugging
    console.log('RequestForm value on submit:', this.sharedService.requestForm?.getRawValue ? this.sharedService.requestForm.getRawValue() : this.sharedService.requestForm.value);

    // If the form is invalid, set an error message and prevent submission
    if (!this.sharedService.requestForm.valid) {
      this.sharedService.errMsg.set('يرجى تعبئة الحقول المطلوبة قبل الإرسال');
      return;
    }

    // Clear any previous error and proceed
    this.sharedService.errMsg.set('');
    this.sharedService.isLoading.set(true);
    this.submitForm.emit();
  }
}
