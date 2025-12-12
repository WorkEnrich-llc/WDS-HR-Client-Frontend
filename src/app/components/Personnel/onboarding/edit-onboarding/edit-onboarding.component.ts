
import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { OnboardingService } from 'app/core/services/personnel/onboarding/onboarding.service';
interface CheckItem {
  name: string;
  completed: boolean;
  editing?: boolean;
  error?: string | null;
}
@Component({
  selector: 'app-edit-onboarding',
  imports: [PageHeaderComponent, ReactiveFormsModule, PopupComponent],
  templateUrl: './edit-onboarding.component.html',
  styleUrl: './edit-onboarding.component.css'
})
export class EditOnboardingComponent {
  checks: CheckItem[] = [];
  checkForm: FormGroup;
  constructor(private router: Router, private fb: FormBuilder, private onboardingService: OnboardingService) {
    this.checkForm = this.fb.group({
      checkName: ['', [Validators.required, Validators.maxLength(100),
      this.noWhitespaceValidator]]
    });
  }

  noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    return !isWhitespace ? null : { whitespace: true };
  }
  ngOnInit() {

    this.getOnboarding();
  }


  getOnboarding() {
    this.onboardingService.getOnboarding().subscribe({
      next: (response) => {
        const list = response.data.object_info.onboarding_list || [];

        this.checks = list.map((item: any) => ({
          name: item.title,
          completed: false,
          editing: false
        }));
      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
  }



  // add new check
  addCheck() {
    if (this.checkForm.invalid) {
      this.checkForm.markAllAsTouched();
      return;
    }
    if (this.checkForm.valid) {
      this.checks.push({
        name: this.checkForm.value.checkName,
        completed: false
      });
      this.checkForm.reset();
      this.printData();
    }
  }

  get hasSelectedChecks(): boolean {
    return this.checks.some(c => c.completed);
  }

  // toggle checkbox
  toggleCheck(index: number) {
    this.checks[index].completed = !this.checks[index].completed;
    // this.printData();
  }

  // delete selected items
  deleteSelected() {
    if (!this.hasSelectedChecks) return;
    this.openDeleteModal();
  }

  confirmDelete() {
    this.checks = this.checks.filter(c => !c.completed);
    this.printData();
    this.closeDeleteModal();
  }

  // Edit selected items
  startEditSelected() {
    if (!this.hasSelectedChecks) return;
    this.checks.forEach(c => {
      if (c.completed) c.editing = true;
    });
  }

  finishEdit(item: CheckItem, event: any) {
    const value = (event.target.value || '').trim();

    // Validation
    if (!value) {
      item.error = 'Checklist Item is required and cannot be only spaces.';
      item.editing = true;
      return;
    } else if (value.length > 100) {
      item.error = 'Checklist Item maxlength is 100 characters only.';
      item.editing = true;
      return;
    }

    // Passed validation
    item.error = null;
    item.name = value;
    item.editing = false;
    item.completed = false;
    this.printData();
  }

  // drag & drop reorder
  draggedIndex: number | null = null;
  dragOverIndex: number | null = null;

  onDragStart(index: number) {
    this.draggedIndex = index;
  }

  allowDrop(event: DragEvent, index: number) {
    event.preventDefault();
    this.dragOverIndex = index;
  }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    if (this.draggedIndex === null) return;

    const draggedItem = this.checks[this.draggedIndex];
    this.checks.splice(this.draggedIndex, 1);
    this.checks.splice(dropIndex, 0, draggedItem);

    this.draggedIndex = null;
    this.dragOverIndex = null;

    this.printData();
  }

  onDragEnd() {
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  // send data to back end 
  printData() {
    const request_data = {
      onboarding_list: this.checks.map(c => ({
        title: c.name,
        status: false
      }))
    };
    this.onboardingService.createOnboarding({ request_data }).subscribe({
      next: (response) => {
        // console.log('Onboarding data saved successfully:', response);
      },
      error: (err) => {
        console.error('Error saving onboarding data:', err);
      }
    });
  }

  removeCheck(index: number) {
    this.checks.splice(index, 1);
    this.printData();
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
    this.router.navigate(['/dashboard']);
  }

  // Delete confirmation modal
  isDeleteModalOpen = false;

  openDeleteModal() {
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
  }

  get selectedChecksCount(): number {
    return this.checks.filter(c => c.completed).length;
  }
}
