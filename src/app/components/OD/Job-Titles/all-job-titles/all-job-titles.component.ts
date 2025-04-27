import { Component, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from './../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from './../../../shared/overlay-filter-box/overlay-filter-box.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-all-job-titles',
  imports: [PageHeaderComponent,RouterLink,TableComponent,OverlayFilterBoxComponent,CommonModule],
  templateUrl: './all-job-titles.component.html',
  styleUrl: './all-job-titles.component.css'
})
export class AllJobTitlesComponent {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;



  jobs: any[] = [
    {
      id: 1,
      name: 'Software Engineer',
      managementLevel: 'Junior',
      department: 'IT',
      directManagerId: 101,
      directManagerName: 'Ahmed Hassan'
    },
    {
      id: 2,
      name: 'Project Manager',
      managementLevel: 'Senior',
      department: 'Operations',
      directManagerId: 102,
      directManagerName: 'Sara Ali'
    },
    {
      id: 3,
      name: 'Marketing Specialist',
      managementLevel: 'Mid',
      department: 'Marketing',
      directManagerId: 103,
      directManagerName: 'Khaled Omar'
    },
    {
      id: 4,
      name: 'HR Officer',
      managementLevel: 'Junior',
      department: 'Human Resources',
      directManagerId: 104,
      directManagerName: 'Mona Youssef'
    },
    {
      id: 5,
      name: 'Sales Executive',
      managementLevel: 'Mid',
      department: 'Sales',
      directManagerId: 105,
      directManagerName: 'Nader Samir'
    },
    {
      id: 6,
      name: 'Finance Analyst',
      managementLevel: 'Mid',
      department: 'Finance',
      directManagerId: 106,
      directManagerName: 'Laila Farouk'
    },
    {
      id: 7,
      name: 'Network Administrator',
      managementLevel: 'Senior',
      department: 'IT',
      directManagerId: 101,
      directManagerName: 'Ahmed Hassan'
    },
    {
      id: 8,
      name: 'Content Writer',
      managementLevel: 'Junior',
      department: 'Marketing',
      directManagerId: 103,
      directManagerName: 'Khaled Omar'
    },
    {
      id: 9,
      name: 'Business Development Manager',
      managementLevel: 'Senior',
      department: 'Business Development',
      directManagerId: 107,
      directManagerName: 'Rania Adel'
    },
    {
      id: 10,
      name: 'Customer Support Representative',
      managementLevel: 'Junior',
      department: 'Customer Support',
      directManagerId: 108,
      directManagerName: 'Tamer Fathy'
    },
    {
      id: 11,
      name: 'Quality Assurance Engineer',
      managementLevel: 'Mid',
      department: 'IT',
      directManagerId: 101,
      directManagerName: 'Ahmed Hassan'
    }
  ];


  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.jobs = this.jobs.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }
}
