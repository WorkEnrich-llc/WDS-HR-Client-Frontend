import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { RouterLink } from '@angular/router';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  selector: 'app-view-payroll-runs',
  imports: [CommonModule, PageHeaderComponent, TableComponent, RouterLink, OverlayFilterBoxComponent],
  templateUrl: './view-payroll-runs.component.html',
  styleUrl: './view-payroll-runs.component.css'
})
export class ViewPayrollRunsComponent {
  @ViewChild('importBox') importBox!: OverlayFilterBoxComponent;
  closeOverlays(): void {
    this.importBox?.closeOverlay();
  }
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loadData: boolean = false;
  payRollRun = {
    id: 2,
    month: 'March 2025',
    cycle: '1 February – 28 February',
    numOfEmp: 93,
    Status: 'Pending'
  };
  employees = [
    {
      id: 1,
      name: 'Ahmed Ali',
      basicSalary: 15000,
      insurance: 1200,
      absence: 500,
      damages: 200,
      bonus: 1000,
      profitShare: 750,
      overtime: 300,
      currency: 'EGP'
    },
    {
      id: 2,
      name: 'Mona Hassan',
      basicSalary: 18000,
      insurance: 1500,
      absence: 0,
      damages: 0,
      bonus: 1200,
      profitShare: 900,
      overtime: 400,
      currency: '$'
    }
  ];
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.employees = this.employees.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
      } else {
        return nameA < nameB ? 1 : (nameA > nameB ? -1 : 0);
      }
    });
  }

  selectedFile: File | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const allowedExtensions = ['xls', 'xlsx'];
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension && allowedExtensions.includes(extension)) {
        this.selectedFile = file;
      } else {
        alert('Only .xls or .xlsx files are allowed.');
        input.value = '';
      }
    }
  }

  removeFile(): void {
    this.selectedFile = null;
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
}
