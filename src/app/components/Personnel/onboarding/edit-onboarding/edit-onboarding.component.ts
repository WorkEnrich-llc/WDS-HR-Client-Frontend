
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
  id?: number | null;
  is_active?: boolean;
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
        const list = response.data?.list_items || [];

        this.checks = list.map((item: any) => ({
          name: item.title,
          completed: false,
          editing: false,
          id: item.id ?? null,
          is_active: item.is_active ?? false
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
      // add the newest item to the top of the list
      this.checks.unshift({
        name: this.checkForm.value.checkName,
        completed: false
      });
      this.checkForm.reset();
      this.printData(true);
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
    // collect ids of selected items to delete
    const idsToDelete = this.checks
      .filter(c => c.completed && c.id != null)
      .map(c => c.id as number);

    // remove selected items locally
    this.checks = this.checks.filter(c => !c.completed);

    if (idsToDelete.length) {
      // send delete payload using HTTP DELETE with body: { request_data: { id: [...] } }
      this.onboardingService.deleteOnboarding({ request_data: { id: idsToDelete } }).subscribe({
        next: () => { },
        error: (err) => { console.error('Error deleting onboarding items:', err); }
      });
    } else {
      // no backend ids to delete (local-only items) — send full list to persist state
      this.printData();
    }

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
    // Save only the edited item to avoid sending the entire list
    this.saveItem(item);
  }

  // save a single item (create or update depending on presence of id)
  saveItem(item: CheckItem) {
    if (!item) return;

    if (item.id != null) {
      const request_data = {
        id: item.id,
        title: item.name,
        is_active: item.is_active ?? false
      };

      this.onboardingService.createOnboarding({ request_data }).subscribe({
        next: () => { },
        error: (err) => { console.error('Error updating onboarding item:', err); }
      });
      return;
    }

    // create new item
    const create_payload = {
      title: item.name,
      is_active: item.is_active ?? true
    };

    this.onboardingService.createOnboarding({ request_data: create_payload }).subscribe({
      next: (resp: any) => {
        // if backend returns created id, assign it to the item
        const created = resp?.data;
        if (created?.id) item.id = created.id;
      },
      error: (err) => { console.error('Error creating onboarding item:', err); }
    });
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
  // if `lastOnly` is true, send only the most recently added item
  printData(lastOnly: boolean = false) {
    let onboarding_list: any[] = [];

    if (lastOnly && this.checks.length) {
      // send single item in update payload shape: { id, title, is_active }
      const newest = this.checks[0];
      // if the newest item has an id, treat as update
      if (newest.id != null) {
        const request_data = {
          id: newest.id,
          title: newest.name,
          is_active: newest.is_active ?? false
        };

        this.onboardingService.createOnboarding({ request_data }).subscribe({
          next: () => { },
          error: (err) => { console.error('Error saving onboarding data:', err); }
        });
        return;
      }

      // otherwise treat as create: send { request_data: { title, is_active } }
      const create_payload = {
        title: newest.name,
        is_active: newest.is_active ?? true
      };

      this.onboardingService.createOnboarding({ request_data: create_payload }).subscribe({
        next: (response) => {
          // saved
        },
        error: (err) => {
          console.error('Error creating onboarding item:', err);
        }
      });
      return;
    }

    onboarding_list = this.checks.map(c => ({ title: c.name, status: false }));

    const request_data = { onboarding_list };
    this.onboardingService.createOnboarding({ request_data }).subscribe({
      next: (response) => {
        // saved
      },
      error: (err) => {
        console.error('Error saving onboarding data:', err);
      }
    });
  }

  removeCheck(index: number) {
    const item = this.checks[index];
    this.checks.splice(index, 1);

    if (item?.id != null) {
      // delete by id using HTTP DELETE with body
      const ids = [item.id];
      this.onboardingService.deleteOnboarding({ request_data: { id: ids } }).subscribe({
        next: () => { },
        error: (err) => { console.error('Error deleting onboarding item:', err); }
      });
    } else {
      // local-only item, persist entire list
      this.printData();
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
