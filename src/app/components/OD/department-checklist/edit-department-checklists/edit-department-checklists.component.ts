import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { DepartmentChecklistService } from 'app/core/services/od/departmentChecklist/department-checklist.service';

interface CheckItem {
  id: number;
  name: string;
  completed: boolean;
  editing?: boolean;
  record_type: 'create' | 'update' | 'delete';
  ranking: number;
}


@Component({
  selector: 'app-edit-department-checklists',
  imports: [PageHeaderComponent, ReactiveFormsModule, CommonModule],
  templateUrl: './edit-department-checklists.component.html',
  styleUrl: './edit-department-checklists.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditDepartmentChecklistsComponent {

  checks: CheckItem[] = [];
  deletedChecks: CheckItem[] = []; 
  showInput = false;
  checkForm: FormGroup;

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private departmentChecklistService: DepartmentChecklistService
  ) {
    this.checkForm = this.fb.group({
      checkName: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.getOnboarding();
  }

  getOnboarding() {
    this.departmentChecklistService.getDepartmetChecks().subscribe({
      next: (response) => {
        const list = response.data.object_info || [];
        this.checks = list.map((item: any, index: number) => ({
          id: item.id,
          name: item.title,
          completed: false,
          editing: false,
          record_type: 'update',
          ranking: index + 1
        }));
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

  // add new check
  addCheck() {
    if (this.checkForm.valid) {
      this.checks.forEach(item => {
        if (item.record_type !== 'delete') {
          item.record_type = 'update';
        }
      });

      this.checks.push({
        id: 0,
        name: this.checkForm.value.checkName,
        completed: false,
        record_type: 'create',
        ranking: this.checks.length + 1
      });

      this.checkForm.reset();
      this.showInput = false;

      this.printData();
    }
  }

  showAddInput() {
    this.showInput = true;
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

    this.checks.forEach(item => {
        item.record_type = 'update';
    });

    this.draggedIndex = null;
    this.dragOverIndex = null;

    this.printData();
  }


  onDragEnd() {
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

 printData() {
  const allItems = [...this.checks, ...this.deletedChecks];

  const raw = {
    request_data: {
      list_items: allItems.map((item, index) => {
        if (item.record_type !== 'delete') {
          item.ranking = index + 1;
        }

        return {
          id: item.id,
          record_type: item.record_type,
          name: item.name,
          ranking: item.ranking
        };
      })
    }
  };

  // console.log('Raw checklist payload:', raw);
   this.departmentChecklistService.createDeptCheck({ raw }).subscribe({
      next: (response) => {
        console.log('Onboarding data saved successfully:', response);
        this.checks=response?.data?.list_items||[];
      },
      error: (err) => {
        console.error('Error saving onboarding data:', err);
      }
    });
}



removeCheck(index: number) {
  const removed = this.checks[index];

  removed.record_type = 'delete';

  this.deletedChecks.push(removed);

  this.checks.splice(index, 1);

  this.checks.forEach(item => {
    if (item.record_type !== 'create' && item.record_type !== 'delete') {
      item.record_type = 'update';
    }
  });

  this.printData();
}

}
