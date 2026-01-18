import { Component, OnInit } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InterviewService } from '../../core/services/recruitment/interview.service';
import { ToastrService } from 'ngx-toastr';
import { DatePickerComponent } from '../../components/shared/date-picker/date-picker.component';

@Component({
  selector: 'app-interview-reschedule',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DatePickerComponent],
  templateUrl: './interview-reschedule.component.html',
  styleUrls: ['./interview-reschedule.component.css']
})
export class InterviewRescheduleComponent implements OnInit {
  rescheduleForm!: FormGroup;
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
      this.token = params['s'] || null;
      this.applicantName = params['name'] || 'Candidate';

      if (!this.token) {
        this.errorMessage = 'Invalid interview token. Please check your email link.';
      }
    });

    // Initialize form
    this.rescheduleForm = this.fb.group({
      rescheduleDate: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    // Prevent multiple submissions
    if (this.isSubmitting) {
      return;
    }

    if (this.rescheduleForm.invalid) {
      this.rescheduleForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Invalid interview token. Please try again.';
      this.toastr.error('Invalid interview token');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const rescheduleDate = this.rescheduleForm.value.rescheduleDate;

    this.interviewService.rescheduleInterview(this.token, rescheduleDate).subscribe({
      next: (response) => {
        this.isSubmitted = true;
        this.isSubmitting = false;
        this.toastr.success('Your interview has been rescheduled successfully!');
        console.log('Interview rescheduled successfully:', response);
      },
      error: (error) => {
        this.isSubmitting = false;
        const errorMsg = error?.error?.message || 'Failed to reschedule the interview. Please try again.';
        this.errorMessage = errorMsg;
        this.toastr.error(errorMsg);
        console.error('Error rescheduling interview:', error);
      }
    });
  }

  get rescheduleDate() {
    return this.rescheduleForm.get('rescheduleDate');
  }
}