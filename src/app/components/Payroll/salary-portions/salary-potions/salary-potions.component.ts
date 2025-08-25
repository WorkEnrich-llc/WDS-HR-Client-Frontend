import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { SalaryPortionsService } from 'app/core/services/payroll/salary-portions/salary-portions.service';

@Component({
  selector: 'app-salary-potions',
  imports: [PageHeaderComponent, RouterLink],
  templateUrl: './salary-potions.component.html',
  styleUrls: ['./../../../shared/table/table.component.css', './salary-potions.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SalaryPotionsComponent implements OnInit {
  private salaryPortionService = inject(SalaryPortionsService);
  salaryPortions: any[] = [];

  ngOnInit(): void {
    this.loadSalaryPortions();
  }

  private loadSalaryPortions(): void {
    this.salaryPortionService.single().subscribe({
      next: (data) => {
        console.log('Single salary portion data:', data);
        this.salaryPortions = data.settings
      },
      error: (err) => console.error('Failed to load single salary portion', err)
    });
  }

}
