import { Component, ViewChild, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OverlayFilterBoxComponent } from '../../../shared/overlay-filter-box/overlay-filter-box.component';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';

@Component({
  selector: 'app-feedback',
  imports: [CommonModule, FormsModule, OverlayFilterBoxComponent],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.css'
})
export class FeedbackComponent {
  @ViewChild(OverlayFilterBoxComponent) overlay!: OverlayFilterBoxComponent;
  @ViewChild('filterBox') filterBox!: OverlayFilterBoxComponent;
  @Input() applicant: any;
  @Input() feedbacks: any[] = [];
  @Input() applicationId?: number;
  @Input() applicationStatus?: string;
  @Output() feedbackAdded = new EventEmitter<void>();
  
  // Status mapping for checking if status allows feedback
  private statusMap: Record<number, string> = {
    0: 'Applicant',
    1: 'Candidate',
    2: 'Interviewee',
    3: 'Job Offer Sent',
    4: 'New Joiner',
    5: 'Rejected',
    6: 'Qualified',
    7: 'Not Selected'
  };
  
  // Check if status allows adding feedback (Interviewee and after)
  get canAddFeedback(): boolean {
    if (!this.applicationStatus) return false;
    
    // Normalize status to string
    const status = typeof this.applicationStatus === 'number' 
      ? this.statusMap[this.applicationStatus] 
      : this.applicationStatus;
    
    // Statuses that allow feedback: Interviewee (2) and after
    const allowedStatuses = ['Interviewee', 'Job Offer Sent', 'New Joiner', 'Qualified'];
    return allowedStatuses.includes(status);
  }
  private jobOpeningsService = inject(JobOpeningsService);
  rating: number | null = null;
  comment: string = '';
  submitting = false;
  closeAllOverlays(): void {
    this.filterBox?.closeOverlay();
  }
  onSubmit(): void {
    if (!this.applicationId || this.rating == null || this.rating < 0 || this.rating > 10) {
      return;
    }
    this.submitting = true;
    this.jobOpeningsService.addApplicationFeedback(this.applicationId, this.rating, this.comment || '').subscribe({
      next: () => {
        this.submitting = false;
        this.comment = '';
        this.rating = null;
        this.closeAllOverlays();
        this.feedbackAdded.emit();
      },
      error: () => {
        this.submitting = false;
      }
    });
  }
}
