import { Component, signal, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { Validators } from '@angular/forms';

import { SmartGridSheetComponent, TableColumn } from '../../shared/smart-grid-sheet/smart-grid-sheet.component';


@Component({
  selector: 'app-employee-template',
  imports: [PageHeaderComponent, SmartGridSheetComponent],
  templateUrl: './employee-template.component.html',
  styleUrl: './employee-template.component.css',
  encapsulation: ViewEncapsulation.None
})
export class EmployeeTemplateComponent {
 customColumns: TableColumn[] = [
  {
    name: 'Full Name',
    type: 'input',
    validators: [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/), Validators.maxLength(100)]
  },
  {
    name: 'Employee Status',
    type: 'select',
    options: ['Active', 'Inactive'],
    validators: [Validators.required]
  },
  {
    name: 'Account Status',
    type: 'select',
    options: ['Active', 'Inactive'],
    validators: [Validators.required]
  },
  {
    name: 'Job Title',
    type: 'input',
    validators: [Validators.required]
  },
  {
    name: 'Branch',
    type: 'input',
    validators: [Validators.required]
  },
  {
    name: 'Join Date',
    type: 'input',
    validators: [Validators.required]
  },
  {
    name: 'Actions',
    type: 'input'
  }
];


}
