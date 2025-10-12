import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { DatePipe } from '@angular/common';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';
import { SubscriptionService } from 'app/core/services/subscription/subscription.service';
import { SkelatonLoadingComponent } from 'app/components/shared/skelaton-loading/skelaton-loading.component';

@Component({
  selector: 'app-view-departments',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, TableComponent, PopupComponent,SkelatonLoadingComponent],
  providers: [DatePipe],
  templateUrl: './view-departments.component.html',
  styleUrls: ['./view-departments.component.css']
})
export class ViewDepartmentsComponent implements OnInit {
  constructor(private _DepartmentsService: DepartmentsService,private subService:SubscriptionService, private route: ActivatedRoute,private datePipe: DatePipe) { }
  departmentData: any = { sections: [] };
formattedCreatedAt: string = '';
  formattedUpdatedAt: string = '';
  deptId: string | null = null;
  activeTab: 'sections' | 'goals' = 'sections';

setActiveTab(tab: 'sections' | 'goals') {
  this.activeTab = tab;
}
  // Table pagination properties
  loadData: boolean = false;
  totalItems: number = 0;
  totalItemsGoals: number = 0;
  itemsPerPage: number = 10;
  currentPage: number = 1;
  ngOnInit(): void {
     

    this.deptId = this.route.snapshot.paramMap.get('id');
    // this.getDepartment(Number(this.deptId));
    if (this.deptId) {
      this.getDepartment(Number(this.deptId));
    }
  }

  getDepartment(deptId: number) {
    this.loadData = true;
    
    this._DepartmentsService.showDepartment(deptId).subscribe({
      next: (response) => {
        this.departmentData = response.data.object_info;
        this.totalItems = this.departmentData.sections?.length || 0;
        this.totalItemsGoals = this.departmentData.assigned_goals?.length || 0;
         const created = this.departmentData?.created_at;
        const updated = this.departmentData?.updated_at;
        if (created) {
          this.formattedCreatedAt = this.datePipe.transform(created, 'dd/MM/yyyy')!;
        }
        if (updated) {
          this.formattedUpdatedAt = this.datePipe.transform(updated, 'dd/MM/yyyy')!;
        }
        // console.log(this.departmentData);

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

    if (this.departmentData.sections && Array.isArray(this.departmentData.sections)) {
      this.departmentData.sections = [...this.departmentData.sections].sort((a, b) => {
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

    this._DepartmentsService.updateDeptStatus(this.departmentData.id, deptStatus).subscribe({
      next: (response) => {
        this.departmentData = response.data.object_info;
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

    this._DepartmentsService.updateDeptStatus(this.departmentData.id, deptStatus).subscribe({
      next: (response) => {
        this.departmentData = response.data.object_info;
        // console.log(this.departmentData);

        this.sortDirection = 'desc';
        this.sortBy('id');
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

  // Pagination methods
  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
  }


}
