import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
export class AssignmentComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private assignmentService = inject(AssignmentService);
  private assignmentStateService = inject(AssignmentStateService);
  private toastr = inject(ToastrService);
  private themeService = inject(ThemeService);
  private elementRef = inject(ElementRef);

  accessToken: string | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  errorHandling: Array<{ field: string; error: string }> = [];
  assignmentData: any = null;

  // View state
  isStartingAssignment: boolean = false;
  private popupRedirectChecked: boolean = false;
  showTimeOverlay: boolean = false;

  // Navbar and Footer data
  logoData: LogoData = {};
  socialMediaLinks: SocialMediaLinks = {};
  websiteUrl: string | null = null;

  // Event listener references for cleanup
  private preventContextMenuHandler?: (e: MouseEvent) => void;
  private preventDevToolsHandler?: (e: KeyboardEvent) => boolean | void;
  private componentKeydownHandler?: (e: KeyboardEvent) => void;
  private componentCopyHandler?: (e: ClipboardEvent) => void;
  private componentCutHandler?: (e: ClipboardEvent) => void;
  private componentPasteHandler?: (e: ClipboardEvent) => void;
  private componentDragStartHandler?: (e: DragEvent) => void;

  // Subscription management
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Check if opened in main window and redirect to popup
    this.checkAndOpenInPopup();

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
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

  /**
   * Detect mobile/touch devices. Popup flow (window.open, close, etc.) causes
   * broken behavior on mobile (tabs, blank screen, close fails); skip it.
   */
  private isMobile(): boolean {
    if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
  }

  /**
   * Check if page is opened in main window and redirect to popup window
   */
  private checkAndOpenInPopup(): void {
    // Skip popup flow on mobile: window.open/close causes blank tabs, focus issues, etc.
    if (this.isMobile()) {
      return;
    }

    // Prevent multiple checks
    if (this.popupRedirectChecked) {
      return;
    }
    this.popupRedirectChecked = true;

    // If window has opener or parent, it's already in a popup/iframe - don't redirect
    if (window.opener || window.parent !== window || window.frameElement) {
      return;
    }

    // Check if there's a flag in sessionStorage to prevent redirect loops
    const alreadyRedirected = sessionStorage.getItem('assignment_popup_redirected');
    if (alreadyRedirected === 'true') {
      sessionStorage.removeItem('assignment_popup_redirected');
      return;
    }

    // Get current URL with query parameters
    const currentUrl = window.location.href;

    // Calculate popup dimensions (adjust as needed)
    const width = Math.min(1400, window.screen.width - 100);
    const height = Math.min(900, window.screen.height - 100);
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Window features for popup without browser UI
    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'toolbar=no',
      'menubar=no',
      'location=no',
      'directories=no',
      'status=no',
      'resizable=yes',
      'scrollbars=yes',
      'fullscreen=no'
    ].join(',');

    // Set flag to prevent redirect in the popup
    sessionStorage.setItem('assignment_popup_redirected', 'true');

    // Open popup window
    const popup = window.open(currentUrl, '_blank', features);

    if (popup) {
      // Focus the popup
      popup.focus();

      // Hide current window content and show redirect message
      setTimeout(() => {
        if (document.body) {
          document.body.style.display = 'none';
          const messageDiv = document.createElement('div');
          messageDiv.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: white; z-index: 99999;">
              <div style="text-align: center;">
                <p style="font-size: 18px; margin-bottom: 20px;">Opening assignment in a new window...</p>
                <p style="font-size: 14px; color: #666;">If the window doesn't open, please allow popups for this site.</p>
              </div>
            </div>
          `;
          document.body.appendChild(messageDiv);
        }
      }, 100);

      // Close current window after a short delay (browsers may block this)
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          // Ignore - window.close() may fail if window wasn't opened by script
        }
      }, 1000);
    } else {
      // Popup was blocked - show message
      sessionStorage.removeItem('assignment_popup_redirected');
      setTimeout(() => {
        if (document.body) {
          const messageDiv = document.createElement('div');
          messageDiv.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: white; z-index: 99999;">
              <div style="text-align: center; max-width: 600px; padding: 20px;">
                <h2 style="margin-bottom: 20px;">Popup Blocked</h2>
                <p style="margin-bottom: 20px;">Please allow popups for this site to open the assignment in a focused window.</p>
                <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px;">
                  Retry
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(messageDiv);
        }
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    // Prevent copying and text selection
    this.preventCopying();

    // Listen for time over event from questions component
    window.addEventListener('assignmentTimeOver', () => {
      this.showTimeOverlay = true;
      // Disable interactions
      if (document.body) {
        document.body.style.pointerEvents = 'none';
      }
    });
  }

  ngOnDestroy(): void {
    // Complete destroy subject to unsubscribe from all subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // Remove document-level event listeners
    if (this.preventContextMenuHandler) {
      document.removeEventListener('contextmenu', this.preventContextMenuHandler);
    }
    if (this.preventDevToolsHandler) {
      document.removeEventListener('keydown', this.preventDevToolsHandler, true);
    }

    // Remove time over event listener
    window.removeEventListener('assignmentTimeOver', () => { });

    // Restore pointer events
    if (document.body) {
      document.body.style.pointerEvents = 'auto';
    }

    // Remove component-level event listeners
    if (this.componentKeydownHandler) {
      this.elementRef.nativeElement.removeEventListener('keydown', this.componentKeydownHandler);
    }
    if (this.componentCopyHandler) {
      this.elementRef.nativeElement.removeEventListener('copy', this.componentCopyHandler);
    }
    if (this.componentCutHandler) {
      this.elementRef.nativeElement.removeEventListener('cut', this.componentCutHandler);
    }
    if (this.componentPasteHandler) {
      this.elementRef.nativeElement.removeEventListener('paste', this.componentPasteHandler);
    }
    if (this.componentDragStartHandler) {
      this.elementRef.nativeElement.removeEventListener('dragstart', this.componentDragStartHandler);
    }
  }

  /**
   * Check if running on localhost
   */
  private isLocalhost(): boolean {
    const hostname = window.location.hostname;
    return hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.');
  }

  /**
   * Prevent copying, text selection, and context menu
   */
  private preventCopying(): void {
    // Prevent context menu (right-click) - document level
    this.preventContextMenuHandler = (e: MouseEvent): void => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', this.preventContextMenuHandler);

    // Prevent keyboard shortcuts - document level for F12 and dev tools
    this.preventDevToolsHandler = (e: KeyboardEvent): boolean | void => {
      // Allow F12 on localhost for development
      const isF12 = e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F12');
      if (isF12 && this.isLocalhost()) {
        return; // Allow F12 on localhost
      }

      // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+Shift+K, Ctrl+U
      if (e.key === 'F12' ||
        e.key === 'F8' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'K')) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'U') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F12')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };
    document.addEventListener('keydown', this.preventDevToolsHandler, true);

    // Prevent keyboard shortcuts for copy - component level
    this.componentKeydownHandler = (e: KeyboardEvent): void => {
      // Prevent Ctrl+C, Ctrl+A, Ctrl+X, Ctrl+V, Ctrl+S, Ctrl+P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' ||
        e.key === 'x' || e.key === 'X' || e.key === 'v' || e.key === 'V' ||
        e.key === 'a' || e.key === 'A' || e.key === 's' || e.key === 'S' ||
        e.key === 'p' || e.key === 'P' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return;
      }

      // Additional F12 prevention at component level (skip on localhost)
      if ((e.key === 'F12' || e.key === 'F8') && !this.isLocalhost()) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    };
    this.elementRef.nativeElement.addEventListener('keydown', this.componentKeydownHandler);

    // Prevent copy, cut, paste events
    this.componentCopyHandler = (e: ClipboardEvent): void => {
      e.preventDefault();
    };
    this.elementRef.nativeElement.addEventListener('copy', this.componentCopyHandler);

    this.componentCutHandler = (e: ClipboardEvent): void => {
      e.preventDefault();
    };
    this.elementRef.nativeElement.addEventListener('cut', this.componentCutHandler);

    this.componentPasteHandler = (e: ClipboardEvent): void => {
      e.preventDefault();
    };
    this.elementRef.nativeElement.addEventListener('paste', this.componentPasteHandler);

    // Prevent drag and drop
    this.componentDragStartHandler = (e: DragEvent): void => {
      e.preventDefault();
    };
    this.elementRef.nativeElement.addEventListener('dragstart', this.componentDragStartHandler);
  }

  private loadAssignmentData(): void {
    this.isLoading = true;
    this.errorHandling = [];
    this.errorMessage = null;

    this.assignmentService.getAssignmentOverview(this.accessToken!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Check for error_handling array first (check both response.data and response directly)
          const errorHandling = response?.data?.error_handling || response?.error_handling;

          if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
            this.errorHandling = errorHandling;
            const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
            this.errorMessage = errorMessages.join('. ') || 'An error occurred';
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

            // Check assignment status
            const assignmentStatus = objectInfo.applicant_assignment?.status;
            const isSubmitted = assignmentStatus &&
              String(assignmentStatus).trim().toLowerCase() === 'submitted';
            const isStarted = assignmentStatus &&
              String(assignmentStatus).trim().toLowerCase() === 'started';

            // If assignment is submitted, don't navigate - just show overview with submitted state
            if (isSubmitted) {
              this.isLoading = false;
              return;
            }

            // Check if assignment is already started - navigate to questions

            if (isStarted) {
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
            // If object_info is null, check again for error_handling (in case it wasn't caught earlier)
            const errorHandlingRetry = response?.data?.error_handling || response?.error_handling;

            if (errorHandlingRetry && Array.isArray(errorHandlingRetry) && errorHandlingRetry.length > 0) {
              this.errorHandling = errorHandlingRetry;
              const errorMessages = errorHandlingRetry.map(err => err.error || err.message).filter(Boolean);
              this.errorMessage = errorMessages.join('. ') || 'An error occurred';
              this.toastr.error(this.errorMessage || 'An error occurred');
              this.assignmentData = null;
            } else {
              this.errorMessage = 'Invalid assignment data';
              this.toastr.error('Invalid assignment data');
            }
          }

          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;

          // Check if error response has error_handling array (check multiple possible locations)
          const errorHandling = error.error?.data?.error_handling ||
            error.error?.error_handling ||
            error?.data?.error_handling ||
            error?.error_handling;

          if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
            this.errorHandling = errorHandling;
            const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
            this.errorMessage = errorMessages.join('. ') || 'An error occurred';
            this.toastr.error(this.errorMessage || 'An error occurred');
          } else {
            // Also check if there's a message in error_handling format at root level
            const rootErrorHandling = error?.error_handling || error.error?.error_handling;
            if (rootErrorHandling && Array.isArray(rootErrorHandling) && rootErrorHandling.length > 0) {
              this.errorHandling = rootErrorHandling;
              const errorMessages = rootErrorHandling.map(err => err.error || err.message).filter(Boolean);
              this.errorMessage = errorMessages.join('. ') || 'An error occurred';
              this.toastr.error(this.errorMessage || 'An error occurred');
            } else {
              this.errorMessage = error.error?.message || error.message || 'Failed to load assignment data';
              this.toastr.error(this.errorMessage || 'Failed to load assignment data');
            }
          }

          this.assignmentData = null; // Ensure assignmentData is null when there are errors
          console.error('Error loading assignment data:', error);
        }
      });
  }

  /**
   * Handle time over confirmation
   */
  onTimeOverConfirm(): void {
    // Reload the page
    window.location.reload();
  }

  /**
   * Handle proceed to assignment
   */
  onProceedToAssignment(): void {
    if (!this.accessToken || this.isStartingAssignment) {
      return;
    }

    this.isStartingAssignment = true;

    this.assignmentService.startAssignment(this.accessToken)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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
