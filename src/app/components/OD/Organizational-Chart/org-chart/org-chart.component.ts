import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-org-chart',
  imports: [PageHeaderComponent,CommonModule],
  templateUrl: './org-chart.component.html',
  styleUrl: './org-chart.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class OrgChartComponent{

  zoom = 1;
  isFullScreen = false;

  zoomIn() {
    this.zoom += 0.1;
  }

  zoomOut() {
    this.zoom = Math.max(0.5, this.zoom - 0.1);
  }

  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
  }

 

}
