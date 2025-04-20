import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../compo/page-header/page-header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-view-branches',
  imports: [PageHeaderComponent,CommonModule],
  templateUrl: './view-branches.component.html',
  styleUrls: ['./view-branches.component.css']
})
export class ViewBranchesComponent {

}
