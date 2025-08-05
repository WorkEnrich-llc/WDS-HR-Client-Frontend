import { Component, ViewChild } from '@angular/core';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';

@Component({
  selector: 'app-feedback',
  imports: [OverlayFilterBoxComponent],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  closeAllOverlays(): void {
    this.filterBox?.closeOverlay();
  }
}
