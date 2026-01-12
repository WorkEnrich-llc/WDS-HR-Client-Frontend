
import { NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, Output, TemplateRef, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [FormsModule, NgxPaginationModule, NgTemplateOutlet],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class TableComponent {
  @Input() data?: any[] | null = [];
  @Input() totalItems!: number;
  @Input() itemsPerPage = 10;
  @Input() currentPage = 1;
  @Input() columnsCount = 0;
  @Input() headerTemplate!: TemplateRef<any>;
  @Input() rowTemplate!: TemplateRef<any>;
  @Input() skeletonTemplate?: TemplateRef<any>;
  @Input() emptyTemplate!: TemplateRef<any>;
  @Input() disablePagination: boolean = false;
  @Input() isLoading: boolean = false;
  @Output() itemsPerPageChange = new EventEmitter<number>();

  @Output() pageChange = new EventEmitter<number>();

  get skeletonRows() {
    return Array.from({ length: this.itemsPerPage }, (_, i) => ({ id: i, isSkeleton: true }));
  }

  trackByFn(index: number, row: any): any {
    return row?.id ?? index;
  }

  onPageChanged(newPage: number) {
    this.currentPage = newPage;
    this.pageChange.emit(newPage);
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.itemsPerPageChange.emit(this.itemsPerPage);
    // Do NOT emit pageChange here; parent will handle fetch and page reset
  }
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
  getColumnsArray(count: number): number[] {
    return Array(count).fill(0);
  }
  indexFn(index: number, item: any) {
    return index;
  }



}
