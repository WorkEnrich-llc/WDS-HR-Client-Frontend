import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { CommonModule, DatePipe } from '@angular/common';
import { RestrictedService } from '../../../../core/services/attendance/restricted-days/restricted.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';

@Component({
  selector: 'app-view-restricted-days',
  imports: [PageHeaderComponent, RouterLink, PopupComponent, CommonModule],
  providers: [DatePipe],
  templateUrl: './view-restricted-days.component.html',
  styleUrl: './view-restricted-days.component.css'
})
export class ViewRestrictedDaysComponent {

  constructor(private _RestrictedService: RestrictedService,private toasterMessageService:ToasterMessageService, private route: ActivatedRoute, private datePipe: DatePipe) { }
  
  resterictedDayData: any = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  dayId: string | null = null;
  ngOnInit(): void {
    this.dayId = this.route.snapshot.paramMap.get('id');
    if (this.dayId) {
      this.getRestrictedDay(Number(this.dayId));
    }
  }
  getRestrictedDay(dayId: number) {

    this._RestrictedService.showRestrictedDay(dayId).subscribe({
      next: (response) => {
        this.resterictedDayData = response.data.object_info;
        const created = this.resterictedDayData?.created_at;
        const updated = this.resterictedDayData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }

      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
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

    this._RestrictedService.updateRestrictedDayStatus(this.resterictedDayData.id, deptStatus).subscribe({
      next: (response) => {
        this.resterictedDayData = response.data.object_info;
        this.toasterMessageService.showSuccess("Restricted Days Status Updated successfully","Updated Successfully");
      },
      error: (err) => {
        console.error(err.error?.details);
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

    this._RestrictedService.updateRestrictedDayStatus(this.resterictedDayData.id, deptStatus).subscribe({
      next: (response) => {
        this.resterictedDayData = response.data.object_info;
        this.toasterMessageService.showSuccess("Restricted Days Status Updated successfully","Updated Successfully");
      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
  }
}
