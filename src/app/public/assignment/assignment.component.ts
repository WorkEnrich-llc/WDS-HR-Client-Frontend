import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AssignmentService } from '../../core/services/recruitment/assignment.service';
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
  private toastr = inject(ToastrService);
  private themeService = inject(ThemeService);

  accessToken: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;
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
    this.assignmentService.getAssignmentOverview(this.accessToken!).subscribe({
      next: (response) => {
        // Check for error_handling array first
        const errorHandling = response.data?.error_handling;
        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          this.errorMessage = errorMessages.join('. ') || 'An error occurred';
          this.toastr.error(this.errorMessage);
          this.isLoading = false;
          return;
        }

        const objectInfo = response.data?.object_info;
        
        if (objectInfo) {
          this.assignmentData = objectInfo;
          
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
          this.errorMessage = 'Invalid assignment data';
          this.toastr.error('Invalid assignment data');
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load assignment data';
        this.toastr.error('Failed to load assignment data');
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
