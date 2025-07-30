import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-template',
  imports: [PageHeaderComponent, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './employee-template.component.html',
  styleUrl: './employee-template.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EmployeeTemplateComponent {
  spreadsheetForm!: FormGroup;
  rows = 20;
  columns = ['Full Name', 'Employee Status', 'Account Status', 'Job Title', 'Branch', 'Join Date', 'Actions', 'H'];

  employeeStatusOptions = ['Active', 'Inactive', 'On Leave'];
  accountStatusOptions = ['Verified', 'Pending', 'Suspended'];
  jobTitleOptions = ['Manager', 'Developer', 'Designer'];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.spreadsheetForm = this.fb.group({
      rows: this.fb.array([]),
    });

    for (let i = 0; i < this.rows; i++) {
      this.addRow();
    }
  }

  get rowsFormArray(): FormArray {
    return this.spreadsheetForm.get('rows') as FormArray;
  }

  addRow(): void {
    const row = this.fb.group({
      fullName: [''],
      employeeStatus: ['', Validators.required],
      accountStatus: ['', Validators.required],
      jobTitle: ['', Validators.required],
      branch: [''],
      joinDate: [''],
      actions: [''],
      h: [''],
    });

    this.rowsFormArray.push(row);
  }
}
