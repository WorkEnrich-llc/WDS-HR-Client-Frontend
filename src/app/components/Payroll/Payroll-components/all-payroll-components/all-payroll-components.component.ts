import { Component, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, filter, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { PayrollComponentsService } from 'app/core/services/payroll/payroll-components/payroll-components.service';


@Component({
  selector: 'app-all-payroll-components',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, CommonModule, RouterLink],
  templateUrl: './all-payroll-components.component.html',
  styleUrl: './all-payroll-components.component.css'
})
export class AllPayrollComponentsComponent implements OnInit {

  private payrollService = inject(PayrollComponentsService);
  constructor(
    private route: ActivatedRoute,
    private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService,
    private fb: FormBuilder) { }


  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  payrollComponents = [
    {
      id: 1,
      componentName: 'Bonus',
      type: 'Fixed',
      classfication: 'Earning',
      show: true
    },
    {
      id: 2,
      componentName: 'Absence',
      type: 'Variable',
      classfication: 'Deduction',
      show: false
    },
  ];
  loadData: boolean = false;
  filterForm!: FormGroup;
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;


  ngOnInit(): void {
    this.payrollService.getAllComponents().subscribe((data) => {
      console.log('Payroll Components:', data);
    });
    this.route.queryParams.subscribe(params => {
      // this.currentPage = +params['page'] || 1;
      // this.getAllDepartment(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      // this.getAllDepartment(this.currentPage, value);
    });

  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.payrollComponents = this.payrollComponents.sort((a, b) => {
      const nameA = a.componentName.toLowerCase();
      const nameB = b.componentName.toLowerCase();

      if (this.sortDirection === 'asc') {
        return nameA > nameB ? 1 : (nameA < nameB ? -1 : 0);
      } else {
        return nameA < nameB ? 1 : (nameA > nameB ? -1 : 0);
      }
    });
  }
  resetFilterForm(): void {

    this.filterBox.closeOverlay();
    // this.getAllDepartment(this.currentPage);
  }
  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
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
}








