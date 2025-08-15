import { Component, inject, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { TableComponent } from '../../../shared/table/table.component';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { debounceTime, filter, map, Observable, Subject, Subscription } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule, DatePipe } from '@angular/common';
import { PayrollComponentsService } from 'app/core/services/payroll/payroll-components/payroll-components.service';
import { PayrollComponent } from 'app/core/models/payroll';


@Component({
  selector: 'app-all-payroll-components',
  imports: [PageHeaderComponent, TableComponent, OverlayFilterBoxComponent, CommonModule, RouterLink, FormsModule],
  templateUrl: './all-payroll-components.component.html',
  styleUrl: './all-payroll-components.component.css',
  providers: [DatePipe],
})
export class AllPayrollComponentsComponent implements OnInit {

  private payrollService = inject(PayrollComponentsService);
  payrollComponentsList: PayrollComponent[] = [];
  payrollComponents: PayrollComponent[] = [];
  filteredList: PayrollComponent[] = [];
  constructor(
    private route: ActivatedRoute,
    private toasterMessageService: ToasterMessageService,
    private toastr: ToastrService,
  ) { }


  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  // payrollComponents = [
  //   {
  //     id: 1,
  //     componentName: 'Bonus',
  //     type: 'Fixed',
  //     classfication: 'Earning',
  //     show: true
  //   },
  //   {
  //     id: 2,
  //     componentName: 'Absence',
  //     type: 'Variable',
  //     classfication: 'Deduction',
  //     show: false
  //   },
  // ];
  loadData: boolean = false;
  filterForm!: FormGroup;
  searchTerm: string = '';
  sortDirection: string = 'asc';
  currentSortColumn: string = '';
  totalItems: number = 0;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  data: PayrollComponent[] = [];
  components: PayrollComponent[] = [];


  totalPages: number = 0;




  private searchSubject = new Subject<string>();
  private toasterSubscription!: Subscription;


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.currentPage = +params['page'] || 1;
      this.getAllComponents(this.currentPage);
    });

    this.toasterSubscription = this.toasterMessageService.currentMessage$
      .pipe(filter(msg => !!msg && msg.trim() !== ''))
      .subscribe(msg => {
        this.toastr.clear();
        this.toastr.success(msg, '', { timeOut: 3000 });

        this.toasterMessageService.clearMessage();
      });

    this.searchSubject.pipe(debounceTime(300)).subscribe(value => {
      this.getAllComponents(this.currentPage, value);
    });

  }

  getAllComponents(
    pageNumber: number,
    searchTerm: string = '',
    filters?: {
      status?: string;
      updated_from?: string;
      updated_to?: string;
      created_from?: string;
      created_to?: string;
    }
  ) {
    this.loadData = true;
    this.payrollService.getAllComponent(pageNumber, this.itemsPerPage, {
      search: searchTerm || undefined,
      ...filters
    }).subscribe({
      next: (response) => {
        this.currentPage = Number(response.data.page);
        this.totalItems = response.data.total_items;
        this.totalPages = response.data.total_pages;
        this.components = response.data.list_items.map((item: any) => ({
          id: item.id,
          name: item.name,
          classification: item.classification.name,
          component_type: item.component_type.name,
          show_in_payslip: item.show_in_payslip,
          show_in_payslip_label: item.show_in_payslip ? 'Shown' : 'Hidden'
        }));
        this.sortDirection = 'desc';
        this.currentSortColumn = 'id';
        this.sortBy();
        this.loadData = false;
      },
      error: (err) => {
        console.log(err.error?.details);
        this.loadData = false;
      }
    });
  }

  sortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.components.sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      if (this.sortDirection === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  }

  applyFilters() {
    this.filteredList = this.components.filter(item =>
      item.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.sortBy();
  }


  resetFilterForm(): void {
    this.filterBox.closeOverlay();
    this.searchTerm = '';
    this.filteredList = [...this.components];
  }


  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onItemsPerPageChange(newItemsPerPage: number) {
    this.itemsPerPage = newItemsPerPage;
    this.currentPage = 1;
    this.getAllComponents(this.currentPage);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.getAllComponents(this.currentPage);
  }
}
