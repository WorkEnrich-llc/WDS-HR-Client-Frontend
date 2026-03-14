
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { PopupComponent } from 'app/components/shared/popup/popup.component';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { DepartmentChecklistService } from 'app/core/services/od/departmentChecklist/department-checklist.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';

export interface CheckItem {
  id?: number;
  name: string;
  points?: number;
  editing?: boolean;
  completed?: boolean;
  record_type: 'create' | 'update' | 'delete';
  ranking: number;
  /** Inline edit validation error (same as onboarding) */
  error?: string | null;
  /** Snapshot when entering edit mode (to skip save if unchanged) */
  _originalName?: string;
  _originalPoints?: number;
}

@Component({
  selector: 'app-edit-department-checklists',
  imports: [PageHeaderComponent, ReactiveFormsModule, FormsModule, SkelatonLoadingComponent, PopupComponent],
  templateUrl: './edit-department-checklists.component.html',
  styleUrl: './edit-department-checklists.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditDepartmentChecklistsComponent {

  checks: CheckItem[] = [];
  deletedChecks: CheckItem[] = [];
  checkForm: FormGroup;

  /** Selection validation message (same UX as onboarding) */
  selectionError: string | null = null;

  /** Delete confirmation modal */
  isDeleteModalOpen = false;

  // queue operations
  private operationQueue$ = new Subject<void>();

  get hasSelectedChecks(): boolean {
    return this.checks.some(c => c.completed);
  }

  get selectedChecksCount(): number {
    return this.checks.filter(c => c.completed).length;
  }

  constructor(
    private fb: FormBuilder,
    private departmentChecklistService: DepartmentChecklistService,
    private toaster: ToasterMessageService
  ) {
    this.checkForm = this.fb.group({
      checkName: ['', [Validators.required, Validators.maxLength(100), this.noWhitespaceValidator]],
      checkPoint: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.max(9999)]],
    });

    // Queue ensures sequential saves
    this.operationQueue$
      .pipe(concatMap(() => this.saveChecklist()))
      .subscribe({
        next: (response: any) => {
          const updatedList = response.data?.list_items ?? response?.list_items ?? response ?? [];

          this.checks = this.checks
            .map(localItem => {
              const serverItem = Array.isArray(updatedList)
                ? updatedList.find((srv: any) => srv.id === localItem.id || (localItem.record_type === 'create' && String(srv.name) === String(localItem.name)))
                : null;
              return serverItem
                ? {
                  ...localItem,
                  id: serverItem.id,
                  name: serverItem.name,
                  points: serverItem.points,
                  ranking: serverItem.ranking,
                  record_type: 'update' as const,
                  editing: false,
                  completed: false
                }
                : localItem;
            })
            .filter(item => !this.deletedChecks.some(d => d.id === item.id));

          const confirmedDeleted = Array.isArray(updatedList)
            ? updatedList.filter((item: any) => item.record_type === 'delete').map((item: any) => item.id)
            : [];
          this.deletedChecks = this.deletedChecks.filter(d => !confirmedDeleted.includes(d.id));

          this.toaster.showSuccess('Checklist saved successfully');
        },
        error: (err) => {
          console.error('Error saving checklist', err);
          this.toaster.showError(err?.error?.message ?? 'Failed to save checklist');
        }
      });


  }

  // private toCheckItem(item: any): CheckItem {
  //   return {
  //     id: item.id,
  //     name: item.name,
  //     points: item.points,
  //     ranking: item.ranking,
  //     record_type: 'update',
  //     editing: false
  //   };
  // }


  noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    return !isWhitespace ? null : { whitespace: true };
  }

  ngOnInit() {
    this.getDepartmetCheck();
  }

  loadData: boolean = false;

  // Load existing checklist
  getDepartmetCheck() {
    this.loadData = true;
    this.departmentChecklistService.getDepartmetChecks().subscribe({
      next: (response) => {
        const list = response.data.list_items || [];
        const sortedList = list.sort((a: any, b: any) => a.ranking - b.ranking);

        this.checks = sortedList.map((item: any) => ({
          id: item.id,
          name: item.name,
          points: item.points,
          completed: false,
          editing: false,
          record_type: 'update',
          ranking: item.ranking
        }));

        this.loadData = false;
      },
      error: (err) => {
        console.error(err.error?.details);
        this.loadData = false;
      }
    });
  }

  // Add new checklist item
  addCheck() {
    this.checkForm.markAllAsTouched();
    if (!this.checkForm.valid) return;

    // Update only existing items
    this.checks.forEach(item => {
      if (item.record_type !== 'create' && item.record_type !== 'delete') {
        item.record_type = 'update';
      }
    });

    const newCheck: CheckItem = {
      name: this.checkForm.value.checkName,
      points: this.checkForm.value.checkPoint,
      record_type: 'create',
      ranking: this.checks.length + 1,
    };
    this.checks.push(newCheck);

    this.checkForm.reset();

    this.queueSave();
  }

  // Drag & drop
  draggedIndex: number | null = null;
  dragOverIndex: number | null = null;

  onDragStart(index: number) { this.draggedIndex = index; }
  allowDrop(event: DragEvent, index: number) { event.preventDefault(); this.dragOverIndex = index; }

  onDrop(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    if (this.draggedIndex === null) return;

    const draggedItem = this.checks[this.draggedIndex];
    this.checks.splice(this.draggedIndex, 1);
    this.checks.splice(dropIndex, 0, draggedItem);

    this.checks.forEach(item => {
      if (item.id && item.record_type !== 'delete') {
        item.record_type = 'update';
      }
    });

    this.draggedIndex = null;
    this.dragOverIndex = null;

    this.queueSave();
  }


  onDragEnd() { this.draggedIndex = null; this.dragOverIndex = null; }

  // Toggle checkbox (same as onboarding)
  toggleCheck(index: number): void {
    this.checks[index].completed = !this.checks[index].completed;
    if (this.hasSelectedChecks) {
      this.selectionError = null;
    }
  }

  showSelectionErrorMsg(message: string): void {
    this.selectionError = message;
    setTimeout(() => {
      this.selectionError = null;
    }, 3500);
  }

  // Edit selected items (same as onboarding)
  startEditSelected(): void {
    if (!this.hasSelectedChecks) {
      this.showSelectionErrorMsg('Please select at least one item to edit.');
      return;
    }
    this.checks.forEach(c => {
      if (c.completed) {
        c.editing = true;
        c._originalName = c.name;
        c._originalPoints = c.points ?? 0;
      }
    });
  }

  // Delete selected: open modal (same as onboarding)
  deleteSelected(): void {
    if (!this.hasSelectedChecks) {
      this.showSelectionErrorMsg('Please select at least one item to delete.');
      return;
    }
    this.openDeleteModal();
  }

  openDeleteModal(): void {
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen = false;
  }

  confirmDelete(): void {
    const selected = this.checks.filter(c => c.completed);
    this.checks = this.checks.filter(c => !c.completed);
    selected.forEach(item => {
      if (item.id != null) {
        item.record_type = 'delete';
        this.deletedChecks.push(item);
      }
    });
    this.queueSave();
    this.closeDeleteModal();
  }

  // Save on blur (same behaviour as onboarding finishEdit)
  finishEdit(check: CheckItem): void {
    const name = (check.name ?? '').trim();
    const points = check.points;

    if (!name) {
      check.error = 'Checklist Item is required and cannot be only spaces.';
      check.editing = true;
      return;
    }
    if (name.length > 100) {
      check.error = 'Checklist Item maxlength is 100 characters only.';
      check.editing = true;
      return;
    }
    const numPoints = points != null ? Number(points) : NaN;
    if (Number.isNaN(numPoints) || numPoints < 0 || numPoints > 9999) {
      check.error = 'Points must be a number between 0 and 9999.';
      check.editing = true;
      return;
    }

    check.error = null;
    const origName = (check._originalName ?? '').trim();
    const origPoints = check._originalPoints ?? 0;
    const nameChanged = name !== origName;
    const pointsChanged = numPoints !== origPoints;

    check.name = name;
    check.points = numPoints;
    check.editing = false;
    check.completed = false;

    if (!nameChanged && !pointsChanged) {
      return;
    }

    if (check.record_type !== 'create') check.record_type = 'update';
    this.queueSave();
  }

  // Remove checklist item (single; kept for any direct use, bulk delete uses confirmDelete)
  removeCheck(index: number) {
    const removed = this.checks[index];

    this.checks.splice(index, 1);

    if (removed.id) {
      removed.record_type = 'delete';
      this.deletedChecks.push(removed);
    }

    this.checks.forEach(item => {
      if (item.record_type !== 'create') {
        item.record_type = 'update';
      }
    });
    this.queueSave();
  }



  // Queue a save operation
  private queueSave() {
    this.operationQueue$.next();
  }


  // Save checklist to backend (payload matches API: id for all, record_type create/update/delete)
  private saveChecklist() {
    const allItems = [...this.checks, ...this.deletedChecks];

    const raw = {
      request_data: {
        list_items: allItems.map((item, index) => {
          const ranking = index + 1;
          const payload: any = {
            id: item.record_type === 'create' ? 0 : (item.id ?? 0),
            record_type: item.record_type,
            name: item.name,
            ranking,
            points: item.points ?? 0
          };
          return payload;
        })
      }
    };

    return this.departmentChecklistService.createDeptCheck(raw).pipe(
      concatMap((response: any) => {
        const updatedList = response.data?.list_items || response;

        updatedList.forEach((item: any) => {
          const local = this.checks.find(c => c.record_type === 'create' && !c.id && c.name === item.name);
          if (local) {
            local.id = item.id;
            local.record_type = 'update';
          }
        });

        return [response];
      })
    );
  }



}
