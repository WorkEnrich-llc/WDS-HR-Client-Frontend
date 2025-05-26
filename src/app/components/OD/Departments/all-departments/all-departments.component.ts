import { Component, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';

@Component({
  selector: 'app-all-departments',
  imports: [PageHeaderComponent, TableComponent, RouterLink, OverlayFilterBoxComponent, CommonModule],
  templateUrl: './all-departments.component.html',
  styleUrl: './all-departments.component.css'
})
export class AllDepartmentsComponent implements OnInit {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  constructor(private toasterMessageService: ToasterMessageService, private toastr: ToastrService, private _DepartmentsService: DepartmentsService) { }

  ngOnInit(): void {
    this.getAllDepartment(1);
    this.toasterMessageService.currentMessage$.subscribe(addMsg => {
      if (addMsg) {
        this.toastr.success(addMsg);
        this.toasterMessageService.sendMessage('');
      }
    });
  }

  departments: any[] = [];

  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.departments = this.departments.sort((a, b) => {
      if (this.sortDirection === 'asc') {
        return a.id > b.id ? 1 : (a.id < b.id ? -1 : 0);
      } else {
        return a.id < b.id ? 1 : (a.id > b.id ? -1 : 0);
      }
    });
  }


  totalpages: number = 0;
  getAllDepartment(pageNumber: number) {

    this._DepartmentsService.getAllDepartment(pageNumber).subscribe({
      next: (response) => {
        // console.log(response);
        this.totalpages = response.data.total_pages;
        this.departments = response.data.list_items.map((item: any) => ({
          id: item.id,
          name: item.name,
          createdAt: item.created_at.split('T')[0],
          updatedAt: item.updated_at.split('T')[0],
          status: item.is_active ? 'Active' : 'Inactive',
        }));
        // console.log(this.departments);
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
}
