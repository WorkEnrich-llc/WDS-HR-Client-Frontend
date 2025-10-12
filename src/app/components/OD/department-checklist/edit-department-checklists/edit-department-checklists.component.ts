import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { DepartmentChecklistService } from 'app/core/services/od/departmentChecklist/department-checklist.service';

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
  imports: [PageHeaderComponent, ReactiveFormsModule, CommonModule,SkelatonLoadingComponent],
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
      checkName: ['', [Validators.required, Validators.maxLength(200)]],
      checkPoint: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]+$/)
      ]],
    });
  }

  ngOnInit() {
    this.getDepartmetCheck();
  }

  loadData:boolean=false;

  getDepartmetCheck() {
    this.loadData=true;
    this.departmentChecklistService.getDepartmetChecks().subscribe({
      next: (response) => {
        const list = response.data.list_items || [];

        const sortedList = list.sort((a: any, b: any) => a.ranking - b.ranking);

        // console.log(sortedList);

        this.checks = sortedList.map((item: any) => ({
          id: item.id,
          name: item.name,
          points: item.points,
          completed: false,
          editing: false
        }));
        this.loadData=false;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData=false;
      }
    });
  }


  // add new check
  addCheck() {
    if (this.checkForm.valid) {
      this.checks.forEach(item => {
        if (item.record_type !== 'delete' && item.record_type !== 'create') {
          item.record_type = 'update';
        }
      });

      this.checks.push({
        name: this.checkForm.value.checkName,
        record_type: 'create',
        ranking: this.checks.length + 1,
        points: this.checkForm.value.checkPoint,
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
          const newRanking = index + 1;

          if (item.record_type !== 'delete') {
            item.ranking = newRanking;
          }

          const payload: any = {
            record_type: item.record_type,
            name: item.name,
            ranking: item.ranking,
            points: item.points
          };

          if (item.record_type !== 'create') {
            payload.id = item.id;
          }

          return payload;
        })
      }
    };

    console.log('Raw checklist payload:', raw);

    this.departmentChecklistService.createDeptCheck(raw).subscribe({  // 👈 شيل الـ {} حوالين raw
      next: (response) => {
        console.log('Checklist saved successfully:', response);
        this.checks = response?.data?.list_items || [];
        this.deletedChecks = [];
      },
      error: (err) => {
        console.error('Error saving checklist:', err);
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
