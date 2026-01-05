import { Component, OnInit } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { InterviewService } from '../core/services/recruitment/interview.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-interview-accepted',
  standalone: true,
  imports: [],
  templateUrl: './interview-accepted.component.html',
  styleUrls: ['./interview-accepted.component.css']
})
export class InterviewAcceptedComponent implements OnInit {
  // URL parameters
  token: string | null = null;
  applicantName: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
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
        this.toastr.error('Invalid interview token');
        this.isLoading = false;
        return;
      }

      // Call API to confirm interview acceptance
      this.acceptInterview();
    });
  }

  acceptInterview(): void {
    if (!this.token) {
      this.errorMessage = 'Invalid interview token.';
      this.isLoading = false;
      return;
    }

    this.interviewService.acceptInterview(this.token).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastr.success('Your interview acceptance has been confirmed!');
        console.log('Interview accepted successfully:', response);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error?.error?.message || 'Failed to confirm your attendance. Please try again.';
        this.errorMessage = errorMsg;
        this.toastr.error(errorMsg);
        console.error('Error accepting interview:', error);
      }
    });
  }
}

