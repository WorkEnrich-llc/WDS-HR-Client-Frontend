import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';

interface Department {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  sections: string;
  status: string;
}

@Component({
  selector: 'app-view-branches',
  imports: [PageHeaderComponent,CommonModule,TableComponent,CommonModule,PopupComponent],
  templateUrl: './view-branches.component.html',
  styleUrls: ['./view-branches.component.css']
})
export class ViewBranchesComponent {


  departments: Department[] = [
    { id: 1, name: 'Human Resources', createdAt: '9/3/2024', updatedAt: '12/3/2025', sections: '8/9 selected', status: 'Active' },
    { id: 2, name: 'Finance Department', createdAt: '10/3/2024', updatedAt: '13/3/2025', sections: '5/7 selected', status: 'Active' },
    { id: 3, name: 'IT Services', createdAt: '11/3/2024', updatedAt: '14/3/2025', sections: '3/6 selected', status: 'Not Active' },
    { id: 4, name: 'Marketing Team', createdAt: '12/3/2024', updatedAt: '15/3/2025', sections: '7/8 selected', status: 'Active' },
    { id: 5, name: 'Sales Unit', createdAt: '13/3/2024', updatedAt: '16/3/2025', sections: '4/9 selected', status: 'Active' },
    { id: 6, name: 'Logistics Department', createdAt: '14/3/2024', updatedAt: '17/3/2025', sections: '2/5 selected', status: 'Not Active' },
    { id: 7, name: 'Procurement Team', createdAt: '15/3/2024', updatedAt: '18/3/2025', sections: '6/6 selected', status: 'Active' },
    { id: 8, name: 'Legal Affairs', createdAt: '16/3/2024', updatedAt: '19/3/2025', sections: '1/3 selected', status: 'Active' },
    { id: 9, name: 'Operations', createdAt: '17/3/2024', updatedAt: '20/3/2025', sections: '9/10 selected', status: 'Not Active' },
    { id: 10, name: 'Customer Service', createdAt: '18/3/2024', updatedAt: '21/3/2025', sections: '8/8 selected', status: 'Active' },
    { id: 11, name: 'Research and Development', createdAt: '19/3/2024', updatedAt: '22/3/2025', sections: '4/6 selected', status: 'Active' },
    { id: 12, name: 'Public Relations', createdAt: '20/3/2024', updatedAt: '23/3/2025', sections: '5/5 selected', status: 'Active' },
  ];
  


  sortDirection: string = 'asc';
  currentSortColumn: string = '';
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
