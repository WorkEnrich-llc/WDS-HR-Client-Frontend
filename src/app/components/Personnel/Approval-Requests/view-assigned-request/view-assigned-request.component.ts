import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-assigned-request',
  imports: [PageHeaderComponent,CommonModule],
  templateUrl: './view-assigned-request.component.html',
  styleUrl: './view-assigned-request.component.css',
  encapsulation:ViewEncapsulation.None
})
export class ViewAssignedRequestComponent {
 leaveRequest = {
  requestId: 12,
  createdAt: new Date('2023-06-13'),
  updatedAt: new Date('2024-12-03'),
  contactInfo: {
    id: '0012',
    fullName: 'Ahmed Magdy',
    phoneNumber: '0101234567',
    personalEmail: 'ahmed.123@gmail.com',
  },
  jobInfo: {
    jobTitle: 'UI/UX Designer',
    employmentType: 'Full-Time',
    section: 'UI/UX Design Section',
    department: 'Product Design Department',
    branch: 'Head Office – Cairo',
    directManager: 'Ahmed Hamed',
    isNewJoiner: true,
  },
  requestInfo: {
    requestId: 1,
    requestedAt: new Date('2025-08-02'),
    leaveType: 'Sick Leave',
    dateRange: {
      from: new Date('2025-08-02'),
      to: new Date('2025-08-20'),
    },
    leaveBalance: 12,
    status: 'Pending',
  },
  steps: [
    {
      stepNumber: 1,
      stepName: "Direct Manager's Approval",
      approverType: 'Mandatory',
      approverRole: 'Direct Manager',
      approverName: 'Ahmed Magdy',
      status: 'Accepted',
    },
    {
      stepNumber: 2,
      stepName: 'HR Approval',
      approverType: 'Optional',
      approverRole: 'HR Personnel',
      approverName: 'Alaa Assem',
      status: 'Rejected',
    },
    {
      stepNumber: 3,
      stepName: 'CEO Approval',
      approverType: 'Mandatory',
      approverRole: 'CEO',
      approverName: 'Essam Ahmed',
      status: 'Pending',
    },
  ],
};

}
