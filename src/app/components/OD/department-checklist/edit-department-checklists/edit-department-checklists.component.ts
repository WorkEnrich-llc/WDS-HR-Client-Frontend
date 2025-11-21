import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { DepartmentChecklistService } from 'app/core/services/od/departmentChecklist/department-checklist.service';
import { Subject } from 'rxjs';
import { concatMap } from 'rxjs/operators';

interface CheckItem {
  id?: number;
  name: string;
  points?: number;
  editing?: boolean;
  record_type: 'create' | 'update' | 'delete';
  ranking: number;
}

@Component({
  selector: 'app-edit-department-checklists',
  imports: [PageHeaderComponent, ReactiveFormsModule, CommonModule, SkelatonLoadingComponent],
  templateUrl: './edit-department-checklists.component.html',
  styleUrl: './edit-department-checklists.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditDepartmentChecklistsComponent {

  checks: CheckItem[] = [];
  deletedChecks: CheckItem[] = [];
  showInput = false;
  checkForm: FormGroup;

  // queue operations
  private operationQueue$ = new Subject<void>();

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private departmentChecklistService: DepartmentChecklistService
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

          const updatedList = response.data?.list_items || response;

          this.checks = this.checks
            .map(localItem => {
              const serverItem = updatedList.find((srv: any) => srv.id === localItem.id);
              return serverItem
                ? {
                  ...localItem,
                  id: serverItem.id,
                  name: serverItem.name,
                  points: serverItem.points,
                  ranking: serverItem.ranking,
                  record_type: 'update' as 'update',
                  editing: false
                }
                : localItem;
            })
            .filter(item => !this.deletedChecks.some(d => d.id === item.id));

          const confirmedDeleted = updatedList
            .filter((item: any) => item.record_type === 'delete')
            .map((item: any) => item.id);

          this.deletedChecks = this.deletedChecks.filter(
            d => !confirmedDeleted.includes(d.id)
          );
        },

        error: (err) => console.error('Error saving checklist', err)
      });


  }

  private toCheckItem(item: any): CheckItem {
    return {
      id: item.id,
      name: item.name,
      points: item.points,
      ranking: item.ranking,
      record_type: 'update',
      editing: false
    };
  }


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
    this.showInput = false;

    this.queueSave();
  }

  showAddInput() {
    this.showInput = true;
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

  // Remove checklist item
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


  // Save checklist to backend
  private saveChecklist() {
    const allItems = [...this.checks, ...this.deletedChecks];

    const raw = {
      request_data: {
        list_items: allItems.map((item, index) => {
          item.ranking = index + 1;
          const payload: any = {
            record_type: item.record_type,
            name: item.name,
            ranking: item.ranking,
            points: item.points
          };
          if (item.record_type !== 'create') payload.id = item.id;
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
