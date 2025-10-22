import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { OnboardingService } from 'app/core/services/personnel/onboarding/onboarding.service';
interface CheckItem {
  name: string;
  completed: boolean;
  editing?: boolean;
}
@Component({
  selector: 'app-edit-onboarding',
  imports: [PageHeaderComponent, ReactiveFormsModule, CommonModule],
  templateUrl: './edit-onboarding.component.html',
  styleUrl: './edit-onboarding.component.css'
})
export class EditOnboardingComponent {
    checks: CheckItem[] = [];
  checkForm: FormGroup;
  constructor(private router: Router, private fb: FormBuilder, private onboardingService: OnboardingService) {
    this.checkForm = this.fb.group({
      checkName: ['', [Validators.required, Validators.maxLength(100)]]
    });
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
        console.log(err.error?.details);
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

  // toggle checkbox
  toggleCheck(index: number) {
    this.checks[index].completed = !this.checks[index].completed;
    this.printData();
  }

  // delete selected items
  deleteSelected() {
    this.checks = this.checks.filter(c => !c.completed);
    this.printData();
  }

  // Edit selected items
  startEditSelected() {
    this.checks.forEach(c => {
      if (c.completed) c.editing = true;
    });
  }

  finishEdit(item: CheckItem, event: any) {
    item.name = event.target.value;
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
        status: true
      }))
    };
    // console.log(JSON.stringify({ request_data }, null, 2));
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
}
