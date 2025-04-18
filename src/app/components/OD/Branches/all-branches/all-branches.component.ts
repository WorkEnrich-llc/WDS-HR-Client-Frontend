import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../compo/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-all-branches',
  imports: [PageHeaderComponent,CommonModule,FormsModule,NgxPaginationModule],
  templateUrl: './all-branches.component.html',
  styleUrl: './all-branches.component.css'
})
export class AllBranchesComponent {
  branches = [
    { id: 1, name: 'Branch One', location: 'Cairo', maxEmployees: 30, createdAt: '9/3/2024', updatedAt: '12/3/2025', status: 'Active' },
    { id: 2, name: 'North Jeddah Branch', location: 'Jeddah', maxEmployees: 35, createdAt: '9/3/2024', updatedAt: '12/3/2025', status: 'Active' },
    { id: 3, name: 'Rabat Downtown', location: 'Rabat', maxEmployees: 46, createdAt: '9/3/2024', updatedAt: '12/3/2025', status: 'Inactive' },
    { id: 4, name: 'Alex Main Branch', location: 'Alexandria', maxEmployees: 28, createdAt: '10/3/2024', updatedAt: '1/4/2025', status: 'Active' },
    { id: 5, name: 'Dubai HQ', location: 'Dubai', maxEmployees: 55, createdAt: '11/3/2024', updatedAt: '3/4/2025', status: 'Active' },
    { id: 6, name: 'Kuwait Office', location: 'Kuwait', maxEmployees: 32, createdAt: '13/3/2024', updatedAt: '4/4/2025', status: 'Inactive' },
    { id: 7, name: 'Doha Service Point', location: 'Doha', maxEmployees: 25, createdAt: '14/3/2024', updatedAt: '5/4/2025', status: 'Active' },
    { id: 8, name: 'Tunis City Branch', location: 'Tunis', maxEmployees: 40, createdAt: '15/3/2024', updatedAt: '6/4/2025', status: 'Active' },
    { id: 9, name: 'Beirut Branch', location: 'Beirut', maxEmployees: 27, createdAt: '16/3/2024', updatedAt: '7/4/2025', status: 'Inactive' },
    { id: 10, name: 'Tripoli Office', location: 'Tripoli', maxEmployees: 22, createdAt: '17/3/2024', updatedAt: '8/4/2025', status: 'Active' },
    { id: 11, name: 'Riyadh East', location: 'Riyadh', maxEmployees: 38, createdAt: '18/3/2024', updatedAt: '9/4/2025', status: 'Active' },
    { id: 12, name: 'Manama Finance Center', location: 'Manama', maxEmployees: 33, createdAt: '19/3/2024', updatedAt: '10/4/2025', status: 'Active' },
  ];
  

  currentPage = 1;
  itemsPerPage = 10;
  sortAscending = true;

  get paginatedBranches() {
    return this.branches.sort((a, b) =>
      this.sortAscending ? a.id - b.id : b.id - a.id
    );
  }

  sortBy(field: string) {
    this.sortAscending = !this.sortAscending;
  }
}
