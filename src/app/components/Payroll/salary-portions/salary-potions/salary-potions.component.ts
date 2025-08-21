import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';

@Component({
  selector: 'app-salary-potions',
  imports: [PageHeaderComponent,RouterLink],
  templateUrl: './salary-potions.component.html',
  styleUrls: ['./../../../shared/table/table.component.css','./salary-potions.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class SalaryPotionsComponent {

}
