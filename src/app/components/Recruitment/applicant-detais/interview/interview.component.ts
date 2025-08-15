
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  selector: 'app-interview',
  imports: [OverlayFilterBoxComponent],
  templateUrl: './interview.component.html',
  styleUrl: './interview.component.css',
})
export class InterviewComponent {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @ViewChild('jobBox') jobBox!: OverlayFilterBoxComponent;
  status = 'Interviewee';
  interviewStatus=true;
  overlayTitle: string = 'Schedule Interview';

openOverlay(title: string, target: 'filter' | 'job' = 'filter'): void {
  this.overlayTitle = title;
  if (target === 'filter') {
    this.filterBox.openOverlay();
  } else {
    this.jobBox.openOverlay();
  }
}
closeAllOverlays(): void {
  this.filterBox?.closeOverlay();
  this.jobBox?.closeOverlay();
}

}
