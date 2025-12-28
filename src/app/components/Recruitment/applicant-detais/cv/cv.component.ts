import { Component, Input, ViewChild, ViewEncapsulation } from '@angular/core';
import { OverlayFilterBoxComponent } from './../../../shared/overlay-filter-box/overlay-filter-box.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { SafePipe } from 'app/core/pipe/safe.pipe';
import { DatePipe } from '@angular/common';


@Component({
  selector: 'app-cv',
  standalone: true,
  imports: [OverlayFilterBoxComponent, PdfViewerModule, SafePipe, DatePipe],
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

  totalPages: number | null = null;

  onPdfLoad(pdf: any) {
    this.totalPages = pdf.numPages;
  }
  zoom = 0.9;

  zoomIn() {
    this.zoom = Math.min(this.zoom + 0.1, 3);
  }

  zoomOut() {
    this.zoom = Math.max(this.zoom - 0.1, 0.5);
  }

  downloadCv() {
    const url = this.pdfUrl;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cv.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  get viewerUrl(): string {
    if (!this.pdfUrl) return '';
    try {
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(this.pdfUrl)}`;
    } catch {
      return this.pdfUrl;
    }
  }

}
