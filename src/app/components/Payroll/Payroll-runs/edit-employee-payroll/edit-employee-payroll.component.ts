import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';

import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgClass } from '@angular/common';
type Employee = {
  id: number;
  name: string;
  basicSalary: number;
  insurance: number;
  absence: number;
  damages: number;
  bonus: number;
  profitShare: number;
  overtime: number;
  currency: string;
};

@Component({
  selector: 'app-edit-employee-payroll',
  imports: [PageHeaderComponent, FormsModule, NgClass, DecimalPipe],
  templateUrl: './edit-employee-payroll.component.html',
  styleUrls: ['./../../../shared/table/table.component.css', './edit-employee-payroll.component.css']
})
export class EditEmployeePayrollComponent {

  ngOnInit() {
    this.validateAll();
  }
  editableFields: (keyof Employee)[] = [
    'insurance',
    'absence',
    'damages',
    'bonus',
    'profitShare',
    'overtime',
  ];
  errors: { [key: number]: Partial<Record<keyof Employee, boolean>> } = {};

  validatePositive(index: number, field: keyof Employee) {
    const emp = this.employees[index];
    if (!emp) return;

    const value = emp[field];
    const numericValue = Number(value);

    const hasError = value === '' || isNaN(numericValue) || numericValue < 0;

    const currentErrors = this.errors[index] ?? {};
    currentErrors[field] = hasError;

    this.errors = {
      ...this.errors,
      [index]: currentErrors
    };
  }

  hasError(index: number, field: keyof Employee): boolean {
    return !!(this.errors[index]?.[field]);
  }


  validateAll() {
    this.employees.forEach((emp, index) => {
      this.editableFields.forEach((field) => {
        this.validatePositive(index, field);
      });
    });
  }


  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  loadData: boolean = false;
  employees: Employee[] = [
    {
      id: 1,
      name: 'Ahmed Ali',
      basicSalary: 15000,
      insurance: 1200,
      absence: 500,
      damages: -200,
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
