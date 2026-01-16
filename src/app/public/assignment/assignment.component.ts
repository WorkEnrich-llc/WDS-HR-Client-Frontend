import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignmentService } from '../../core/services/recruitment/assignment.service';
import { AssignmentStateService } from '../../core/services/recruitment/assignment-state.service';
import { ToastrService } from 'ngx-toastr';
import { AssignmentOverviewComponent } from './components/assignment-overview/assignment-overview.component';
import { AssignmentQuestionsComponent } from './components/questions/questions.component';
import { NavbarComponent, LogoData, SocialMediaLinks } from '../../client-job-board/layouts/navbar/navbar.component';
import { FooterComponent } from '../../client-job-board/layouts/footer/footer.component';
import { ThemeService } from '../../client-job-board/services/theme.service';

@Component({
  selector: 'app-assignment',
  imports: [AssignmentOverviewComponent, NavbarComponent, FooterComponent],
  templateUrl: './assignment.component.html',
  styleUrl: './assignment.component.css'
})
export class AssignmentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private assignmentService = inject(AssignmentService);
  private assignmentStateService = inject(AssignmentStateService);
  private toastr = inject(ToastrService);
  private themeService = inject(ThemeService);

  accessToken: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  errorHandling: Array<{ field: string; error: string }> = [];
  assignmentData: any = null;

  // View state
  isStartingAssignment: boolean = false;

  // Navbar and Footer data
  logoData: LogoData = {};
  socialMediaLinks: SocialMediaLinks = {};
  websiteUrl: string | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.accessToken = params['s'] || null;

      if (this.accessToken) {
        this.loadAssignmentData();
      } else {
        this.isLoading = false;
        this.errorMessage = 'Invalid access token';
        this.toastr.error('Invalid access token');
      }
    });
  }

  private loadAssignmentData(): void {
    this.isLoading = true;
    this.errorHandling = [];
    this.errorMessage = null;

    this.assignmentService.getAssignmentOverview(this.accessToken!).subscribe({
      next: (response) => {
        console.log('=== Assignment Overview Response ===');
        console.log('Full response:', response);
        console.log('Response.data:', response?.data);
        console.log('Response.data?.error_handling:', response?.data?.error_handling);
        console.log('Response.data?.object_info:', response?.data?.object_info);

        // Check for error_handling array first (check both response.data and response directly)
        const errorHandling = response?.data?.error_handling || response?.error_handling;
        console.log('Extracted errorHandling:', errorHandling);

        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          console.log('Found error_handling array, setting error state');
          this.errorHandling = errorHandling;
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          this.errorMessage = errorMessages.join('. ') || 'An error occurred';
          console.log('Error message set to:', this.errorMessage);
          console.log('Error handling array set to:', this.errorHandling);
          this.toastr.error(this.errorMessage || 'An error occurred');
          this.assignmentData = null; // Ensure assignmentData is null when there are errors
          this.isLoading = false;
          return;
        }

        // Clear any previous errors
        this.errorHandling = [];
        this.errorMessage = null;

        const objectInfo = response?.data?.object_info || response?.object_info;

        if (objectInfo) {
          this.assignmentData = objectInfo;

          // Save overview data to service before navigating (for questions component to use)
          if (objectInfo.company) {
            this.assignmentStateService.setOverviewData(this.accessToken!, {
              company: {
                theme: objectInfo.company.theme,
                logo_url: objectInfo.company.logo_url,
                name: objectInfo.company.name,
                title: objectInfo.company.title,
                social_links: objectInfo.company.social_links
              }
            });
          }

          // Check if assignment is already started - navigate to questions
          if (objectInfo.applicant_assignment?.status === 'Started') {
            this.router.navigate(['/assignment/questions'], { queryParams: { s: this.accessToken } });
            this.isLoading = false;
            return;
          }

          // Apply theme color from company data
          if (objectInfo.company?.theme) {
            this.themeService.setThemeColor(objectInfo.company.theme);
          }

          // Set up navbar and footer data
          if (objectInfo.company) {
            this.logoData = {
              icon: objectInfo.company.logo_url || undefined,
              companyName: objectInfo.company.name || undefined,
              tagline: objectInfo.company.title || undefined
            };

            // Set up social media links
            if (objectInfo.company.social_links) {
              this.socialMediaLinks = {};
              if (objectInfo.company.social_links.facebook) {
                this.socialMediaLinks.facebook = objectInfo.company.social_links.facebook;
              }
              if (objectInfo.company.social_links.instagram) {
                this.socialMediaLinks.instagram = objectInfo.company.social_links.instagram;
              }
              if (objectInfo.company.social_links.x) {
                this.socialMediaLinks.twitter = objectInfo.company.social_links.x;
              }
              if (objectInfo.company.social_links.linkedin) {
                this.socialMediaLinks.linkedin = objectInfo.company.social_links.linkedin;
              }
            }

            // Set website URL
            this.websiteUrl = objectInfo.company.social_links?.website || null;
          }
        } else {
          console.log('object_info is null, checking for error_handling again');
          // If object_info is null, check again for error_handling (in case it wasn't caught earlier)
          const errorHandlingRetry = response?.data?.error_handling || response?.error_handling;
          console.log('Error handling retry:', errorHandlingRetry);

          if (errorHandlingRetry && Array.isArray(errorHandlingRetry) && errorHandlingRetry.length > 0) {
            console.log('Found error_handling in retry, setting error state');
            this.errorHandling = errorHandlingRetry;
            const errorMessages = errorHandlingRetry.map(err => err.error || err.message).filter(Boolean);
            this.errorMessage = errorMessages.join('. ') || 'An error occurred';
            console.log('Error message set to:', this.errorMessage);
            console.log('Error handling array set to:', this.errorHandling);
            this.toastr.error(this.errorMessage || 'An error occurred');
            this.assignmentData = null;
          } else {
            console.log('No error_handling found, setting generic error');
            this.errorMessage = 'Invalid assignment data';
            this.toastr.error('Invalid assignment data');
          }
        }

        console.log('Final state - errorMessage:', this.errorMessage);
        console.log('Final state - errorHandling:', this.errorHandling);
        console.log('Final state - assignmentData:', this.assignmentData);

        this.isLoading = false;
      },
      error: (error) => {
        console.log('=== Assignment Overview Error ===');
        console.log('Full error object:', error);
        console.log('Error.error:', error.error);
        console.log('Error.error?.data:', error.error?.data);
        console.log('Error.error?.data?.error_handling:', error.error?.data?.error_handling);

        this.isLoading = false;

        // Check if error response has error_handling array (check multiple possible locations)
        const errorHandling = error.error?.data?.error_handling ||
          error.error?.error_handling ||
          error?.data?.error_handling ||
          error?.error_handling;
        console.log('Extracted errorHandling from error:', errorHandling);

        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          console.log('Found error_handling in error callback, setting error state');
          this.errorHandling = errorHandling;
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          this.errorMessage = errorMessages.join('. ') || 'An error occurred';
          console.log('Error message set to:', this.errorMessage);
          console.log('Error handling array set to:', this.errorHandling);
          this.toastr.error(this.errorMessage || 'An error occurred');
        } else {
          // Also check if there's a message in error_handling format at root level
          const rootErrorHandling = error?.error_handling || error.error?.error_handling;
          if (rootErrorHandling && Array.isArray(rootErrorHandling) && rootErrorHandling.length > 0) {
            console.log('Found root error_handling, setting error state');
            this.errorHandling = rootErrorHandling;
            const errorMessages = rootErrorHandling.map(err => err.error || err.message).filter(Boolean);
            this.errorMessage = errorMessages.join('. ') || 'An error occurred';
            console.log('Error message set to:', this.errorMessage);
            this.toastr.error(this.errorMessage || 'An error occurred');
          } else {
            console.log('No error_handling found, setting generic error');
            this.errorMessage = error.error?.message || error.message || 'Failed to load assignment data';
            this.toastr.error(this.errorMessage || 'Failed to load assignment data');
          }
        }

        this.assignmentData = null; // Ensure assignmentData is null when there are errors
        console.log('Final error state - errorMessage:', this.errorMessage);
        console.log('Final error state - errorHandling:', this.errorHandling);
        console.error('Error loading assignment data:', error);
      }
    });
  }

  /**
   * Handle proceed to assignment
   */
  onProceedToAssignment(): void {
    if (!this.accessToken || this.isStartingAssignment) {
      return;
    }

    this.isStartingAssignment = true;

    this.assignmentService.startAssignment(this.accessToken).subscribe({
      next: (response) => {
        // Check for error_handling array in response
        const errorHandling = response?.data?.error_handling;
        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          const errorMessage = errorMessages.join('. ') || 'An error occurred';
          this.toastr.error(errorMessage);
          this.isStartingAssignment = false;
          return;
        }

        this.isStartingAssignment = false;
        // Overview data is already saved in service from loadAssignmentData
        this.router.navigate(['/assignment/questions'], { queryParams: { s: this.accessToken } });
      },
      error: (error) => {
        this.isStartingAssignment = false;
        // Check if error response has error_handling
        const errorHandling = error.error?.data?.error_handling;
        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          const errorMessage = errorMessages.join('. ') || 'An error occurred';
          this.toastr.error(errorMessage);
        } else {
          this.toastr.error(error.error?.message || 'Failed to start assignment');
        }
        console.error('Error starting assignment:', error);
      }
    });
  }
}
