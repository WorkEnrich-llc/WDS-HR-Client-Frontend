import { CommonModule } from '@angular/common';
import { Component, ContentChild, Input, TemplateRef, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';

@Component({
  selector: 'app-table',
  imports: [CommonModule,FormsModule,NgxPaginationModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() itemsPerPage = 10;
  @Input() currentPage = 1;

  @Input() headerTemplate!: TemplateRef<any>;
  @Input() rowTemplate!: TemplateRef<any>;
  @Input() emptyTemplate!: TemplateRef<any>;
  @Input() disablePagination: boolean = false;

  onItemsPerPageChange() {
    this.currentPage = 1; 
  }
}
