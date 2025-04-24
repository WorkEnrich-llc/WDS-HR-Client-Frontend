import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-overlay-filter-box',
  imports: [CommonModule],
  templateUrl: './overlay-filter-box.component.html',
  styleUrl: './overlay-filter-box.component.css'
})
export class OverlayFilterBoxComponent {
  @Input() title: string = 'عنوان الافتراضي'; 
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();  
  isOverlayVisible: boolean = false;
  isAnimatingOut: boolean = false;

  openOverlay() {
    this.isOverlayVisible = true;
  }

  closeOverlay() {
    this.isAnimatingOut = true;
    setTimeout(() => {
      this.isOverlayVisible = false;
      this.isAnimatingOut = false;
      this.onClose.emit();
    }, 400); 
  }
}
