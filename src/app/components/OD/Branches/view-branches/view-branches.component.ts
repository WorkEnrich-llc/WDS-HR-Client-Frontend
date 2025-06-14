import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule, DatePipe } from '@angular/common';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BranchesService } from '../../../../core/services/od/branches/branches.service';

interface Department {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  sections: string;
  status: string;
}

@Component({
  selector: 'app-view-branches',
  imports: [PageHeaderComponent, CommonModule, TableComponent, CommonModule, PopupComponent, RouterLink],
  providers: [DatePipe],
  templateUrl: './view-branches.component.html',
  styleUrls: ['./view-branches.component.css']
})
export class ViewBranchesComponent {


  constructor(private _BranchesService: BranchesService, private route: ActivatedRoute, private datePipe: DatePipe) { }
  departments: Department[] = [];
  branchData: any = { sections: [] };
  formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  branchId: string | null = null;
  ngOnInit(): void {
    this.branchId = this.route.snapshot.paramMap.get('id');
    // this.showBranch(Number(this.branchId));
    if (this.branchId) {
      this.showBranch(Number(this.branchId));
    }
  }

  showBranch(branchId: number) {

    this._BranchesService.showBranch(branchId).subscribe({
      next: (response) => {
        // console.log(response);
        this.branchData = response.data.object_info;
        const created = this.branchData?.created_at;
        const updated = this.branchData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
  sortDirection: string = 'asc';
  currentSortColumn: string = '';

  sortBy(column: string) {
    this.currentSortColumn = column;
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';

    if (this.branchData.departments && Array.isArray(this.branchData.departments)) {
      this.branchData.departments = [...this.branchData.departments].sort((a, b) => {
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

    this._BranchesService.updateBranchStatus(this.branchData.id, deptStatus).subscribe({
      next: (response) => {
        this.branchData = response.data.object_info;
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

    this._BranchesService.updateBranchStatus(this.branchData.id, deptStatus).subscribe({
      next: (response) => {
        this.branchData = response.data.object_info;
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }



}
