import { Component, OnInit } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { InterviewService } from '../core/services/recruitment/interview.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-offer-accepted',
  standalone: true,
  imports: [],
  templateUrl: './offer-accepted.component.html',
  styleUrls: ['./offer-accepted.component.css']
})
export class OfferAcceptedComponent implements OnInit {
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
      this.token = params['s'] || null;
      this.applicantName = params['name'] || 'Candidate';

      if (!this.token) {
        this.errorMessage = 'Invalid offer token. Please check your email link.';
        this.isLoading = false;
        return;
      }

      // Call API to confirm offer acceptance
      this.acceptOffer();
    });
  }

  acceptOffer(): void {
    if (!this.token) {
      this.errorMessage = 'Invalid offer token.';
      this.isLoading = false;
      return;
    }

    this.interviewService.acceptJobOffer(this.token).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.toastr.success('Your offer acceptance has been confirmed!');
        console.log('Offer accepted successfully:', response);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMsg = error?.error?.message || 'Failed to confirm your acceptance. Please try again.';
        this.errorMessage = errorMsg;
        this.toastr.error(errorMsg);
        console.error('Error accepting offer:', error);
      }
    });
  }
}
