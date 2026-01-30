import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { JobOpeningsService } from 'app/core/services/recruitment/job-openings/job-openings.service';
import { ToasterMessageService } from 'app/core/services/tostermessage/tostermessage.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-review-answers',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        PageHeaderComponent,
    ],
    templateUrl: './review-answers.component.html',
    styleUrl: './review-answers.component.css'
})
export class ReviewAnswersComponent implements OnInit, OnDestroy {
    private jobOpeningsService = inject(JobOpeningsService);
    private activatedRoute = inject(ActivatedRoute);
    private router = inject(Router);
    private toasterMessageService = inject(ToasterMessageService);
    private destroy$ = new Subject<void>();

    // Helper functions for template
    parseFloat = parseFloat;

    isLoading: boolean = false;
    applicantAssignmentId: number | null = null;
    applicantAssignment: any = null;
    assignment: any = null;
    applicant: any = null;
    applicantAnswers: any[] = [];
    breadcrumbs: any[] = [];

    // Review state
    reviewAnswers: Map<number, 'correct' | 'wrong' | null> = new Map();

    // Points input for essay questions
    essayPoints: Map<number, number> = new Map();

    // Loading states for essay question submissions
    essayLoading: Map<number, boolean> = new Map();

    // Validation states for essay questions
    essayValidationErrors: Map<number, string> = new Map();

    ngOnInit(): void {
        this.applicantAssignmentId = Number(this.activatedRoute.snapshot.paramMap.get('id'));
        if (this.applicantAssignmentId) {
            this.fetchApplicantAssignment();
        } else {
            this.toasterMessageService.showError('Invalid assignment ID', 'Error');
            this.router.navigate(['/assignments']);
        }
    }

    fetchApplicantAssignment(): void {
        if (!this.applicantAssignmentId) return;

        this.isLoading = true;
        this.jobOpeningsService.getApplicantAssignmentById(this.applicantAssignmentId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    const data = res?.data?.object_info ?? res?.object_info ?? res?.data ?? res;
                    this.applicantAssignment = data;
                    this.assignment = data?.assignment;
                    this.applicant = data?.applicant;
                    this.applicantAnswers = data?.applicant_answers || [];

                    // Initialize review answers from existing data
                    if (this.applicantAnswers) {
                        // Clear existing points before reinitializing
                        this.essayPoints.clear();
                        this.applicantAnswers.forEach((answer: any) => {
                            if (answer.is_correct === true) {
                                this.reviewAnswers.set(answer.question.id, 'correct');
                            } else if (answer.is_correct === false && answer.answered_at) {
                                this.reviewAnswers.set(answer.question.id, 'wrong');
                            }
                            // Initialize essay points from existing earned_points (only if it exists, is not null/undefined, and not 0)
                            // We don't initialize with 0 to show placeholder instead
                            if (answer.question?.type === 'Text' && answer.earned_points !== null && answer.earned_points !== undefined && answer.earned_points !== 0) {
                                this.essayPoints.set(answer.question.id, answer.earned_points);
                            }
                        });
                    }

                    this.updateBreadcrumbs();
                    this.isLoading = false;
                },
                error: () => {
                    this.isLoading = false;
                    this.toasterMessageService.showError('Failed to load assignment details', 'Error');
                }
            });
    }

    updateBreadcrumbs(): void {
        const assignmentName = this.assignment?.name || 'Assignment';
        this.breadcrumbs = [
            { label: 'Recruitment', link: '/calendar' },
            { label: 'Assignments', link: '/assignments' },
            { label: 'Review Answers - ' + assignmentName }
        ];
    }

    // Get pending review count
    getPendingReviewCount(): number {
        if (!this.applicantAssignment) return 0;
        return this.applicantAssignment.must_review_questions || 0;
    }

    // Get current score (earned points)
    getCurrentScore(): number {
        if (!this.applicantAnswers) return 0;
        return this.applicantAnswers.reduce((sum: number, answer: any) => {
            return sum + (answer.earned_points || 0);
        }, 0);
    }

    // Get total score (max points)
    getTotalScore(): number {
        if (!this.applicantAnswers) return 0;
        return this.applicantAnswers.reduce((sum: number, answer: any) => {
            return sum + (answer.question?.points || 0);
        }, 0);
    }

    // Get recruiter side status
    getRecruiterSideStatus(): string {
        return this.applicantAssignment?.recruiter_side_status || '';
    }

    // Check if question needs review
    needsReview(questionId: number): boolean {
        const answer = this.applicantAnswers.find((a: any) => a.question?.id === questionId);
        return answer?.need_review === true;
    }

    // Get question status icon
    getQuestionStatus(questionId: number): 'pending' | 'correct' | 'wrong' {
        const review = this.reviewAnswers.get(questionId);
        if (review === 'correct') return 'correct';
        if (review === 'wrong') return 'wrong';
        return 'pending';
    }

    // Handle review selection
    onReviewChange(questionId: number, value: 'correct' | 'wrong'): void {
        this.reviewAnswers.set(questionId, value);
    }

    // Get selected answer for a question
    getSelectedAnswer(questionId: number): any {
        return this.applicantAnswers.find((a: any) => a.question?.id === questionId);
    }

    // Check if answer is selected (for MCQ)
    isAnswerSelected(answerId: number, questionId: number): boolean {
        const answer = this.getSelectedAnswer(questionId);
        return answer?.selected_answer?.id === answerId;
    }

    // Get answer text for display
    getAnswerText(questionId: number): string {
        const answer = this.getSelectedAnswer(questionId);
        if (answer?.text_answer) return answer.text_answer;
        if (answer?.selected_answer?.text) return answer.selected_answer.text;
        return '';
    }

    // Get question type
    getQuestionType(questionId: number): string {
        const answer = this.getSelectedAnswer(questionId);
        return answer?.question?.type || '';
    }

    // Get answer letter (A, B, C, etc.)
    getAnswerLetter(index: number): string {
        return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
    }

    // Check if an answer is the correct answer
    isCorrectAnswer(answer: any): boolean {
        return answer?.is_correct === true;
    }

    // Check if an answer was selected by the applicant
    isSelectedAnswer(answerId: number, applicantAnswer: any): boolean {
        return applicantAnswer?.selected_answer?.id === answerId;
    }

    // Check if the applicant's answer is correct
    isApplicantAnswerCorrect(applicantAnswer: any): boolean {
        return applicantAnswer?.is_correct === true;
    }

    // Submit review (placeholder - implement API call when ready)
    submitReview(): void {
        // TODO: Implement API call to submit review
        this.toasterMessageService.showInfo('Review submission will be implemented');
    }

    // Get points for essay question
    getEssayPoints(questionId: number): number | null {
        return this.essayPoints.get(questionId) ?? null;
    }

    // Set points for essay question
    setEssayPoints(questionId: number, points: number | string | null, maxPoints?: number): void {
        // Clear validation error when user types
        this.essayValidationErrors.delete(questionId);

        if (points === null || points === undefined || points === '') {
            this.essayPoints.delete(questionId);
            return;
        }
        const numPoints = typeof points === 'string' ? parseFloat(points) : points;
        if (!isNaN(numPoints)) {
            // Validate range if maxPoints is provided
            if (maxPoints !== undefined && maxPoints !== null) {
                if (numPoints < 0) {
                    this.essayValidationErrors.set(questionId, 'Points cannot be negative');
                    return;
                }
                if (numPoints > maxPoints) {
                    this.essayValidationErrors.set(questionId, `Points cannot exceed ${maxPoints}`);
                    return;
                }
            }
            this.essayPoints.set(questionId, numPoints);
        } else {
            this.essayPoints.delete(questionId);
        }
    }

    // Get validation error for essay question
    getEssayValidationError(questionId: number): string | null {
        return this.essayValidationErrors.get(questionId) || null;
    }

    // Check if essay question is loading
    isEssayLoading(questionId: number): boolean {
        return this.essayLoading.get(questionId) || false;
    }

    // Validate essay points
    validateEssayPoints(questionId: number, maxPoints: number): void {
        const points = this.getEssayPoints(questionId);
        
        if (points === null || points === undefined) {
            this.essayValidationErrors.delete(questionId);
            return;
        }

        if (points < 0) {
            this.essayValidationErrors.set(questionId, 'Points cannot be negative');
            return;
        }

        if (maxPoints !== undefined && maxPoints !== null && points > maxPoints) {
            this.essayValidationErrors.set(questionId, `Points cannot exceed ${maxPoints}`);
            return;
        }

        // Clear error if valid
        this.essayValidationErrors.delete(questionId);
    }

    // Check if essay points can be submitted
    canSubmitEssayPoints(questionId: number): boolean {
        const points = this.getEssayPoints(questionId);
        // Allow 0 as a valid value, just check it's not null/undefined and is a valid number
        return points !== null && points !== undefined && !isNaN(points) && points >= 0;
    }

    // Check if answer has initial earned points (to hide submit button on initial load)
    hasInitialEarnedPoints(answer: any): boolean {
        return answer?.earned_points !== null && answer?.earned_points !== undefined && answer?.earned_points !== 0;
    }

    // Submit essay review with points
    submitEssayReview(answer: any): void {
        const questionId = answer.question?.id;
        if (!questionId) return;

        // Prevent duplicate requests
        if (this.isEssayLoading(questionId)) {
            return;
        }

        const applicantAnswerId = answer.applicant_answer_id;
        const points = this.getEssayPoints(questionId);

        if (!applicantAnswerId) {
            this.toasterMessageService.showError('Invalid answer ID', 'Error');
            return;
        }

        if (points === null || points === undefined || isNaN(points)) {
            this.toasterMessageService.showError('Please enter points', 'Error');
            return;
        }

        if (points < 0) {
            this.toasterMessageService.showError('Points cannot be negative', 'Error');
            return;
        }

        const maxPoints = answer.question?.points || 0;
        if (points > maxPoints) {
            this.toasterMessageService.showError(`Points cannot exceed ${maxPoints}`, 'Error');
            return;
        }

        // Set loading state
        this.essayLoading.set(questionId, true);

        // Call API
        this.jobOpeningsService.submitReviewAnswer(applicantAnswerId, points)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    this.essayLoading.set(questionId, false);
                    this.toasterMessageService.showSuccess('Points submitted successfully', 'Success');
                    
                    // Refresh assignment data to get updated scores and status
                    this.fetchApplicantAssignment();
                },
                error: (error) => {
                    this.essayLoading.set(questionId, false);
                    const errorMessage = error?.error?.message || error?.message;
                    this.toasterMessageService.showError(errorMessage, 'Error');
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
