import { Component, ViewEncapsulation } from '@angular/core';

import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-org-chart',
  imports: [PageHeaderComponent, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './org-chart.component.html',
  styleUrls: ['./org-chart.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class OrgChartComponent {

}