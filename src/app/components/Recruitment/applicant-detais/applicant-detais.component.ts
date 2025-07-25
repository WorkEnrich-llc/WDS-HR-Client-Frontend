import { Component, ViewChild } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CvComponent } from './cv/cv.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { InterviewComponent } from './interview/interview.component';
import { AttachmentAndInfoComponent } from './attachment-and-info/attachment-and-info.component';
import { OverlayFilterBoxComponent } from '../../shared/overlay-filter-box/overlay-filter-box.component';
@Component({
  selector: 'app-applicant-detais',
  imports: [PageHeaderComponent, CvComponent, FeedbackComponent, InterviewComponent, AttachmentAndInfoComponent, OverlayFilterBoxComponent],
  templateUrl: './applicant-detais.component.html',
  styleUrl: './applicant-detais.component.css'
})
export class ApplicantDetaisComponent {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  closeAllOverlays(): void {
    this.filterBox?.closeOverlay();
  }
}
