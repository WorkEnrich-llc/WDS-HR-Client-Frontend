import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { OverlayFilterBoxComponent } from './../../../shared/overlay-filter-box/overlay-filter-box.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cv',
    standalone: true,
  imports: [OverlayFilterBoxComponent, PdfViewerModule,CommonModule],
  templateUrl: './cv.component.html',
  styleUrl: './cv.component.css',
  encapsulation:ViewEncapsulation.None
})
export class CvComponent {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
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

}
