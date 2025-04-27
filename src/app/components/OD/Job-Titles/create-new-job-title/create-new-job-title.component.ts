import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';

@Component({
  selector: 'app-create-new-job-title',
  imports: [PageHeaderComponent, CommonModule, TableComponent, FormsModule, PopupComponent],
  templateUrl: './create-new-job-title.component.html',
  styleUrl: './create-new-job-title.component.css'
})
export class CreateNewJobTitleComponent {

  currentStep = 1;
  selectAll: boolean = false;

  goNext() {
    this.currentStep++;

  }

  goPrev() {
    this.currentStep--;

  }
  // section array
  sectionsData = [
    { employmentType: 'Full-time', isActive: true },
    { employmentType: 'Part-time', isActive: false },
    { employmentType: 'Per Hour', isActive: true },
  ];
  // toggle activate
  isActive = true;

  toggleStatus(item: any) {
    item.isActive = !item.isActive;
  }


  // job titles array 
  jobTitles = [
    { id: 1, name: 'Software Engineer', assigned: true },
    { id: 2, name: 'Product Manager', assigned: false },
    { id: 3, name: 'UI/UX Designer', assigned: true },
    { id: 4, name: 'Data Analyst', assigned: false },
    { id: 5, name: 'Marketing Specialist', assigned: true },
    { id: 6, name: 'Sales Representative', assigned: false },
    { id: 7, name: 'HR Manager', assigned: true },
    { id: 8, name: 'Customer Support', assigned: false },
    { id: 9, name: 'Business Analyst', assigned: true },
    { id: 10, name: 'Network Engineer', assigned: false },
    { id: 11, name: 'DevOps Engineer', assigned: true },
    { id: 12, name: 'Content Writer', assigned: false },
    { id: 13, name: 'QA Tester', assigned: true },
    { id: 14, name: 'Finance Manager', assigned: false },
    { id: 15, name: 'Graphic Designer', assigned: true }
  ];
  // job titles table sorting
  sortDirection: string = 'asc';
  currentSortColumn: string = '';

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.jobTitles = this.jobTitles.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }
  // assign job tittle toggle
  toggleAssignStatus(job: any) {
    job.assigned = !job.assigned;
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
    // logic to deactivate
  }
}
