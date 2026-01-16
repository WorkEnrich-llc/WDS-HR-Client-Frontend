import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AssignmentService } from '../../../../core/services/recruitment/assignment.service';
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
export class AssignmentQuestionsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);
  private assignmentService = inject(AssignmentService);
  private themeService = inject(ThemeService);

  accessToken: string | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  assignmentData: any = null;

  // Navbar and Footer data
  logoData: LogoData = {};
  socialMediaLinks: SocialMediaLinks = {};
  websiteUrl: string | null = null;

  // Timer
  totalMinutes: number = 0;
  remainingSeconds: number = 0;
  timerInterval: any = null;

  // Questions
  currentQuestionIndex: number = 0;
  questions: any[] = [];
  answers: { [key: number]: string } = {};
  currentAnswer: string = '';

  // Go To dropdown
  showGoToDropdown: boolean = false;

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

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private loadAssignmentData(): void {
    this.isLoading = true;
    this.assignmentService.getAssignmentData(this.accessToken!).subscribe({
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
            
            this.websiteUrl = objectInfo.company.social_links?.website || null;
          }
          
          this.initializeFromData();
        } else {
          this.errorMessage = 'Invalid assignment data';
          this.toastr.error('Invalid assignment data');
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to load assignment questions';
        this.toastr.error('Failed to load assignment questions');
        console.error('Error loading assignment questions:', error);
      }
    });
  }

  private initializeFromData(): void {
    if (!this.assignmentData) return;

    // Initialize timer
    if (this.assignmentData.assignment?.duration_minutes) {
      this.totalMinutes = this.assignmentData.assignment.duration_minutes;
      this.remainingSeconds = this.totalMinutes * 60;
      this.startTimer();
    }

    // Load questions from assignment data
    this.loadQuestions();
  }

  private loadQuestions(): void {
    // Load questions from assignment data
    if (this.assignmentData?.questions && Array.isArray(this.assignmentData.questions)) {
      this.questions = this.assignmentData.questions.map((q: any, index: number) => ({
        id: q.id || index + 1,
        title: q.title || q.question || `Question ${index + 1}`,
        type: q.type || 'text',
        answer: ''
      }));
    } else {
      // Fallback: create placeholder questions based on total count
      const totalQuestions = this.assignmentData?.assignment?.questions_details?.total || 0;
      this.questions = Array.from({ length: totalQuestions }, (_, i) => ({
        id: i + 1,
        title: `Question ${i + 1}`,
        type: 'text',
        answer: ''
      }));
    }
    
    // Initialize current answer
    if (this.questions.length > 0) {
      this.currentAnswer = this.answers[this.questions[0].id] || '';
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
    const elapsed = totalSeconds - this.remainingSeconds;
    return (elapsed / totalSeconds) * 100;
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
      this.currentQuestionIndex = index;
      this.currentAnswer = this.answers[this.questions[index].id] || '';
      this.showGoToDropdown = false;
    }
  }

  /**
   * Toggle Go To dropdown
   */
  toggleGoToDropdown(): void {
    this.showGoToDropdown = !this.showGoToDropdown;
  }

  /**
   * Go to next question
   */
  nextQuestion(): void {
    this.saveAnswer();
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      const nextQuestion = this.questions[this.currentQuestionIndex];
      this.currentAnswer = this.answers[nextQuestion.id] || '';
    } else {
      // Last question - submit assignment
      this.submitAssignment();
    }
  }

  /**
   * Save current answer
   */
  saveAnswer(): void {
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion) {
      this.answers[currentQuestion.id] = this.currentAnswer || '';
    }
  }

  /**
   * Submit assignment
   */
  submitAssignment(): void {
    // TODO: Implement API call to submit assignment
    this.toastr.success('Assignment submitted successfully!');
    console.log('Submitting assignment with answers:', this.answers);
  }

  /**
   * Check if question is answered
   */
  isQuestionAnswered(index: number): boolean {
    const question = this.questions[index];
    return question && !!this.answers[question.id];
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
}
