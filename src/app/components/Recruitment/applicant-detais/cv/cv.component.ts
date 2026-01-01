import { Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { OverlayFilterBoxComponent } from './../../../shared/overlay-filter-box/overlay-filter-box.component';
import { NgxDocViewerModule } from 'ngx-doc-viewer';
import { SafePipe } from 'app/core/pipe/safe.pipe';
import { DatePipe, DecimalPipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';


@Component({
  selector: 'app-cv',
  standalone: true,
  imports: [OverlayFilterBoxComponent, NgxDocViewerModule, SafePipe, DatePipe, DecimalPipe],
  providers: [DatePipe,],
  templateUrl: './cv.component.html',
  styleUrl: './cv.component.css',
  encapsulation: ViewEncapsulation.None
})
export class CvComponent {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @Input() applicant: any;
  @Input() set cvUrl(value: string | undefined) {
    if (value && typeof value === 'string' && value.trim()) {
      this.pdfUrl = value;
    }
  }
  pdfUrl = `${window.location.origin}/assets/cv.pdf`;

  constructor(private sanitizer: DomSanitizer) {}


  downloadCv() {
    const url = this.pdfUrl;
    if (!url) return;
    
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${this.applicant?.name || 'cv'}.pdf`;
        link.click();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(error => {
        alert('An error occurred while downloading the CV.');
        console.error('Download error:', error);
      });
  }

  /**
   * Get the average evaluation score for the applicant
   */
  getEvaluationScore(): number {
    return this.applicant?.evaluation?.average_score ?? 0;
  }

  /**
   * Get max score (always 100)
   */
  getMaxScore(): number {
    return 100;
  }



}
