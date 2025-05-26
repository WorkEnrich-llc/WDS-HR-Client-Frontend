import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { CommonModule } from '@angular/common';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';

@Component({
  selector: 'app-view-departments',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, TableComponent, PopupComponent, CommonModule],
  templateUrl: './view-departments.component.html',
  styleUrls: ['./view-departments.component.css']
})
export class ViewDepartmentsComponent implements OnInit {
  constructor(private _DepartmentsService: DepartmentsService, private route: ActivatedRoute) { }
  departmentData: any = { sections: [] };

  deptId: string | null = null;
  ngOnInit(): void {
    this.deptId = this.route.snapshot.paramMap.get('id');
    // this.getDepartment(Number(this.deptId));
    if (this.deptId) {
      this.getDepartment(Number(this.deptId));
    }
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
        console.log(this.departmentData);

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
        console.log(this.departmentData);

        this.sortDirection = 'desc';
        this.sortBy('id');
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }



  getDepartment(deptId: number) {

    this._DepartmentsService.showDepartment(deptId).subscribe({
      next: (response) => {
        this.departmentData = response.data.object_info;
        console.log(this.departmentData);

        this.sortDirection = 'desc';
        this.sortBy('id');
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

}
