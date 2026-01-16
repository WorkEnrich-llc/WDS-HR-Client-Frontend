import { Component, OnInit, OnDestroy, inject, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { AssignmentService } from '../../../../core/services/recruitment/assignment.service';
import { AssignmentStateService } from '../../../../core/services/recruitment/assignment-state.service';
import { NavbarComponent, LogoData, SocialMediaLinks } from '../../../../client-job-board/layouts/navbar/navbar.component';
import { FooterComponent } from '../../../../client-job-board/layouts/footer/footer.component';
import { ThemeService } from '../../../../client-job-board/services/theme.service';

@Component({
  selector: 'app-assignment-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './questions.component.html',
  styleUrl: './questions.component.css'
})
export class AssignmentQuestionsComponent implements OnInit, OnDestroy, AfterViewInit {
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);
  private assignmentService = inject(AssignmentService);
  private assignmentStateService = inject(AssignmentStateService);
  private themeService = inject(ThemeService);
  private elementRef = inject(ElementRef);

  @ViewChild('mainContent') mainContent?: ElementRef<HTMLElement>;
  @ViewChild('goToContainer') goToContainer?: ElementRef<HTMLElement>;

  accessToken: string | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  errorHandling: Array<{ field: string; error: string }> = [];
  assignmentData: any = null;

  // Navbar and Footer data
  logoData: LogoData = {};
  socialMediaLinks: SocialMediaLinks = {};
  websiteUrl: string | null = null;

  // Timer
  totalMinutes: number = 0;
  remainingSeconds: number = 0;
  timerInterval: any = null;

  // Event listener references for cleanup
  private preventContextMenuHandler?: (e: MouseEvent) => void;
  private preventDevToolsHandler?: (e: KeyboardEvent) => boolean | void;
  private clickOutsideHandler?: (e: MouseEvent) => void;
  private keyboardNavigationHandler?: (event: KeyboardEvent) => void;
  private componentKeydownHandler?: (e: KeyboardEvent) => void;
  private componentCopyHandler?: (e: ClipboardEvent) => void;
  private componentCutHandler?: (e: ClipboardEvent) => void;
  private componentPasteHandler?: (e: ClipboardEvent) => void;
  private componentDragStartHandler?: (e: DragEvent) => void;

  // Subscription management
  private destroy$ = new Subject<void>();

  // Questions
  currentQuestionIndex: number = 0;
  questions: any[] = [];
  answers: { [key: number]: { selected_answer_id?: number | null; text_answer?: string | null } } = {};
  originalAnswers: { [key: number]: { selected_answer_id?: number | null; text_answer?: string | null } } = {};
  currentAnswer: string = '';
  currentSelectedAnswerId: number | null = null;

  // Go To dropdown
  showGoToDropdown: boolean = false;

  // Loading state for submitting answers
  isSubmittingAnswer: boolean = false;

  // Validation error message
  validationError: string | null = null;

  // Accessibility: Screen reader announcements
  screenReaderAnnouncement: string = '';

  // Accessibility: Skip link visibility
  showSkipLink: boolean = false;
  
  private popupRedirectChecked: boolean = false;
  
  // Track if user has started keyboard navigation
  keyboardNavigationStarted: boolean = false;

  ngOnInit(): void {
    // Check if opened in main window and redirect to popup
    this.checkAndOpenInPopup();
    
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
      this.accessToken = params['s'] || null;

      if (this.accessToken) {
        // Check if overview data exists in service (from assignment overview page)
        const overviewData = this.assignmentStateService.getOverviewData(this.accessToken);

        if (overviewData) {
          // Use saved overview data for theme, navbar, and footer
          this.setupFromOverviewData(overviewData);
          // Load questions data
          this.loadAssignmentData();
        } else {
          // No saved data - call overview API first to get theme, navbar, footer
          this.loadOverviewData();
        }
      } else {
        this.isLoading = false;
        this.errorMessage = 'Invalid access token';
        this.toastr.error('Invalid access token');
      }
    });
  }

  /**
   * Check if page is opened in main window and redirect to popup window
   */
  private checkAndOpenInPopup(): void {
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

    // Don't auto-focus - wait for user to start keyboard navigation
    // Listen for first keyboard interaction to enable focus
    this.setupKeyboardNavigationListener();
    
    // Setup click outside listener for dropdown
    this.setupClickOutsideListener();
  }

  /**
   * Setup listener to detect when user starts keyboard navigation
   */
  private setupKeyboardNavigationListener(): void {
    // Listen for keyboard events to detect when user starts navigating
    this.keyboardNavigationHandler = (event: KeyboardEvent): void => {
      // Ignore keyboard shortcuts we're preventing
      if ((event.ctrlKey || event.metaKey) && 
          (event.key === 'c' || event.key === 'C' || 
           event.key === 'x' || event.key === 'X' || 
           event.key === 'v' || event.key === 'V' || 
           event.key === 'a' || event.key === 'A' || 
           event.key === 's' || event.key === 'S' || 
           event.key === 'p' || event.key === 'P' || 
           event.key === 'u' || event.key === 'U')) {
        return;
      }

      // User started keyboard navigation
      if (!this.keyboardNavigationStarted) {
        this.keyboardNavigationStarted = true;
        
        // Enable keyboard navigation by making question cards focusable
        const questionCards = this.elementRef.nativeElement.querySelectorAll('.question-card');
        questionCards.forEach((card: HTMLElement) => {
          card.setAttribute('tabindex', '0');
        });
        
        // Remove listener after first keyboard interaction
        if (this.keyboardNavigationHandler) {
          document.removeEventListener('keydown', this.keyboardNavigationHandler);
        }
      }
    };

    // Add listener for keyboard events
    document.addEventListener('keydown', this.keyboardNavigationHandler, { once: false });
  }

  ngOnDestroy(): void {
    // Complete destroy subject to unsubscribe from all subscriptions
    this.destroy$.next();
    this.destroy$.complete();

    // Clear timer interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    // Remove document-level event listeners
    if (this.preventContextMenuHandler) {
      document.removeEventListener('contextmenu', this.preventContextMenuHandler);
    }
    if (this.preventDevToolsHandler) {
      document.removeEventListener('keydown', this.preventDevToolsHandler, true);
    }
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler, true);
    }
    if (this.keyboardNavigationHandler) {
      document.removeEventListener('keydown', this.keyboardNavigationHandler);
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

      // Additional F12 prevention at component level
      if (e.key === 'F12' || e.key === 'F8') {
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

  /**
   * Keyboard navigation handler
   */
  @HostListener('keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
    // Mark keyboard navigation as started on any keyboard interaction
    if (!this.keyboardNavigationStarted) {
      // Ignore keyboard shortcuts we're preventing
      if (!((event.ctrlKey || event.metaKey) && 
          (event.key === 'c' || event.key === 'C' || 
           event.key === 'x' || event.key === 'X' || 
           event.key === 'v' || event.key === 'V' || 
           event.key === 'a' || event.key === 'A' || 
           event.key === 's' || event.key === 'S' || 
           event.key === 'p' || event.key === 'P' || 
           event.key === 'u' || event.key === 'U'))) {
        this.keyboardNavigationStarted = true;
        
        // Enable keyboard navigation by making question cards focusable
        setTimeout(() => {
          const questionCards = this.elementRef.nativeElement.querySelectorAll('.question-card');
          questionCards.forEach((card: HTMLElement) => {
            card.setAttribute('tabindex', '0');
          });
        }, 0);
      }
    }
    
    // Escape key: Close dropdown or go back
    if (event.key === 'Escape') {
      if (this.showGoToDropdown) {
        this.showGoToDropdown = false;
        event.preventDefault();
      }
    }

    // Arrow keys for question navigation (when focus is not on input elements)
    const target = event.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

    if (!isInputElement) {
      // Left Arrow: Previous question
      if (event.key === 'ArrowLeft' && this.currentQuestionIndex > 0) {
        this.previousQuestion();
        this.announceToScreenReader(`Navigated to question ${this.currentQuestionIndex + 1}`);
        event.preventDefault();
      }

      // Right Arrow: Next question
      if (event.key === 'ArrowRight' && this.currentQuestionIndex < this.questions.length - 1) {
        this.nextQuestion();
        this.announceToScreenReader(`Navigated to question ${this.currentQuestionIndex + 1}`);
        event.preventDefault();
      }

      // Number keys 1-9: Jump to question (when not typing)
      if (event.key >= '1' && event.key <= '9' && !event.ctrlKey && !event.metaKey) {
        const questionIndex = parseInt(event.key) - 1;
        if (questionIndex >= 0 && questionIndex < this.questions.length) {
          this.goToQuestion(questionIndex);
          this.announceToScreenReader(`Jumped to question ${questionIndex + 1}`);
          event.preventDefault();
        }
      }
    }

    // Enter/Space on question indicator: Navigate to that question
    if ((event.key === 'Enter' || event.key === ' ') && target.classList.contains('question-indicator')) {
      const questionIndex = this.questions.findIndex((_, i) => {
        const indicator = this.elementRef.nativeElement.querySelector(`[aria-label*="Question ${i + 1}"]`);
        return indicator === target;
      });
      if (questionIndex >= 0) {
        this.goToQuestion(questionIndex);
        this.announceToScreenReader(`Navigated to question ${questionIndex + 1}`);
        event.preventDefault();
      }
    }
  }

  /**
   * Announce message to screen readers
   */
  private announceToScreenReader(message: string): void {
    this.screenReaderAnnouncement = message;
    setTimeout(() => {
      this.screenReaderAnnouncement = '';
    }, 1000);
  }

  /**
   * Get dynamic aria-label for current question
   */
  getCurrentQuestionAriaLabel(): string {
    const question = this.getCurrentQuestion();
    if (!question) return '';

    const questionNum = this.currentQuestionIndex + 1;
    const totalQuestions = this.questions.length;
    const isAnswered = this.isQuestionAnswered(this.currentQuestionIndex);
    const questionType = question.type === 'MCQ' ? 'Multiple choice' : 'Text';

    return `Question ${questionNum} of ${totalQuestions}, ${questionType} question${isAnswered ? ', answered' : ', not answered'}. ${question.text}`;
  }

  /**
   * Get timer aria-label
   */
  getTimerAriaLabel(): string {
    const remaining = this.getTimeRemaining();
    const total = this.getTotalTime();
    const progress = Math.round(this.getTimerProgress());
    return `Timer: ${remaining} remaining out of ${total} total. ${progress}% complete.`;
  }

  /**
   * Load assignment overview data (for theme, navbar, footer)
   * Called when navigating directly to questions route
   */
  private loadOverviewData(): void {
    this.assignmentService.getAssignmentOverview(this.accessToken!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response) => {
        // Check for error_handling array first
        const errorHandling = response?.data?.error_handling || response?.error_handling;
        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          this.errorHandling = errorHandling;
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          this.errorMessage = errorMessages.join('. ') || 'An error occurred';
          this.toastr.error(this.errorMessage || 'An error occurred');
          this.isLoading = false;
          return;
        }

        const objectInfo = response?.data?.object_info || response?.object_info;

        if (objectInfo?.company) {
          // Save overview data to service
          this.assignmentStateService.setOverviewData(this.accessToken!, {
            company: {
              theme: objectInfo.company.theme,
              logo_url: objectInfo.company.logo_url,
              name: objectInfo.company.name,
              title: objectInfo.company.title,
              social_links: objectInfo.company.social_links
            }
          });

          // Setup theme, navbar, and footer from overview data
          this.setupFromOverviewData({
            company: objectInfo.company
          });
        }

        // Now load questions data
        this.loadAssignmentData();
      },
      error: (error) => {
        // Check if error response has error_handling array
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
          this.errorMessage = error.error?.message || error.message || 'Failed to load assignment overview';
          this.toastr.error(this.errorMessage || 'Failed to load assignment overview');
        }

        this.isLoading = false;
        console.error('Error loading assignment overview:', error);
      }
    });
  }

  /**
   * Setup theme, navbar, and footer from overview data
   */
  private setupFromOverviewData(overviewData: { company?: any }): void {
    if (overviewData.company) {
      // Apply theme color
      if (overviewData.company.theme) {
        this.themeService.setThemeColor(overviewData.company.theme);
      }

      // Set up navbar and footer data
      this.logoData = {
        icon: overviewData.company.logo_url || undefined,
        companyName: overviewData.company.name || undefined,
        tagline: overviewData.company.title || undefined
      };

      // Set up social media links
      if (overviewData.company.social_links) {
        this.socialMediaLinks = {};
        if (overviewData.company.social_links.facebook) {
          this.socialMediaLinks.facebook = overviewData.company.social_links.facebook;
        }
        if (overviewData.company.social_links.instagram) {
          this.socialMediaLinks.instagram = overviewData.company.social_links.instagram;
        }
        if (overviewData.company.social_links.x) {
          this.socialMediaLinks.twitter = overviewData.company.social_links.x;
        }
        if (overviewData.company.social_links.linkedin) {
          this.socialMediaLinks.linkedin = overviewData.company.social_links.linkedin;
        }
      }

      this.websiteUrl = overviewData.company.social_links?.website || null;
    }
  }

  private loadAssignmentData(): void {
    this.isLoading = true;
    this.errorHandling = [];
    this.errorMessage = null;

    this.assignmentService.getAssignmentData(this.accessToken!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response) => {
        // Check for error_handling array first
        const errorHandling = response?.data?.error_handling || response?.error_handling;
        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          this.errorHandling = errorHandling;
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          this.errorMessage = errorMessages.join('. ') || 'An error occurred';
          this.toastr.error(this.errorMessage || 'An error occurred');
          this.assignmentData = null;
          this.isLoading = false;
          return;
        }

        // Clear any previous errors
        this.errorHandling = [];
        this.errorMessage = null;

        const objectInfo = response.data?.object_info;

        if (objectInfo) {
          this.assignmentData = objectInfo;

          // Theme, navbar, and footer are already set from overview data (either from service or API call)
          // Only set them here if they weren't set yet (fallback)
          if (!this.logoData.companyName && objectInfo.company) {
            this.setupFromOverviewData({
              company: objectInfo.company
            });
          }

          this.initializeFromData();
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
          this.errorMessage = error.error?.message || error.message || 'Failed to load assignment questions';
          this.toastr.error(this.errorMessage || 'Failed to load assignment questions');
        }

        this.assignmentData = null;
        console.error('Error loading assignment questions:', error);
      }
    });
  }

  private initializeFromData(): void {
    if (!this.assignmentData) return;

    // Initialize timer from remaining_seconds or calculate from duration_minutes
    if (this.assignmentData.applicant_assignment?.remaining_seconds !== undefined) {
      this.remainingSeconds = this.assignmentData.applicant_assignment.remaining_seconds;
    } else if (this.assignmentData.assignment?.duration_minutes) {
      this.totalMinutes = this.assignmentData.assignment.duration_minutes;
      this.remainingSeconds = this.totalMinutes * 60;
    }

    if (this.assignmentData.assignment?.duration_minutes) {
      this.totalMinutes = this.assignmentData.assignment.duration_minutes;
    }

    if (this.remainingSeconds > 0) {
      this.startTimer();
    }

    // Load questions from assignment data
    this.loadQuestions();
  }

  private loadQuestions(): void {
    // Load questions from assignment data
    if (this.assignmentData?.questions && Array.isArray(this.assignmentData.questions)) {
      // Sort questions by order if available
      const sortedQuestions = [...this.assignmentData.questions].sort((a, b) => {
        return (a.order || 0) - (b.order || 0);
      });

      this.questions = sortedQuestions.map((q: any) => ({
        id: q.id,
        text: q.text,
        type: q.type || 'text',
        order: q.order,
        points: q.points,
        selected_answer_id: q.selected_answer_id || null,
        text_answer: q.text_answer || null,
        answers: q.answers || []
      }));

      // Initialize answers from existing data
      this.questions.forEach((q: any) => {
        const answerData = {
          selected_answer_id: q.selected_answer_id || null,
          text_answer: q.text_answer || null
        };
        // Store both current and original answers
        this.answers[q.id] = { ...answerData };
        this.originalAnswers[q.id] = { ...answerData };
      });
    } else {
      // Fallback: create placeholder questions based on total count
      const totalQuestions = this.assignmentData?.assignment?.questions_count || 0;
      this.questions = Array.from({ length: totalQuestions }, (_, i) => ({
        id: i + 1,
        text: `Question ${i + 1}`,
        type: 'text',
        order: i + 1,
        points: 0,
        selected_answer_id: null,
        text_answer: null,
        answers: []
      }));
    }

    // Find the first question that doesn't have an answer, otherwise start at first question
    let initialQuestionIndex = 0;
    if (this.questions.length > 0) {
      const firstUnansweredIndex = this.questions.findIndex((q: any, index: number) => {
        const answer = this.answers[q.id];
        
        // If no answer object exists, this question is unanswered
        if (!answer) return true;

        // Check if question has an answer based on type
        if (q.type === 'MCQ' || q.type === 'True & False') {
          return answer.selected_answer_id === null || answer.selected_answer_id === undefined;
        } else if (q.type === 'Text') {
          return !answer.text_answer || answer.text_answer.trim() === '';
        }
        
        // Default: consider unanswered
        return true;
      });

      // If a question without answer is found, use it; otherwise start at first question
      if (firstUnansweredIndex !== -1) {
        initialQuestionIndex = firstUnansweredIndex;
      }

      this.currentQuestionIndex = initialQuestionIndex;

      // Initialize current answer for the selected question
      const currentQuestion = this.questions[initialQuestionIndex];
      if (currentQuestion) {
        if (currentQuestion.type === 'MCQ' || currentQuestion.type === 'True & False') {
          this.currentSelectedAnswerId = this.answers[currentQuestion.id]?.selected_answer_id || null;
          this.currentAnswer = '';
        } else {
          this.currentAnswer = this.answers[currentQuestion.id]?.text_answer || '';
          this.currentSelectedAnswerId = null;
        }
      }
    }
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        this.onTimeUp();
      }
    }, 1000);
  }

  private onTimeUp(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.toastr.warning('Time is up!');
    // TODO: Auto-submit assignment
  }

  /**
   * Get formatted time remaining (MM:SS)
   */
  getTimeRemaining(): string {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get formatted total time (MM:SS)
   */
  getTotalTime(): string {
    const totalSeconds = this.totalMinutes * 60;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get progress percentage for timer bar
   */
  getTimerProgress(): number {
    const totalSeconds = this.totalMinutes * 60;
    if (totalSeconds === 0) return 0;
    const elapsed = totalSeconds - this.remainingSeconds;
    return Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));
  }

  /**
   * Get count of answered questions
   */
  getAnsweredCount(): number {
    return this.questions.filter((q, index) => this.isQuestionAnswered(index)).length;
  }

  /**
   * Get current question
   */
  getCurrentQuestion(): any {
    return this.questions[this.currentQuestionIndex] || null;
  }

  /**
   * Get total questions count
   */
  getTotalQuestions(): number {
    return this.questions.length;
  }

  /**
   * Get assignment title
   */
  getAssignmentTitle(): string {
    return this.assignmentData?.assignment?.name ||
      this.assignmentData?.job?.job_title ||
      'Assignment';
  }

  /**
   * Navigate to specific question
   */
  goToQuestion(index: number): void {
    if (index >= 0 && index < this.questions.length) {
      // Save current answer before navigating
      this.saveAnswer();
      // Clear validation error when navigating
      this.validationError = null;
      this.currentQuestionIndex = index;
      const question = this.questions[index];
      if (question.type === 'MCQ') {
        this.currentSelectedAnswerId = this.answers[question.id]?.selected_answer_id || null;
        this.currentAnswer = '';
      } else {
        this.currentAnswer = this.answers[question.id]?.text_answer || '';
        this.currentSelectedAnswerId = null;
      }
      this.showGoToDropdown = false;

      // Announce navigation to screen reader
      this.announceToScreenReader(`Question ${index + 1} of ${this.questions.length}`);
      
      // Don't auto-focus - only focus if user has started keyboard navigation
      // This prevents unwanted focus outline on page load
    }
  }

  /**
   * Toggle Go To dropdown
   */
  toggleGoToDropdown(): void {
    this.showGoToDropdown = !this.showGoToDropdown;
  }

  /**
   * Setup click outside listener to close dropdown
   */
  private setupClickOutsideListener(): void {
    this.clickOutsideHandler = (e: MouseEvent): void => {
      // Only handle if dropdown is open
      if (!this.showGoToDropdown) {
        return;
      }

      // Check if click is outside the dropdown container
      if (this.goToContainer?.nativeElement) {
        const clickedElement = e.target as HTMLElement;
        const container = this.goToContainer.nativeElement;
        
        // Check if click is outside the container
        if (!container.contains(clickedElement)) {
          this.showGoToDropdown = false;
        }
      }
    };

    // Add listener with capture phase to catch clicks early
    document.addEventListener('click', this.clickOutsideHandler, true);
  }

  /**
   * Go to previous question
   */
  previousQuestion(): void {
    this.saveAnswer();
    // Clear validation error when navigating
    this.validationError = null;
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      const question = this.questions[this.currentQuestionIndex];
      if (question.type === 'MCQ') {
        this.currentSelectedAnswerId = this.answers[question.id]?.selected_answer_id || null;
        this.currentAnswer = '';
      } else {
        this.currentAnswer = this.answers[question.id]?.text_answer || '';
        this.currentSelectedAnswerId = null;
      }
    }
  }

  /**
   * Go to next question
   */
  nextQuestion(): void {
    if (this.isSubmittingAnswer) {
      return; // Prevent multiple submissions
    }

    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      return;
    }

    // Save current answer locally first
    this.saveAnswer();

    // Get the answer data for the current question
    const answerData = this.answers[currentQuestion.id];
    if (!answerData) {
      this.validationError = 'Please provide an answer before proceeding';
      return;
    }

    // Check if answer is valid
    const hasAnswer = currentQuestion.type === 'MCQ'
      ? (answerData.selected_answer_id !== null && answerData.selected_answer_id !== undefined)
      : (answerData.text_answer && answerData.text_answer.trim() !== '');

    if (!hasAnswer) {
      this.validationError = 'Please provide an answer before proceeding';
      return;
    }

    // Clear validation error if answer is valid
    this.validationError = null;

    // Check if answer has changed from the original
    const originalAnswer = this.originalAnswers[currentQuestion.id];
    const hasAnswerChanged = this.hasAnswerChanged(currentQuestion, answerData, originalAnswer);

    // If answer hasn't changed, just navigate to next question without calling API
    if (!hasAnswerChanged) {
      // If on last question, submit assignment; otherwise navigate to next
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.navigateToNextQuestion();
      } else {
        // Already on last question - submit assignment
        this.submitAssignment();
      }
      return;
    }

    // Submit answer to API only if it has changed
    this.isSubmittingAnswer = true;
    this.assignmentService.submitAnswer(
      this.accessToken!,
      currentQuestion.id,
      answerData.selected_answer_id || null,
      answerData.text_answer || null
    ).subscribe({
      next: (response) => {
        this.isSubmittingAnswer = false;

        // Check for error_handling in response
        const errorHandling = response?.data?.error_handling || response?.error_handling;
        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          const errorMessage = errorMessages.join('. ') || 'An error occurred';
          this.toastr.error(errorMessage);
          return;
        }

        // Update original answer after successful submission
        this.originalAnswers[currentQuestion.id] = {
          selected_answer_id: answerData.selected_answer_id || null,
          text_answer: answerData.text_answer || null
        };

        // Move to next question or submit assignment
        if (this.currentQuestionIndex < this.questions.length - 1) {
          this.navigateToNextQuestion();
        } else {
          // Already on last question - submit assignment
          this.submitAssignment();
        }
      },
      error: (error) => {
        this.isSubmittingAnswer = false;

        // Check for error_handling in error response
        const errorHandling = error.error?.data?.error_handling ||
          error.error?.error_handling ||
          error?.data?.error_handling ||
          error?.error_handling;

        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          const errorMessage = errorMessages.join('. ') || 'An error occurred';
          this.toastr.error(errorMessage);
        } else {
          this.toastr.error(error.error?.message || error.message || 'Failed to submit answer');
        }
        console.error('Error submitting answer:', error);
      }
    });
  }

  /**
   * Save current answer
   */
  saveAnswer(): void {
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion) {
      if (currentQuestion.type === 'MCQ') {
        this.answers[currentQuestion.id] = {
          selected_answer_id: this.currentSelectedAnswerId,
          text_answer: null
        };
      } else {
        this.answers[currentQuestion.id] = {
          selected_answer_id: null,
          text_answer: this.currentAnswer || null
        };
      }
      // Clear validation error when answer is saved
      if (currentQuestion.type === 'text' && this.currentAnswer && this.currentAnswer.trim() !== '') {
        this.validationError = null;
      }
    }
  }

  /**
   * Handle MCQ answer selection
   */
  onAnswerSelect(answerId: number): void {
    this.currentSelectedAnswerId = answerId;
    this.saveAnswer();
    // Clear validation error when answer is selected
    this.validationError = null;
  }

  /**
   * Submit assignment (called for the last question)
   */
  submitAssignment(): void {
    if (this.isSubmittingAnswer) {
      return; // Prevent multiple submissions
    }

    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion) {
      return;
    }

    // Get the answer data for the current (last) question
    const answerData = this.answers[currentQuestion.id];
    if (!answerData) {
      this.validationError = 'Please provide an answer before proceeding';
      return;
    }

    // Check if answer is valid
    const hasAnswer = currentQuestion.type === 'MCQ'
      ? (answerData.selected_answer_id !== null && answerData.selected_answer_id !== undefined)
      : (answerData.text_answer && answerData.text_answer.trim() !== '');

    if (!hasAnswer) {
      this.validationError = 'Please provide an answer before proceeding';
      return;
    }

    // Clear validation error if answer is valid
    this.validationError = null;

    // Check if answer has changed from the original
    const originalAnswer = this.originalAnswers[currentQuestion.id];
    const hasAnswerChanged = this.hasAnswerChanged(currentQuestion, answerData, originalAnswer);

    // If answer hasn't changed, just show success message without calling API
    if (!hasAnswerChanged) {
      // TODO: Navigate to success page or show completion message
      return;
    }

    // Submit last answer to API only if it has changed
    this.isSubmittingAnswer = true;
    this.assignmentService.submitAnswer(
      this.accessToken!,
      currentQuestion.id,
      answerData.selected_answer_id || null,
      answerData.text_answer || null
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response) => {
        this.isSubmittingAnswer = false;

        // Check for error_handling in response
        const errorHandling = response?.data?.error_handling || response?.error_handling;
        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          const errorMessage = errorMessages.join('. ') || 'An error occurred';
          this.toastr.error(errorMessage);
          return;
        }

        // Update original answer after successful submission
        this.originalAnswers[currentQuestion.id] = {
          selected_answer_id: answerData.selected_answer_id || null,
          text_answer: answerData.text_answer || null
        };

        // Assignment submitted successfully
        this.toastr.success('Assignment submitted successfully!');

        // TODO: Navigate to success page or show completion message
      },
      error: (error) => {
        this.isSubmittingAnswer = false;

        // Check for error_handling in error response
        const errorHandling = error.error?.data?.error_handling ||
          error.error?.error_handling ||
          error?.data?.error_handling ||
          error?.error_handling;

        if (errorHandling && Array.isArray(errorHandling) && errorHandling.length > 0) {
          const errorMessages = errorHandling.map(err => err.error || err.message).filter(Boolean);
          const errorMessage = errorMessages.join('. ') || 'An error occurred';
          this.toastr.error(errorMessage);
        } else {
          this.toastr.error(error.error?.message || error.message || 'Failed to submit assignment');
        }
        console.error('Error submitting assignment:', error);
      }
    });
  }

  /**
   * Check if question is answered
   */
  isQuestionAnswered(index: number): boolean {
    const question = this.questions[index];
    if (!question) return false;
    const answer = this.answers[question.id];
    if (!answer) return false;

    if (question.type === 'MCQ') {
      return answer.selected_answer_id !== null && answer.selected_answer_id !== undefined;
    } else {
      return !!answer.text_answer && answer.text_answer.trim() !== '';
    }
  }

  /**
   * Get question status class
   */
  getQuestionStatusClass(index: number): string {
    if (index === this.currentQuestionIndex) {
      return 'active';
    }
    if (this.isQuestionAnswered(index)) {
      return 'answered';
    }
    return 'pending';
  }

  /**
   * Check if answer has changed from the original
   */
  private hasAnswerChanged(
    question: any,
    currentAnswer: { selected_answer_id?: number | null; text_answer?: string | null },
    originalAnswer?: { selected_answer_id?: number | null; text_answer?: string | null }
  ): boolean {
    // If no original answer exists, it's a new answer (changed)
    if (!originalAnswer) {
      return true;
    }

    if (question.type === 'MCQ') {
      // For MCQ, compare selected_answer_id
      const currentId = currentAnswer.selected_answer_id ?? null;
      const originalId = originalAnswer.selected_answer_id ?? null;
      return currentId !== originalId;
    } else {
      // For text questions, compare text_answer (trimmed)
      const currentText = (currentAnswer.text_answer || '').trim();
      const originalText = (originalAnswer.text_answer || '').trim();
      return currentText !== originalText;
    }
  }

  /**
   * Navigate to next question
   */
  private navigateToNextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      const question = this.questions[this.currentQuestionIndex];
      if (question.type === 'MCQ') {
        this.currentSelectedAnswerId = this.answers[question.id]?.selected_answer_id || null;
        this.currentAnswer = '';
      } else {
        this.currentAnswer = this.answers[question.id]?.text_answer || '';
        this.currentSelectedAnswerId = null;
      }
    } else {
      // Last question - submit assignment
      this.submitAssignment();
    }
  }
}
