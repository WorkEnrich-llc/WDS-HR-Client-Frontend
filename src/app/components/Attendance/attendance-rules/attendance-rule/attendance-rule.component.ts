import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-attendance-rule',
  imports: [PageHeaderComponent,RouterLink],
  templateUrl: './attendance-rule.component.html',
  styleUrls: ['./../../../shared/table/table.component.css','./attendance-rule.component.css'],
  encapsulation:ViewEncapsulation.None
})
export class AttendanceRuleComponent {

}
