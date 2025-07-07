import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { TableComponent } from '../../../shared/table/table.component';
import { WorkSchaualeService } from '../../../../core/services/personnel/work-schaduale/work-schauale.service';

@Component({
  selector: 'app-view-work-schedule',
  imports: [PageHeaderComponent, CommonModule, RouterLink, PopupComponent, TableComponent],
  providers: [DatePipe],
  templateUrl: './view-work-schedule.component.html',
  styleUrl: './view-work-schedule.component.css'
})
export class ViewWorkScheduleComponent {

  constructor(private _WorkSchaualeService: WorkSchaualeService, private route: ActivatedRoute, private datePipe: DatePipe) { }
  workScduleData: any = [];
  workingDays: string[] = [];
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  workId: string | null = null;
  departments: any[] = [];

  ngOnInit(): void {
    this.workId = this.route.snapshot.paramMap.get('id');
    if (this.workId) {
      this.getWorkSchedule(Number(this.workId));
    }
  }


  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.departments = this.departments.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();

      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
      } else {
        return nameA < nameB ? 1 : (nameA > nameB ? -1 : 0);
      }
    });
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    // this.getAllDepartment(this.currentPage);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // this.getAllDepartment(this.currentPage);
  }




  getWorkSchedule(workId: number) {

    this._WorkSchaualeService.showWorkSchedule(workId).subscribe({
      next: (response) => {
        this.workScduleData = response.data.object_info;
        const created = this.workScduleData?.created_at;
        const updated = this.workScduleData?.updated_at;
        this.departments = this.workScduleData.departments;
        const days = this.workScduleData.system?.days;
        if (days) {
          const orderedDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          this.workingDays = orderedDays
            .filter(day => days[day])
            .map(day => day.charAt(0).toUpperCase() + day.slice(1));
        }
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }
        // console.log(this.workScduleData);

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

    this._WorkSchaualeService.updateWorkStatus(this.workScduleData.id, deptStatus).subscribe({
      next: (response) => {
        this.workScduleData = response.data.object_info;

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

    this._WorkSchaualeService.updateWorkStatus(this.workScduleData.id, deptStatus).subscribe({
      next: (response) => {
        this.workScduleData = response.data.object_info;

      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

}
