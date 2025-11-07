import { Component, ViewEncapsulation, OnInit, inject } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ApprovalRequestsService } from '../service/approval-requests.service';
import { CommonModule } from '@angular/common';
import { ApprovalRequestItem } from '../../../../core/interfaces/approval-request';
import { ActivatedRoute } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-view-assigned-request',
  imports: [PageHeaderComponent, CommonModule, GoogleMapsModule],
  templateUrl: './view-assigned-request.component.html',
  styleUrl: './view-assigned-request.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ViewAssignedRequestComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private approvalService = inject(ApprovalRequestsService);
  leaveRequest1?: ApprovalRequestItem;
  requestId!: number;

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
    documents: [
      { name: 'Sick Leave', url: '#' },
      { name: 'Lab Results', url: '#' },
      { name: 'Lab Results', url: '#' }
    ],
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


  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.requestId = +params['id'];
      if (this.requestId) {
        this.approvalService.showApprovalRequest(this.requestId).subscribe((res) => {
          this.leaveRequest1 = res.data.object_info;
        });
      }
    });
  }

  displayLeaveType(): string {
    const workType = this.leaveRequest1?.work_type;
    switch (workType) {
      case 'overtime':
        return 'Overtime';
      case 'leave':
        return this.leaveRequest1?.leave?.name || 'Leave';
      case 'permission':
        if (this.leaveRequest1?.permission?.late_arrive) {
          return 'Late Arrive';
        }
        if (this.leaveRequest1?.permission?.early_leave) {
          return 'Early Leave';
        }
        return 'Permission';
      case 'mission':
        return this.leaveRequest1?.mission?.title || 'Mission';
      default:
        return this.leaveRequest1?.work_type || '-----';
    }
  }
}
