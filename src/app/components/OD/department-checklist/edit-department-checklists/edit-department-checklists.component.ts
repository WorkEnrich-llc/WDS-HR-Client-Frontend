import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';

interface CheckItem {
  name: string;
  completed: boolean;
  editing?: boolean;
}

@Component({
  selector: 'app-edit-department-checklists',
  imports: [PageHeaderComponent, ReactiveFormsModule, CommonModule],
  templateUrl: './edit-department-checklists.component.html',
  styleUrl: './edit-department-checklists.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EditDepartmentChecklistsComponent {
  checks: CheckItem[] = [
    { name: 'Verify department goals are documented', completed: false },
    { name: 'Ensure team members are assigned tasks', completed: false },
    { name: 'Confirm budget allocation is approved', completed: false },
    { name: 'Review department KPIs', completed: false },
    { name: 'Schedule weekly progress meeting', completed: false }
  ];

  checkForm: FormGroup;
  showInput = false; 
  constructor(private router: Router, private fb: FormBuilder) {
    this.checkForm = this.fb.group({
      checkName: ['', Validators.required]
    });
  }

  ngOnInit() {
    // this.getOnboarding();
  }

  getOnboarding() {
    /*
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
        console.log(err.error?.details);
      }
    });
    */
  }

  // add new check
  addCheck() {
    if (this.checkForm.valid) {
      this.checks.push({
        name: this.checkForm.value.checkName,
        completed: false
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

    this.draggedIndex = null;
    this.dragOverIndex = null;

    this.printData();
  }

  onDragEnd() {
    this.draggedIndex = null;
    this.dragOverIndex = null;
  }

  printData() {
    /*
    const request_data = {
      onboarding_list: this.checks.map(c => ({
        title: c.name,
        status: true
      }))
    };
    this.onboardingService.createOnboarding({ request_data }).subscribe({
      next: (response) => {
        console.log('Onboarding data saved successfully:', response);
      },
      error: (err) => {
        console.error('Error saving onboarding data:', err);
      }
    });
    */
    console.log('Current checklist (local only):', this.checks);
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
}
