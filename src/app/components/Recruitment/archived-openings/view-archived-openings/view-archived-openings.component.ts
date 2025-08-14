import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';

import { TableComponent } from '../../../shared/table/table.component';
import { RouterLink } from '@angular/router';
type Applicant = {
  id: number;
  name: string;
  phoneNumber: string;
  email: string;
  status: string;
  statusAt: string;
};
@Component({
  selector: 'app-view-archived-openings',
  imports: [PageHeaderComponent, TableComponent, RouterLink],
  templateUrl: './view-archived-openings.component.html',
  styleUrl: './view-archived-openings.component.css'
})


export class ViewArchivedOpeningsComponent {
  // show more text
  isExpanded = false;

  toggleText() {
    this.isExpanded = !this.isExpanded;
  }
  applicant: Applicant[] = [
    {
      id: 11,
      name: 'Ahmed Mohamed',
      phoneNumber: '+2 0122 233 244',
      email: 'ahmed@email.com',
      status: 'Applied at',
      statusAt: '28/12/2025 8:30 PM',
    }
  ];
  sortDirection: string = 'asc';
  currentSortColumn: keyof Applicant | '' = '';
  sortBy(column: keyof Applicant) {
    if (this.currentSortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.applicant && Array.isArray(this.applicant)) {
      this.applicant = [...this.applicant].sort((a, b) => {
        const aVal = a[column]?.toString().toLowerCase();
        const bVal = b[column]?.toString().toLowerCase();

        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
  }

}
