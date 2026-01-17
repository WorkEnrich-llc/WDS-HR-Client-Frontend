
import { Component, OnInit } from '@angular/core';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { SummaryReportService } from './summary-report.service';
import { TableComponent } from 'app/components/shared/table/table.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-summary-report',
  imports: [PageHeaderComponent, TableComponent, FormsModule],
  templateUrl: './summary-report.component.html',
  styleUrls: ['./summary-report.component.css']
})
export class SummaryReportComponent implements OnInit {
  summaryReportData: any;
  loading = false;
  error: any;
  itemsPerPage = 10;
  currentPage = 1;

  // Filter state
  filterYear: number = new Date().getFullYear();
  filterMonth: string = (new Date().getMonth() + 1).toString().padStart(2, '0');
  filterStatus: string = '';

  yearOptions: number[] = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  monthOptions = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'resigned', label: 'Resigned' },
    // Add more statuses as needed
  ];

  constructor(private summaryReportService: SummaryReportService) { }

  ngOnInit(): void {
    this.fetchSummaryReport(1, this.itemsPerPage);
  }

  onViewClick(): void {
    this.fetchSummaryReport(1, this.itemsPerPage);
  }

  onFilterChange(): void {
    this.fetchSummaryReport(1, this.itemsPerPage);
  }

  onPrintClick(): void {
    window.print();
  }

  fetchSummaryReport(page: number, perPage: number): void {
    this.loading = true;
    this.currentPage = page;
    this.itemsPerPage = perPage;
    this.summaryReportService.getSummaryReport(page, perPage).subscribe({
      next: (data) => {
        this.summaryReportData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.fetchSummaryReport(page, this.itemsPerPage);
  }

  onItemsPerPageChange(perPage: number): void {
    this.fetchSummaryReport(1, perPage);
  }
}
