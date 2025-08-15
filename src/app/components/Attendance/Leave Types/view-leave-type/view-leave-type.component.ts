import { Component, ElementRef, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { CommonModule, DatePipe } from '@angular/common';
import { LeaveTypeService } from '../../../../core/services/attendance/leave-type/leave-type.service';

@Component({
  selector: 'app-view-leave-type',
  imports: [PageHeaderComponent, RouterLink, PopupComponent, CommonModule],
  providers: [DatePipe],
  templateUrl: './view-leave-type.component.html',
  styleUrl: './view-leave-type.component.css'
})
export class ViewLeaveTypeComponent {
  constructor(private _LeaveTypeService: LeaveTypeService, private route: ActivatedRoute, private datePipe: DatePipe) { }

  leaveTypeData: any =[];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  leaveId: string | null = null;
  ngOnInit(): void {
    this.leaveId = this.route.snapshot.paramMap.get('id');
    // this.getLeaveJob(Number(this.leaveId));
    if (this.leaveId) {
      this.getLeaveJob(Number(this.leaveId));
    }
  }


  getLeaveJob(leaveId: number) {

    this._LeaveTypeService.showLeaveType(leaveId).subscribe({
      next: (response) => {
        this.leaveTypeData = response.data.object_info;
        const created = this.leaveTypeData?.created_at;
        const updated = this.leaveTypeData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }
        // console.log(this.leaveTypeData);

      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
  // show more text
  isExpanded = false;


  toggleText() {
    this.isExpanded = !this.isExpanded;
  }

  // activate and deactivate

  deactivateOpen = false;
  activateOpen = false;
  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  confirmDeactivate() {
    this.deactivateOpen = false;

    const deptStatus = {
      request_data: {
        status: false
      }
    };

    this._LeaveTypeService.updateLeaveStatus(this.leaveTypeData.id, deptStatus).subscribe({
      next: (response) => {
        this.leaveTypeData = response.data.object_info;
        // console.log(this.departmentData);
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }
  confirmActivate() {
    this.activateOpen = false;
    const deptStatus = {
      request_data: {
        status: true
      }
    };

    this._LeaveTypeService.updateLeaveStatus(this.leaveTypeData.id, deptStatus).subscribe({
      next: (response) => {
        this.leaveTypeData = response.data.object_info;
        // console.log(this.departmentData);
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
}
