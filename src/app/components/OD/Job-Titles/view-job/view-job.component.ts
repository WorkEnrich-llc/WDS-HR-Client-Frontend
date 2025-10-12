import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { JobsService } from '../../../../core/services/od/jobs/jobs.service';
import { DatePipe } from '@angular/common';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';

@Component({
  selector: 'app-view-job',
  imports: [PageHeaderComponent, RouterLink,SkelatonLoadingComponent, PopupComponent],
  providers: [DatePipe],
  templateUrl: './view-job.component.html',
  styleUrl: './view-job.component.css'
})
export class ViewJobComponent {

  constructor(private _JobsService: JobsService, private route: ActivatedRoute, private datePipe: DatePipe) { }
  jobTitleData: any = { sections: [] };
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  jobId: string | null = null;
  ngOnInit(): void {
    this.jobId = this.route.snapshot.paramMap.get('id');
    // this.getJobTitle(Number(this.jobId));
    if (this.jobId) {
      this.getJobTitle(Number(this.jobId));
    }
  }

  loadData:boolean=false;
  getJobTitle(jobId: number) {
    this.loadData=true;
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
        this.loadData=false;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData=false;
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
