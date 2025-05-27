import { Component, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { DepartmentsService } from '../../../../core/services/od/departments/departments.service';

@Component({
  selector: 'app-all-departments',
  imports: [PageHeaderComponent, TableComponent, RouterLink, OverlayFilterBoxComponent, CommonModule],
  providers: [DatePipe],
  templateUrl: './all-departments.component.html',
  styleUrl: './all-departments.component.css'
})
export class AllDepartmentsComponent implements OnInit {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  constructor(private toasterMessageService: ToasterMessageService, private toastr: ToastrService,
    private _DepartmentsService: DepartmentsService, private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.getAllDepartment(this.currentPage);

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


  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  getAllDepartment(pageNumber: number) {
    this._DepartmentsService.getAllDepartment(pageNumber, this.itemsPerPage).subscribe({
      next: (response) => {
        // console.log(response);
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalpages = response.data.total_pages;
        this.departments = response.data.list_items.map((item: any) => ({
          id: item.id,
          name: item.name,
          createdAt: this.datePipe.transform(item.created_at, 'dd/MM/yyyy'),
          updatedAt: this.datePipe.transform(item.updated_at, 'dd/MM/yyyy'),
          status: item.is_active ? 'Active' : 'Inactive',
        }));
        // console.log("current page:",this.currentPage);
        // console.log("total pages:",this.totalpages);
        // console.log("total items:",this.totalItems);
        // console.log("Department:",this.departments);
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }

onItemsPerPageChange(newItemsPerPage: number) {
  this.itemsPerPage = newItemsPerPage;
  this.currentPage = 1;
  this.getAllDepartment(this.currentPage);
}
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllDepartment(this.currentPage);
  }
}
