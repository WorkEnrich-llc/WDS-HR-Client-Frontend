import { Component, OnInit } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InterviewService } from '../core/services/recruitment/interview.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-interview-rejected',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './interview-rejected.component.html',
  styleUrls: ['./interview-rejected.component.css']
})
export class InterviewRejectedComponent implements OnInit {
  rejectForm!: FormGroup;
  isSubmitting = false;
  isSubmitted = false;
  errorMessage: string | null = null;

  // URL parameters
  token: string | null = null;
  applicantName: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private interviewService: InterviewService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Get token and applicant info from URL query params
    this.route.queryParams.subscribe(params => {
      this.token = params['s'] || null; // Changed from 'token' to 's'
      this.applicantName = params['name'] || 'Candidate';

      if (!this.token) {
        this.errorMessage = 'Invalid interview token. Please check your email link.';
      }
    });

    // Initialize form
    this.rejectForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Invalid interview token. Please try again.';
      this.toastr.error('Invalid interview token');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const reason = this.rejectForm.value.reason;

    this.interviewService.rejectInterview(this.token, reason).subscribe({
      next: (response) => {
        this.isSubmitted = true;
        this.isSubmitting = false;
        this.toastr.success('Your response has been submitted successfully');
        console.log('Interview rejected successfully:', response);
      },
      error: (error) => {
        this.isSubmitting = false;
        const errorMsg = error?.error?.message || 'Failed to submit your response. Please try again.';
        this.errorMessage = errorMsg;
        this.toastr.error(errorMsg);
        console.error('Error rejecting interview:', error);
      }
    });
  }

  get reason() {
    return this.rejectForm.get('reason');
  }
}
