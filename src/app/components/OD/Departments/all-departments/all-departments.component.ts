import { Component, OnInit, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-all-departments',
  imports: [PageHeaderComponent,TableComponent,RouterLink,OverlayFilterBoxComponent,CommonModule],
  templateUrl: './all-departments.component.html',
  styleUrl: './all-departments.component.css'
})
export class AllDepartmentsComponent implements OnInit{
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  constructor( private toasterMessageService: ToasterMessageService, private toastr: ToastrService){}

    ngOnInit(): void {
    this.toasterMessageService.currentMessage$.subscribe(addMsg => {
    if (addMsg) {
      this.toastr.success(addMsg);
      this.toasterMessageService.sendMessage('');
    }
  });
  }

  departments: any[] = [
    { id: 1, name: 'Branch One', createdAt: '9/3/2024', updatedAt: '12/3/2025', status: 'Active' },
    { id: 2, name: 'North Jeddah Branch', createdAt: '9/3/2024', updatedAt: '12/3/2025', status: 'Active' },
    { id: 3, name: 'Rabat Downtown', createdAt: '9/3/2024', updatedAt: '12/3/2025', status: 'Not Active' },
    { id: 4, name: 'Alex Main Branch', createdAt: '10/3/2024', updatedAt: '1/4/2025', status: 'Active' },
    { id: 5, name: 'Dubai HQ', createdAt: '11/3/2024', updatedAt: '3/4/2025', status: 'Active' },
    { id: 6, name: 'Kuwait Office', createdAt: '13/3/2024', updatedAt: '4/4/2025', status: 'Not Active' },
    { id: 7, name: 'Doha Service Point', createdAt: '14/3/2024', updatedAt: '5/4/2025', status: 'Active' },
    { id: 8, name: 'Tunis City Branch', createdAt: '15/3/2024', updatedAt: '6/4/2025', status: 'Active' },
    { id: 9, name: 'Beirut Branch', createdAt: '16/3/2024', updatedAt: '7/4/2025', status: 'Not Active' },
    { id: 10, name: 'Tripoli Office', createdAt: '17/3/2024', updatedAt: '8/4/2025', status: 'Active' },
    { id: 11, name: 'Riyadh East', createdAt: '18/3/2024', updatedAt: '9/4/2025', status: 'Active' },
    { id: 12, name: 'Manama Finance Center', createdAt: '19/3/2024', updatedAt: '10/4/2025', status: 'Active' },
  ];

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


  
}
