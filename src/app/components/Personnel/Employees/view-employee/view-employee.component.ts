import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-employee',
  imports: [PageHeaderComponent,CommonModule],
  templateUrl: './view-employee.component.html',
  styleUrl: './view-employee.component.css'
})
export class ViewEmployeeComponent {
  employeeData={
    id: 3,
    name: "Michael Brown",
    employeeStatus: "Employed",
    accountStatus: "active",
    jobTitle: "UI/UX Designer",
    branch: "Berlin",
    joinDate: "2023-09-23"
  }
}
