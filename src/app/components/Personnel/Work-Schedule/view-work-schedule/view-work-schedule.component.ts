import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { TableComponent } from '../../../shared/table/table.component';

@Component({
  selector: 'app-view-work-schedule',
  imports: [PageHeaderComponent,CommonModule,RouterLink,PopupComponent,TableComponent],
  templateUrl: './view-work-schedule.component.html',
  styleUrl: './view-work-schedule.component.css'
})
export class ViewWorkScheduleComponent {
 sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.departments = this.departments.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }
 onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    // this.getAllDepartment(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    // this.getAllDepartment(this.currentPage);
  }
  
 departments = [
  { id: 1, name: 'Human Resources', status: 'active' },
  { id: 2, name: 'Finance', status: 'inactive' },
  { id: 3, name: 'Engineering', status: 'active' },
  { id: 4, name: 'Marketing', status: 'inactive' },
  { id: 5, name: 'Customer Support', status: 'active' },
  { id: 6, name: 'IT Department', status: 'active' },
  { id: 7, name: 'Legal Affairs', status: 'inactive' },
  { id: 8, name: 'Research & Development', status: 'active' }
];

// show more text
 isExpanded = false;

  toggleText() {
    this.isExpanded = !this.isExpanded;
  }

  // activate and deactivate
  
  deactivateOpen = false;
  activateOpen = false;
  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  confirmDeactivate() {
    this.deactivateOpen = false;

    const deptStatus = {
      request_data: {
        status: false
      }
    };

    // this._DepartmentsService.updateDeptStatus(this.departmentData.id, deptStatus).subscribe({
    //   next: (response) => {
    //     this.departmentData = response.data.object_info;
    //     // console.log(this.departmentData);

    //     this.sortDirection = 'desc';
    //     this.sortBy('id');
    //   },
    //   error: (err) => {
    //     console.log(err.error?.details);
    //   }
    // });
  }

  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }
  confirmActivate() {
    this.activateOpen = false;
     const deptStatus = {
      request_data: {
        status: true
      }
    };

    // this._DepartmentsService.updateDeptStatus(this.departmentData.id, deptStatus).subscribe({
    //   next: (response) => {
    //     this.departmentData = response.data.object_info;
    //     // console.log(this.departmentData);

    //     this.sortDirection = 'desc';
    //     this.sortBy('id');
    //   },
    //   error: (err) => {
    //     console.log(err.error?.details);
    //   }
    // });
  }

}
