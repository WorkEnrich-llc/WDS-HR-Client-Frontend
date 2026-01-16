import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
export class AssignmentQuestionsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);
  private assignmentService = inject(AssignmentService);
  private assignmentStateService = inject(AssignmentStateService);
  private themeService = inject(ThemeService);

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

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
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

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  /**
   * Load assignment overview data (for theme, navbar, footer)
   * Called when navigating directly to questions route
   */
  private loadOverviewData(): void {
    this.assignmentService.getAssignmentOverview(this.accessToken!).subscribe({
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

    this.assignmentService.getAssignmentData(this.accessToken!).subscribe({
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

    // Find the first question that has an answer, otherwise start at first question
    let initialQuestionIndex = 0;
    if (this.questions.length > 0) {
      const firstAnsweredIndex = this.questions.findIndex((q: any, index: number) => {
        const answer = this.answers[q.id];
        if (!answer) return false;

        if (q.type === 'MCQ') {
          return answer.selected_answer_id !== null && answer.selected_answer_id !== undefined;
        } else {
          return !!answer.text_answer && answer.text_answer.trim() !== '';
        }
      });

      // If a question with answer is found, use it; otherwise start at first question
      if (firstAnsweredIndex !== -1) {
        initialQuestionIndex = firstAnsweredIndex;
      }

      this.currentQuestionIndex = initialQuestionIndex;

      // Initialize current answer for the selected question
      const currentQuestion = this.questions[initialQuestionIndex];
      if (currentQuestion) {
        if (currentQuestion.type === 'MCQ') {
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
    }
  }

  /**
   * Toggle Go To dropdown
   */
  toggleGoToDropdown(): void {
    this.showGoToDropdown = !this.showGoToDropdown;
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
      this.toastr.success('Assignment submitted successfully!');
      console.log('Assignment submitted with answers:', this.answers);
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

        // Assignment submitted successfully
        this.toastr.success('Assignment submitted successfully!');
        console.log('Assignment submitted with answers:', this.answers);

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
