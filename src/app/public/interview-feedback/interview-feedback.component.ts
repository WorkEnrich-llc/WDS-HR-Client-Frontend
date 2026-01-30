import { Component, OnInit } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InterviewService } from '../../core/services/recruitment/interview.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-interview-feedback',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './interview-feedback.component.html',
  styleUrls: ['./interview-feedback.component.css']
})
export class InterviewFeedbackComponent implements OnInit {
  feedbackForm!: FormGroup;
  isSubmitting = false;
  isSubmitted = false;
  errorMessage: string | null = null;

  // URL parameters
  token: string | null = null;
  applicantName: string | null = null;

  // Hover state for stars (can be decimal for half stars)
  hoveredRating: number | null = null;

  // Interview attendance state
  didAttendInterview: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private interviewService: InterviewService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Get token and applicant info from URL query params
    this.route.queryParams.subscribe(params => {
      this.token = params['s'] || null;
      this.applicantName = params['name'] || 'Candidate';

      if (!this.token) {
        this.errorMessage = 'Invalid interview token. Please check your email link.';
      }
    });

    // Initialize form
    this.feedbackForm = this.fb.group({
      rating: ['', [Validators.required, Validators.min(0), Validators.max(10)]],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  toggleInterviewAttendance(): void {
    this.didAttendInterview = !this.didAttendInterview;

    // If they didn't attend, clear and disable the form controls
    if (!this.didAttendInterview) {
      this.feedbackForm.get('rating')?.reset();
      this.feedbackForm.get('comment')?.reset();
      this.feedbackForm.get('rating')?.disable();
      this.feedbackForm.get('comment')?.disable();
    } else {
      // If they did attend, enable the controls
      this.feedbackForm.get('rating')?.enable();
      this.feedbackForm.get('comment')?.enable();
    }
  }

  onSubmit(): void {
    // Prevent multiple submissions
    if (this.isSubmitting) {
      return;
    }

    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Invalid interview token. Please try again.';
      this.toastr.error('Invalid interview token');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const rating = parseFloat(this.feedbackForm.value.rating);
    const comment = this.feedbackForm.value.comment;
    const isMissed = !this.didAttendInterview;

    this.interviewService.submitInterviewFeedback(this.token, rating, comment, isMissed).subscribe({
      next: (response) => {
        this.isSubmitted = true;
        this.isSubmitting = false;
        this.toastr.success('Your feedback has been submitted successfully!');
        console.log('Interview feedback submitted successfully:', response);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting interview feedback:', error);
      }
    });
  }

  get rating() {
    return this.feedbackForm.get('rating');
  }

  get comment() {
    return this.feedbackForm.get('comment');
  }

  // Star rating helpers
  getStars(): number[] {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  setRating(starValue: number, event: MouseEvent): void {
    const starElement = event.currentTarget as HTMLElement;
    const rect = starElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const starWidth = rect.width;

    // If click is on the left half, set half star, otherwise full star
    const rating = clickX < starWidth / 2 ? starValue - 0.5 : starValue;

    this.feedbackForm.patchValue({ rating: rating });
    this.feedbackForm.get('rating')?.markAsTouched();
  }

  getStarState(starValue: number): 'filled' | 'half' | 'empty' | 'hover' | 'half-hover' {
    const currentRating = parseFloat(this.feedbackForm.value.rating) || 0;

    // If hovering, check hover state first
    if (this.hoveredRating !== null) {
      // Check if this star should show hover state
      if (starValue - 0.5 <= this.hoveredRating && this.hoveredRating < starValue) {
        // Half star hover
        // If this star is already selected as half, keep it half, otherwise show half-hover
        if (starValue - 0.5 <= currentRating && currentRating < starValue) {
          return 'half';
        }
        return 'half-hover';
      } else if (starValue <= this.hoveredRating) {
        // Full star hover
        // If this star is selected (filled), keep it filled, otherwise show hover
        if (starValue <= currentRating) {
          return 'filled';
        }
        return 'hover';
      }
    }

    // Normal state (no hover or hover past this star)
    if (starValue <= currentRating) {
      return 'filled';
    } else if (starValue - 0.5 <= currentRating && currentRating < starValue) {
      return 'half';
    }
    return 'empty';
  }

  onStarHover(starValue: number, event: MouseEvent): void {
    const starElement = event.currentTarget as HTMLElement;
    const rect = starElement.getBoundingClientRect();
    const hoverX = event.clientX - rect.left;
    const starWidth = rect.width;

    // If hover is on the left half, set half star, otherwise full star
    this.hoveredRating = hoverX < starWidth / 2 ? starValue - 0.5 : starValue;
  }

  onStarLeave(): void {
    this.hoveredRating = null;
  }
}