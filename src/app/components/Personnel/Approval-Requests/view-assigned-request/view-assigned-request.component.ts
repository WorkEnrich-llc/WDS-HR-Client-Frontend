import { Component, ViewEncapsulation, OnInit, inject } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ApprovalRequestsService } from '../service/approval-requests.service';
import { DatePipe } from '@angular/common';
import { ApprovalRequestItem } from '../../../../core/interfaces/approval-request';
import { ActivatedRoute } from '@angular/router';
import { GoogleMapsModule } from '@angular/google-maps';

@Component({
  selector: 'app-view-assigned-request',
  imports: [PageHeaderComponent, GoogleMapsModule, DatePipe],
  templateUrl: './view-assigned-request.component.html',
  styleUrl: './view-assigned-request.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ViewAssignedRequestComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private approvalService = inject(ApprovalRequestsService);
  private datePipe = inject(DatePipe);
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

  get headerTitle(): string {
    const id = this.leaveRequest1?.request_info?.id;
    return `Request #${id ?? '----'}`;
  }

  get headerCreateDate(): string {
    const created = this.leaveRequest1?.request_info?.created_at;
    return created ? this.datePipe.transform(created, 'dd/MM/yyyy') ?? '' : '';
  }

  get headerUpdateDate(): string {
    const updated = this.leaveRequest1?.request_info?.updated_at;
    return updated ? this.datePipe.transform(updated, 'dd/MM/yyyy') ?? '' : '';
  }

  getDirectManagerName(): string {
    const dm = this.leaveRequest1?.job_info?.direct_manager;
    if (!dm) {
      return '----';
    }
    if (typeof dm === 'string') {
      return dm;
    }
    return dm.name ?? '----';
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

  getReasonNote(): string {
    if (!this.leaveRequest1?.reason) {
      return 'No reason provided';
    }
    const note = this.leaveRequest1.reason.note?.trim();
    return note?.length ? note : 'No reason provided';
  }

  getLeaveBalanceLabel(): string {
    if (!this.leaveRequest1?.reason) {
      return 'Optional Reason';
    }
    return this.leaveRequest1.reason.mandatory ? 'Mandatory Reason' : 'Optional Reason';
  }

  getPermissionFlags(): string | null {
    if (this.leaveRequest1?.work_type !== 'permission') {
      return null;
    }
    const flags: string[] = [];
    if (this.leaveRequest1.permission?.late_arrive) {
      flags.push('Late arrive');
    }
    if (this.leaveRequest1.permission?.early_leave) {
      flags.push('Early leave');
    }
    return flags.length ? flags.join(' · ') : 'No permission details';
  }

  getMinutesUsed(): string | null {
    const minutes = this.leaveRequest1?.times?.minutes_used;
    if (!minutes && minutes !== 0) {
      return null;
    }
    if (minutes === 1) {
      return '1 minute used';
    }
    return `${minutes} minutes used`;
  }
}
