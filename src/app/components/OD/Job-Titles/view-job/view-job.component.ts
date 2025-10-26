import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { DatePipe } from '@angular/common';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';

@Component({
  selector: 'app-view-job',
  imports: [PageHeaderComponent, RouterLink, SkelatonLoadingComponent, PopupComponent],
  providers: [DatePipe],
  templateUrl: './view-job.component.html',
  styleUrl: './view-job.component.css'
})
export class ViewJobComponent {

  constructor(private _JobsService: JobsService, private route: ActivatedRoute, private datePipe: DatePipe, private subService: SubscriptionService) { }
  jobTitleData: any = { sections: [] };
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  jobId: string | number | null = null;

  jobTitleSub: any;

  ngOnInit(): void {
    // subscription data
    this.subService.subscription$.subscribe(sub => {
      this.jobTitleSub = sub?.Branches;
      // if (this.jobTitleSub) {
      //   console.log("info:", this.jobTitleSub.info);
      //   console.log("create:", this.jobTitleSub.create);
      //   console.log("update:", this.jobTitleSub.update);
      //   console.log("delete:", this.jobTitleSub.delete);
      // }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.jobId = Number(id);
        this.getJobTitle(this.jobId);
      }
    });
  }

  loadData: boolean = false;
  getJobTitle(jobId: number) {
    this.loadData = true;
    this._JobsService.showJobTitle(jobId).subscribe({
      next: (response) => {
        this.jobTitleData = response.data.object_info;
        const created = this.jobTitleData?.created_at;
        const updated = this.jobTitleData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }

        // console.log(this.jobTitleData);

        this.sortDirection = 'desc';
        this.sortBy('id');
        this.loadData = false;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  sortBy(column: string) {
    if (this.currentSortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.jobTitleData.sections && Array.isArray(this.jobTitleData.sections)) {
      this.jobTitleData.sections = [...this.jobTitleData.sections].sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];

        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }




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

    this._JobsService.updateJobStatus(this.jobTitleData.id, deptStatus).subscribe({
      next: (response) => {
        this.jobTitleData = response.data.object_info;
        // console.log(this.departmentData);

        this.sortDirection = 'desc';
        this.sortBy('id');
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

    this._JobsService.updateJobStatus(this.jobTitleData.id, deptStatus).subscribe({
      next: (response) => {
        this.jobTitleData = response.data.object_info;
        // console.log(this.departmentData);

        this.sortDirection = 'desc';
        this.sortBy('id');
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
}
