import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { ToasterMessageService } from '../../../../core/services/tostermessage/tostermessage.service';
import { JobOpeningsService } from '../../../../core/services/recruitment/job-openings/job-openings.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
    selector: 'app-manage-assignment',
    standalone: true,
    imports: [CommonModule, PageHeaderComponent, PopupComponent, ReactiveFormsModule, FormsModule],
    templateUrl: './manage-assignment.component.html',
    styleUrls: ['./manage-assignment.component.css']
})
export class ManageAssignmentComponent implements OnInit, OnDestroy {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private formBuilder = inject(FormBuilder);
    private toaster = inject(ToasterMessageService);
    private jobOpeningsService = inject(JobOpeningsService);

    // Form
    assignmentForm!: FormGroup;
    isSubmitting: boolean = false;
    isLoadingEdit: boolean = false;
    formErrors: any = {};

    // Media upload states
    mediaUploadingIndex: number | null = null;
    mediaEditingIndex: number | null = null; // Track which media item is being replaced

    // Tab navigation
    currentTab: 'main-info' | 'questions' = 'main-info';

    // Edit mode
    isEditMode: boolean = false;
    editId: string | number | null = null;

    // Header + navigation
    breadcrumbs: { label: string; link?: string }[] = [
        { label: 'Recruitment', link: '/recruitment' },
        { label: 'Assignments', link: '/assignments' },
        { label: 'Create Assignment' }
    ];
    pageTitle: string = 'Create Assignment';
    todayFormatted: string = '';
    buttonText: string = 'Create Assignment';

    // Questions management
    questions: any[] = [];
    selectedQuestions: any[] = [];
    expandedQuestion: number | null = null;
    expandedQuestions: Set<number> = new Set(); // Track all expanded questions (including invalid ones)
    formSubmitted: boolean = false;

    // Popup states
    showDeleteMediaConfirmation: boolean = false;
    showDeleteQuestionConfirmation: boolean = false;
    showDiscardConfirmation: boolean = false;
    showDeleteAnswerConfirmation: boolean = false;
    pendingDeleteQuestionIndex: number | null = null;
    pendingDeleteMediaQuestionIndex: number | null = null;
    pendingDeleteMediaIndex: number | null = null;
    pendingDeleteAnswerQuestionIndex: number | null = null;
    pendingDeleteAnswerIndex: number | null = null;

    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.initializeForm();
        this.formatToday();
        this.checkEditMode();
    }

    private initializeForm(): void {
        this.assignmentForm = this.formBuilder.group({
            code: [''],
            name: ['', [Validators.required]],
            duration_minutes: ['', [Validators.required, Validators.min(1)]],
            instructions: ['', [Validators.required]]
        });
    }

    private formatToday(): void {
        const today = new Date();
        this.todayFormatted = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    }

    private checkEditMode(): void {
        this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
            if (params['id']) {
                this.isEditMode = true;
                this.editId = params['id'];
                this.pageTitle = 'Edit Assignment';
                this.buttonText = 'Update Assignment';
                this.breadcrumbs[this.breadcrumbs.length - 1] = { label: 'Edit Assignment' };
                this.loadAssignmentForEdit(params['id']);
            } else {
                // For create mode, initialize with one empty question
                this.addInitialQuestion();
            }
        });
    }

    private addInitialQuestion(): void {
        const emptyQuestion = {
            id: null,
            question_text: '',
            question_type: '',
            points: 0,
            is_required: false,
            media: [],
            answers: [],
            deletedAnswers: [], // Track deleted answers for payload
            order: 1, // Default order
            touched: false,
            questionTextTouched: false
        };
        this.questions.push(emptyQuestion);
        this.expandedQuestion = 0;
        this.expandedQuestions.add(0);
    }

    private loadAssignmentForEdit(id: string | number): void {
        this.isLoadingEdit = true;

        this.jobOpeningsService.getAssignmentDetails(Number(id)).pipe(
            takeUntil(this.destroy$),
            finalize(() => this.isLoadingEdit = false)
        ).subscribe({
            next: (response) => {
                if (response && response.data && response.data.object_info) {
                    const assignmentData = response.data.object_info;
                    this.populateForm(assignmentData);

                    // Map questions from API response
                    this.questions = (assignmentData.questions || []).map((q: any, index: number) => {
                        // Get order from API response - ensure it's a valid number
                        let questionOrder = index + 1; // Default fallback
                        if (q.order !== undefined && q.order !== null) {
                            const parsedOrder = typeof q.order === 'string' ? parseInt(q.order, 10) : q.order;
                            if (!isNaN(parsedOrder) && parsedOrder > 0) {
                                questionOrder = parsedOrder;
                            }
                        }

                        return {
                            id: q.id,
                            question_text: q.question_text,
                            question_type: this.mapApiQuestionTypeToDropdownValue(q.question_type),
                            points: q.points || 0,
                            is_required: q.is_required || false,
                            media: (q.media || []).map((m: any) => ({
                                id: m.id,
                                name: m.document_url?.info?.file_name || 'Unknown',
                                size: this.formatFileSizeKB(m.document_url?.info?.file_size_kb),
                                url: m.document_url?.generate_signed_url,
                                type: m.media_type?.name,
                                file: null,
                                document_url: m.document_url // Store original API response for unchanged media
                            })),
                            answers: (q.answers || []).map((a: any) => ({
                                id: a.id,
                                text: a.text,
                                is_correct: a.is_correct,
                                error: false,
                                touched: false,
                                markAsCorrectError: false
                            })),
                            deletedAnswers: [], // Track answers that were deleted (for payload)
                            order: questionOrder, // Use order from API response
                            correct_answer: q.answers?.findIndex((a: any) => a.is_correct) ?? null,
                            touched: false,
                            questionTextTouched: false
                        };
                    });

                    // Set first question as expanded by default
                    if (this.questions.length > 0) {
                        this.expandedQuestion = 0;
                        this.expandedQuestions.add(0);
                    }

                    // Don't call ensureUniqueOrders after loading from API
                    // API already has valid unique orders, preserve them as-is
                }
            },
            error: (error) => {
                console.error('Error loading assignment:', error);
                this.toaster.showError('Failed to load assignment. Please try again.');
            }
        });
    }

    private populateForm(assignment: any): void {
        this.assignmentForm.patchValue({
            code: assignment.code || '',
            name: assignment.name || '',
            duration_minutes: assignment.duration_minutes || '',
            instructions: assignment.instructions || ''
        });
    }

    private formatFileSizeKB(kb: number | undefined): string {
        if (!kb) return '0 KB';
        if (kb < 1024) {
            return Math.round(kb * 100) / 100 + ' KB';
        }
        const mb = kb / 1024;
        return Math.round(mb * 100) / 100 + ' MB';
    }

    // Get error for a form field
    getFieldError(fieldName: string): string | null {
        const field = this.assignmentForm.get(fieldName);
        if (!field || !field.touched || !field.errors) {
            return null;
        }
        if (field.errors['required']) {
            return `${this.formatFieldName(fieldName)} is required`;
        }
        if (field.errors['min']) {
            return `${this.formatFieldName(fieldName)} must be at least ${field.errors['min'].min}`;
        }
        return 'Invalid value';
    }

    // Check if field has error
    hasFieldError(fieldName: string): boolean {
        const field = this.assignmentForm.get(fieldName);
        return field ? field.invalid && field.touched : false;
    }

    // Mark all fields as touched to show validation errors
    markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    // Format field names for display (e.g., duration_minutes -> Duration Minutes)
    private formatFieldName(fieldName: string): string {
        return fieldName
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    setCurrentTab(tab: 'main-info' | 'questions'): void {
        // If trying to navigate to questions tab, validate the form first
        if (tab === 'questions') {
            this.markFormGroupTouched(this.assignmentForm);
            if (!this.assignmentForm.valid) {
                return;
            }
        }
        this.currentTab = tab;
    }

    goToPreviousTab(): void {
        if (this.currentTab === 'questions') {
            // Go back to main-info tab without confirmation
            this.setCurrentTab('main-info');
        } else {
            // From main-info, check if form is dirty before navigating away
            if (this.assignmentForm.dirty || this.questions.length > 0) {
                this.showDiscardConfirmation = true;
            } else {
                this.router.navigate(['/assignments']);
            }
        }
    }

    closeDiscardConfirmation(): void {
        this.showDiscardConfirmation = false;
    }

    confirmDiscard(): void {
        this.closeDiscardConfirmation();
        this.router.navigate(['/assignments']);
    }

    onDiscard(): void {
        this.showDiscardConfirmation = true;
    }

    onSubmit(): void {
        // Prevent submission while media is uploading
        if (this.mediaUploadingIndex !== null) {
            this.toaster.showError('Please wait for media upload to complete', 'Upload in Progress');
            return;
        }

        this.formSubmitted = true;
        this.markFormGroupTouched(this.assignmentForm);
        if (!this.assignmentForm.valid) {
            return;
        }

        // Mark all questions as touched (only non-deleted ones)
        this.questions.forEach(q => {
            if (q.record_type !== 'delete') {
                q.touched = true;
                q.questionTextTouched = true;
                if (q.answers) {
                    q.answers.forEach((a: any) => {
                        a.touched = true;
                    });
                }
            }
        });

        // Validate questions
        if (this.questions.length === 0) {
            this.currentTab = 'questions';
            this.toaster.showError('Please add at least one question', 'Validation Error');
            return;
        }

        let hasValidationError = false;
        let firstErrorQuestionIndex = null;
        const invalidQuestionIndices: number[] = []; // Track all invalid question indices

        // Validate each question - mark all errors first, then return
        for (let i = 0; i < this.questions.length; i++) {
            const question = this.questions[i];

            // Filter out deleted questions
            if (question.record_type === 'delete') {
                continue;
            }

            if (!question.question_text || question.question_text.trim() === '') {
                if (firstErrorQuestionIndex === null) {
                    firstErrorQuestionIndex = i;
                }
                invalidQuestionIndices.push(i);
                hasValidationError = true;
                continue;
            }
            if (!question.question_type) {
                if (firstErrorQuestionIndex === null) {
                    firstErrorQuestionIndex = i;
                }
                invalidQuestionIndices.push(i);
                hasValidationError = true;
                continue;
            }
            if (!question.points || question.points <= 0) {
                if (firstErrorQuestionIndex === null) {
                    firstErrorQuestionIndex = i;
                }
                invalidQuestionIndices.push(i);
                hasValidationError = true;
                continue;
            }

            if (question.question_type === 'mcq') {
                if (!question.answers || question.answers.length === 0) {
                    if (firstErrorQuestionIndex === null) {
                        firstErrorQuestionIndex = i;
                    }
                    invalidQuestionIndices.push(i);
                    hasValidationError = true;
                    continue;
                }

                // Validate all answers and mark empty ones
                let hasEmptyAnswer = false;
                for (let j = 0; j < question.answers.length; j++) {
                    const answer = question.answers[j];
                    if (!answer) continue; // Skip if answer doesn't exist

                    // Ensure error property exists
                    if (answer.error === undefined) {
                        answer.error = false;
                    }

                    if (!answer.text || (answer.text && answer.text.trim() === '')) {
                        answer.error = true;
                        answer.markAsCorrectError = false; // Clear mark as correct error on form submission
                        answer.touched = true;
                        hasEmptyAnswer = true;
                        if (firstErrorQuestionIndex === null) {
                            firstErrorQuestionIndex = i;
                        }
                    } else {
                        answer.error = false;
                    }
                }

                if (hasEmptyAnswer) {
                    invalidQuestionIndices.push(i);
                    hasValidationError = true;
                }

                if (question.correct_answer === null || question.correct_answer === undefined) {
                    if (firstErrorQuestionIndex === null) {
                        firstErrorQuestionIndex = i;
                    }
                    invalidQuestionIndices.push(i);
                    hasValidationError = true;
                }
            }

            if (question.question_type === 'truefalse') {
                if (!question.answers || question.answers.length < 2) {
                    if (firstErrorQuestionIndex === null) {
                        firstErrorQuestionIndex = i;
                    }
                    invalidQuestionIndices.push(i);
                    hasValidationError = true;
                    this.toaster.showError('Please add both true and false answers', 'Validation Error');
                    continue;
                }

                // Validate all answers and mark empty ones
                let hasEmptyAnswer = false;
                for (let j = 0; j < question.answers.length; j++) {
                    const answer = question.answers[j];
                    if (!answer) continue; // Skip if answer doesn't exist

                    // Ensure error property exists
                    if (answer.error === undefined) {
                        answer.error = false;
                    }

                    if (!answer.text || (answer.text && answer.text.trim() === '')) {
                        answer.error = true;
                        answer.markAsCorrectError = false; // Clear mark as correct error on form submission
                        answer.touched = true;
                        hasEmptyAnswer = true;
                        if (firstErrorQuestionIndex === null) {
                            firstErrorQuestionIndex = i;
                        }
                    } else {
                        answer.error = false;
                    }
                }

                if (hasEmptyAnswer) {
                    invalidQuestionIndices.push(i);
                    hasValidationError = true;
                    this.toaster.showError('Please fill in all answer options', 'Validation Error');
                }

                if (question.correct_answer === null || question.correct_answer === undefined) {
                    if (firstErrorQuestionIndex === null) {
                        firstErrorQuestionIndex = i;
                    }
                    invalidQuestionIndices.push(i);
                    hasValidationError = true;
                }
            }
        }

        // If validation errors found, navigate to questions tab and expand all invalid questions
        if (hasValidationError) {
            this.currentTab = 'questions';
            // Expand all invalid questions
            invalidQuestionIndices.forEach(index => {
                this.expandedQuestions.add(index);
            });
            // Also set expandedQuestion to the first error for scrolling
            if (firstErrorQuestionIndex !== null) {
                this.expandedQuestion = firstErrorQuestionIndex;
                // Scroll to first error question after a short delay
                setTimeout(() => {
                    const questionElement = document.querySelector(`[data-question-index="${firstErrorQuestionIndex}"]`) as HTMLElement;
                    if (questionElement) {
                        questionElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                            inline: 'nearest'
                        });
                    }
                }, 100);
            }
            return;
        }

        this.isSubmitting = true;

        // Build the complete request body
        const assignmentPayload = this.buildAssignmentPayload();

        if (this.isEditMode) {
            this.jobOpeningsService.updateAssignment(assignmentPayload).pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSubmitting = false)
            ).subscribe({
                next: () => {
                    this.toaster.showSuccess('Assignment updated successfully');
                    this.router.navigate(['/assignments']);
                },
                error: (error) => {
                }
            });
        } else {
            this.jobOpeningsService.createAssignment(assignmentPayload).pipe(
                takeUntil(this.destroy$),
                finalize(() => this.isSubmitting = false)
            ).subscribe({
                next: () => {
                    this.toaster.showSuccess('Assignment created successfully');
                    this.router.navigate(['/assignments']);
                },
                error: (error) => {
                    console.error('Error creating assignment:', error);
                }
            });
        }
    }

    private buildAssignmentPayload(): any {
        const formValue = this.assignmentForm.value;

        // Map questions to API format with proper media handling
        const questionsPayload = this.questions
            .filter(q => q.record_type !== 'delete') // Filter out deleted questions
            .map((question, index) => {
                // Ensure order is a valid number - use question.order if available, otherwise use index + 1
                const questionOrder = (question.order !== undefined && question.order !== null && !isNaN(Number(question.order)))
                    ? Number(question.order)
                    : (index + 1);

                return {
                    id: question.id || undefined,
                    // Use the question's record_type if set (e.g., 'delete'), otherwise determine based on mode
                    record_type: question.record_type || (!this.isEditMode ? 'create' : (question.id ? 'update' : 'create')),
                    question_type: this.getQuestionTypeCode(question.question_type),
                    question_text: question.question_text,
                    points: question.points,
                    order: questionOrder,
                    is_required: question.is_required || false,
                    // Media array: includes uploaded file responses from /recruiter/assignments/upload-file
                    // Each media object contains the API response data needed for server processing
                    media: question.media.map((media: any, mediaIndex: number) => ({
                        id: media.id || undefined,
                        record_type: media.id ? 'update' : 'create',
                        media_type: this.getMediaTypeCode(media.type),
                        // File data comes from the upload-file API response
                        // This structure ensures the server receives all necessary URLs and metadata
                        // Use newly uploaded file data, or fallback to original API response for unchanged media
                        file: media.file ? {
                            image_url: media.file.image_url, // URL where file is stored
                            generate_signed_url: media.file.generate_signed_url, // Signed URL for access
                            info: media.file.info // File metadata (name, size, extension, type)
                        } : (media.document_url ? {
                            image_url: media.document_url.image_url,
                            generate_signed_url: media.document_url.generate_signed_url,
                            info: media.document_url.info
                        } : undefined),
                        order: mediaIndex + 1
                    })).filter((m: any) => m.file || m.id), // Only include media with files or existing records
                    answers: [
                        // Active answers (displayed in UI)
                        ...question.answers.map((answer: any, answerIndex: number) => {
                            // Determine if this answer is correct
                            // Use the is_correct flag if set, otherwise check if answerIndex matches correct_answer
                            const isCorrect = answer.is_correct !== undefined
                                ? answer.is_correct
                                : (question.correct_answer !== null && question.correct_answer !== undefined
                                    ? answerIndex === question.correct_answer
                                    : false);

                            return {
                                id: answer.id || undefined,
                                record_type: answer.id ? 'update' : 'create',
                                text: answer.text,
                                order: answerIndex + 1,
                                is_correct: isCorrect
                            };
                        }),
                        // Deleted answers (for backend deletion)
                        ...((question.deletedAnswers || []).map((deletedAnswer: any, deletedIndex: number) => ({
                            id: deletedAnswer.id,
                            record_type: 'delete',
                            text: '', // Empty text for deleted answers
                            order: question.answers.length + deletedIndex + 1, // Order after active answers
                            is_correct: false
                        })))
                    ]
                };
            });

        const payload: any = {
            code: formValue.code,
            name: formValue.name,
            instructions: formValue.instructions || '',
            duration_minutes: formValue.duration_minutes,
            questions: questionsPayload
        };

        // Include assignment ID for update mode
        if (this.isEditMode && this.editId) {
            payload.id = Number(this.editId);
        }

        return payload;
    }

    private mapApiQuestionTypeToDropdownValue(questionType: any): string | null {
        // Handle both API response format: { id: number, name: string }
        if (!questionType) return null;

        const typeId = questionType.id;
        const typeName = questionType.name?.toLowerCase() || '';

        // Map by ID (from API)
        switch (typeId) {
            case 1:
                return 'mcq';
            case 2:
                return 'truefalse';
            case 3:
                return 'essay';
            default:
                // Fallback: map by name
                if (typeName.includes('mcq') || typeName.includes('multiple')) {
                    return 'mcq';
                }
                if (typeName.includes('true') || typeName.includes('false')) {
                    return 'truefalse';
                }
                if (typeName.includes('essay') || typeName.includes('text')) {
                    return 'essay';
                }
                return null;
        }
    }

    private getQuestionTypeCode(typeLabel: string): number {
        switch (typeLabel?.toLowerCase()) {
            case 'mcq':
            case 'multiplechoice':
                return 1;
            case 'truefalse':
                return 2;
            case 'essay':
            case 'text':
                return 3;
            default:
                return 1;
        }
    }

    private getMediaTypeCode(mediaType: string): number {
        if (!mediaType) return 1; // Default to image
        const type = mediaType.toLowerCase();
        if (type.includes('image')) return 1;
        if (type.includes('video')) return 2;
        return 1; // Default to image
    }

    addQuestion(): void {
        // Find the next available order number
        const activeQuestions = this.questions.filter(q => q.record_type !== 'delete');
        const maxOrder = activeQuestions.length > 0
            ? Math.max(...activeQuestions.map(q => q.order || 0))
            : 0;

        const newQuestion = {
            id: null,
            question_text: '',
            question_type: '',
            points: 0,
            is_required: false,
            media: [],
            answers: [],
            deletedAnswers: [], // Track deleted answers for payload
            order: maxOrder + 1, // Set order to next available
            touched: false,
            questionTextTouched: false
        };
        this.questions.push(newQuestion);
        const newIndex = this.questions.length - 1;
        this.expandedQuestion = newIndex;
        this.expandedQuestions.add(newIndex);
        // Reset formSubmitted flag when adding new question so validation messages don't appear for untouched fields
        this.formSubmitted = false;

        // Ensure all orders are unique after adding
        this.ensureUniqueOrders();
    }

    removeQuestion(index: number): void {
        // Method kept for backward compatibility but now opens confirmation
        this.openDeleteQuestionConfirmation(index);
    }

    openDeleteQuestionConfirmation(index: number): void {
        this.pendingDeleteQuestionIndex = index;
        this.showDeleteQuestionConfirmation = true;
    }

    closeDeleteQuestionConfirmation(): void {
        this.showDeleteQuestionConfirmation = false;
        this.pendingDeleteQuestionIndex = null;
    }

    confirmDeleteQuestion(): void {
        if (this.pendingDeleteQuestionIndex !== null) {
            const deletedIndex = this.pendingDeleteQuestionIndex;
            const question = this.questions[deletedIndex];

            // Clean up media blob URL if exists
            const media = question.media?.[0];
            if (media && media.url && media.url.startsWith('blob:')) {
                URL.revokeObjectURL(media.url);
            }

            // If question has an ID (came from backend), mark as deleted
            // Otherwise, remove it from the array (client-side only)
            if (question.id) {
                // Mark question as deleted instead of removing it (backend question)
                question.record_type = 'delete';
            } else {
                // Remove from array (client-side only, hasn't been saved yet)
                this.questions.splice(deletedIndex, 1);
            }

            // If the deleted question was expanded, expand the previous question (or last one)
            if (this.expandedQuestion === deletedIndex) {
                // Find the previous non-deleted question
                let previousQuestionIndex = null;
                const targetIndex = question.id ? deletedIndex : Math.max(0, deletedIndex - 1);

                for (let i = targetIndex; i >= 0; i--) {
                    if (this.questions[i] && this.questions[i].record_type !== 'delete') {
                        previousQuestionIndex = i;
                        break;
                    }
                }

                // If no previous question found, find the last non-deleted question
                if (previousQuestionIndex === null) {
                    for (let i = this.questions.length - 1; i >= 0; i--) {
                        if (this.questions[i] && this.questions[i].record_type !== 'delete') {
                            previousQuestionIndex = i;
                            break;
                        }
                    }
                }

                if (previousQuestionIndex !== null) {
                    this.expandedQuestion = previousQuestionIndex;
                    this.expandedQuestions.add(previousQuestionIndex);
                } else {
                    this.expandedQuestion = null;
                }
            }

            // Ensure all orders are unique after deletion
            this.ensureUniqueOrders();
        }
        this.closeDeleteQuestionConfirmation();
    }

    toggleQuestion(index: number): void {
        if (this.expandedQuestions.has(index)) {
            this.expandedQuestions.delete(index);
            this.expandedQuestion = null;
        } else {
            this.expandedQuestions.add(index);
            this.expandedQuestion = index;
        }
    }

    isQuestionExpanded(index: number): boolean {
        return this.expandedQuestions.has(index) || this.expandedQuestion === index;
    }

    duplicateQuestion(index: number): void {
        const question = this.questions[index];

        // Validate question before duplicating
        const validationError = this.validateQuestionForDuplication(question);
        if (validationError) {
            // Mark fields as touched to show validation messages
            question.questionTextTouched = true;
            question.touched = true;
            if (question.answers) {
                question.answers.forEach((a: any) => {
                    a.touched = true;
                });
            }
            return;
        }

        // Duplicate the question exactly as it is
        const duplicated = JSON.parse(JSON.stringify(question));
        duplicated.id = null;
        duplicated.touched = false;
        duplicated.questionTextTouched = false;

        // Reset media IDs since these are new media items in the duplicated question
        if (duplicated.media && duplicated.media.length > 0) {
            duplicated.media = duplicated.media.map((media: any) => ({
                ...media,
                id: null // Reset ID since this is a new duplicate media item
            }));
        }

        if (duplicated.answers) {
            duplicated.answers.forEach((a: any) => {
                a.touched = false;
                a.id = null; // Reset answer IDs for duplicated answers
            });
        }
        // Reset deletedAnswers for duplicated question
        duplicated.deletedAnswers = [];

        // Set order for duplicated question to next available
        const activeQuestions = this.questions.filter(q => q.record_type !== 'delete');
        const maxOrder = activeQuestions.length > 0
            ? Math.max(...activeQuestions.map(q => q.order || 0))
            : 0;
        duplicated.order = maxOrder + 1;
        // Step 1: Close the old question smoothly if it's currently expanded
        const oldQuestionWasExpanded = this.expandedQuestion === index;
        if (oldQuestionWasExpanded) {
            this.expandedQuestion = null;
            this.expandedQuestions.delete(index);
        }

        // Step 2: Add the duplicated question to the array
        this.questions.splice(index + 1, 0, duplicated);
        const duplicatedIndex = index + 1;

        // Step 3: Wait for the old question to close (500ms), then expand and scroll to new one (1000ms total)
        setTimeout(() => {
            // Expand the new duplicated question
            this.expandedQuestion = duplicatedIndex;
            this.expandedQuestions.add(duplicatedIndex);

            // Step 4: Scroll to the duplicated question smoothly after it's expanded
            setTimeout(() => {
                const questionElement = document.querySelector(`[data-question-index="${duplicatedIndex}"]`) as HTMLElement;
                if (questionElement) {
                    questionElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }, 500); // Wait for expand animation (500ms)
        }, oldQuestionWasExpanded ? 500 : 100); // If old question was open, wait for it to close (500ms), otherwise just 100ms for DOM update

        // Ensure all orders are unique after duplication
        this.ensureUniqueOrders();
    }

    private validateQuestionForDuplication(question: any): string | null {
        // Check if question text is valid
        if (!question.question_text || question.question_text.trim() === '') {
            return 'Question title cannot be empty';
        }

        // Check if question type is selected
        if (!question.question_type) {
            return 'Please select a question type';
        }

        // Check if points are valid
        if (!question.points || question.points <= 0) {
            return 'Points must be greater than 0';
        }

        // Validate answers based on question type
        if (question.question_type === 'mcq') {
            if (!question.answers || question.answers.length === 0) {
                return 'MCQ must have at least one answer';
            }
            for (let i = 0; i < question.answers.length; i++) {
                if (!question.answers[i].text || question.answers[i].text.trim() === '') {
                    return `Answer ${i + 1} cannot be empty`;
                }
            }
            // Check if correct answer is selected
            if (question.correct_answer === null || question.correct_answer === undefined) {
                return 'Please mark one answer as correct';
            }
        } else if (question.question_type === 'truefalse') {
            if (!question.answers || question.answers.length < 2) {
                return 'True/False question must have both answers';
            }
            if (!question.answers[0].text || question.answers[0].text.trim() === '') {
                return 'True answer cannot be empty';
            }
            if (!question.answers[1].text || question.answers[1].text.trim() === '') {
                return 'False answer cannot be empty';
            }
            // Check if correct answer is selected
            if (question.correct_answer === null || question.correct_answer === undefined) {
                return 'Please mark one answer as true';
            }
        }

        return null;
    }

    onMediaSelect(event: any, questionIndex: number, mediaIndex: number | null = null): void {
        const files = event.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            const maxSize = 10 * 1024 * 1024; // 10 MB

            if (file.size > maxSize) {
                this.toaster.showError('File size exceeds 10 MB limit', 'Upload Error');
                event.target.value = ''; // Reset file input
                return;
            }

            // Set loading state
            this.mediaUploadingIndex = questionIndex;
            this.mediaEditingIndex = mediaIndex; // Track which media is being replaced

            // Upload file to server
            this.jobOpeningsService.uploadAssignmentMedia(file)
                .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => {
                        this.mediaUploadingIndex = null;
                        this.mediaEditingIndex = null;
                        event.target.value = '';
                    })
                )
                .subscribe({
                    next: (response: any) => {
                        // Create a blob URL for preview
                        const blobUrl = URL.createObjectURL(file);

                        // Extract data from upload response
                        // Response structure: response.data.object_info contains upload result
                        const uploadedData = response?.data?.object_info || response?.data || response;
                        const imageUrl = uploadedData?.image_url || '';
                        const signedUrl = uploadedData?.generate_signed_url || '';
                        const fileInfo = uploadedData?.info || {
                            file_name: file.name,
                            file_size_kb: file.size / 1024,
                            file_ext: this.getFileExtension(file.name),
                            file_type: file.type
                        };

                        // Create media item with all upload response data
                        const mediaItem = this.createMediaItem(
                            file.name,
                            file.size,
                            file.type,
                            blobUrl,
                            imageUrl,
                            signedUrl,
                            fileInfo
                        );

                        // Initialize media array if it doesn't exist
                        if (!this.questions[questionIndex].media) {
                            this.questions[questionIndex].media = [];
                        }

                        // If mediaIndex is provided, replace the existing media
                        if (mediaIndex !== null && mediaIndex >= 0) {
                            // Revoke old blob URL to prevent memory leaks
                            const oldMedia = this.questions[questionIndex].media[mediaIndex];
                            if (oldMedia && oldMedia.url && oldMedia.url.startsWith('blob:')) {
                                URL.revokeObjectURL(oldMedia.url);
                            }
                            // Replace the media at the specific index
                            this.questions[questionIndex].media[mediaIndex] = mediaItem;
                            this.toaster.showSuccess('Media replaced successfully', 'Success');
                        } else {
                            // Append new media to the array (support multiple media)
                            this.questions[questionIndex].media.push(mediaItem);
                            this.toaster.showSuccess('Media uploaded successfully', 'Success');
                        }
                    },
                    error: (error) => {
                        this.toaster.showError('Failed to upload media', 'Upload Error');
                    }
                });
        }
    }

    private getFileExtension(filename: string): string {
        const match = filename.match(/\.[^/.]+$/);
        return match ? match[0] : '';
    }

    /**
     * Creates a media item object with all necessary data for API submission
     * The media object stores both preview URL (blob URL) and API response data
     * which are used during question submission.
     * 
     * Media Response Structure:
     * - id: null for new media (generated on backend)
     * - name: original file name
     * - size: formatted file size string
     * - url: blob URL for preview in UI
     * - type: 'image' or 'video'
     * - file: uploaded response data containing:
     *   - image_url: URL of the uploaded file on server
     *   - generate_signed_url: signed URL for authenticated access
     *   - info: file metadata (name, size, extension, type)
     * - timestamp: when the file was uploaded
     * 
     * This structure ensures all necessary data from the upload API is stored
     * and properly formatted when sent to create/update assignment endpoints.
     */
    private createMediaItem(
        fileName: string,
        fileSize: number,
        fileType: string,
        blobUrl: string,
        imageUrl: string,
        signedUrl: string,
        fileInfo: any
    ): any {
        return {
            id: null,
            name: fileName,
            size: this.formatFileSize(fileSize),
            url: blobUrl, // Used for preview
            type: fileType.startsWith('image/') ? 'image' : 'video',
            // Upload API response data - stored for submission
            file: {
                image_url: imageUrl,
                generate_signed_url: signedUrl,
                info: fileInfo
            },
            timestamp: Date.now()
        };
    }

    openDeleteMediaConfirmation(questionIndex: number, mediaIndex: number): void {
        this.pendingDeleteMediaQuestionIndex = questionIndex;
        this.pendingDeleteMediaIndex = mediaIndex;
        this.showDeleteMediaConfirmation = true;
    }

    closeDeleteMediaConfirmation(): void {
        this.showDeleteMediaConfirmation = false;
        this.pendingDeleteMediaQuestionIndex = null;
        this.pendingDeleteMediaIndex = null;
    }

    confirmDeleteMedia(): void {
        if (this.pendingDeleteMediaQuestionIndex !== null && this.pendingDeleteMediaIndex !== null) {
            // Revoke blob URL if exists to prevent memory leaks
            const media = this.questions[this.pendingDeleteMediaQuestionIndex].media[this.pendingDeleteMediaIndex];
            if (media && media.url && media.url.startsWith('blob:')) {
                URL.revokeObjectURL(media.url);
            }
            // Remove the specific media item from the array
            this.questions[this.pendingDeleteMediaQuestionIndex].media.splice(this.pendingDeleteMediaIndex, 1);
            this.toaster.showSuccess('Media deleted successfully', 'Deleted');
        }
        this.closeDeleteMediaConfirmation();
    }

    removeMedia(questionIndex: number, mediaIndex: number): void {
        // Open confirmation popup
        this.openDeleteMediaConfirmation(questionIndex, mediaIndex);
    }

    triggerMediaUpload(questionIndex: number): void {
        const fileInput = document.getElementById(`media-upload-${questionIndex}`) as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    }

    setCorrectAnswer(questionIndex: number, answerIndex: number): void {
        const question = this.questions[questionIndex];
        const answer = question.answers[answerIndex];

        // Validation: check if answer is not empty or only spaces
        if (!answer.text || answer.text.trim() === '') {
            // Only show mark as correct error, not the general error
            answer.markAsCorrectError = true;
            answer.error = false; // Clear general error if it was set
            answer.touched = true;
            return;
        }

        // Clear both errors when answer is valid
        answer.error = false;
        answer.markAsCorrectError = false;

        // Set correct_answer index
        question.correct_answer = answerIndex;

        // Update is_correct flag on all answers
        // Set selected answer to true, all others to false
        question.answers.forEach((ans: any, index: number) => {
            ans.is_correct = index === answerIndex;
        });
    }

    // Clear error when user types in answer input
    clearAnswerError(questionIndex: number, answerIndex: number): void {
        const question = this.questions[questionIndex];
        const answer = question.answers[answerIndex];

        answer.error = false;
        answer.markAsCorrectError = false;

        // If answer text becomes empty and it was marked as correct, unmark it
        if (!answer.text || answer.text.trim() === '') {
            if (question.correct_answer === answerIndex) {
                question.correct_answer = null;
                // Reset is_correct flags
                question.answers.forEach((ans: any) => {
                    ans.is_correct = false;
                });
            }
        }
    }

    // Called when question type changes
    onQuestionTypeChange(questionIndex: number, type: string): void {
        if (type === 'mcq') {
            // If switching to MCQ and no answers exist, add one default answer
            if (!this.questions[questionIndex].answers || this.questions[questionIndex].answers.length === 0) {
                this.questions[questionIndex].answers = [{
                    text: '',
                    is_correct: false,
                    error: false,
                    touched: false,
                    markAsCorrectError: false
                }];
                this.questions[questionIndex].correct_answer = null;
            }
        } else if (type === 'truefalse') {
            // If switching to True/False, initialize with two answers
            this.questions[questionIndex].answers = [
                { text: '', is_correct: false, error: false, touched: false, markAsCorrectError: false },
                { text: '', is_correct: false, error: false, touched: false, markAsCorrectError: false }
            ];
            this.questions[questionIndex].correct_answer = null;
        } else if (type === 'essay') {
            // Essay questions don't need answers
            this.questions[questionIndex].answers = [];
            this.questions[questionIndex].correct_answer = null;
        }
    }

    // Check if all questions are valid for submission
    areQuestionsValid(): boolean {
        if (this.questions.length === 0) {
            return false;
        }

        // Filter out deleted questions
        const activeQuestions = this.questions.filter(q => q.record_type !== 'delete');

        if (activeQuestions.length === 0) {
            return false;
        }

        for (const question of activeQuestions) {
            // Check question text
            if (!question.question_text || question.question_text.trim() === '') {
                return false;
            }

            // Check question type
            if (!question.question_type) {
                return false;
            }

            // Check points
            if (!question.points || question.points <= 0) {
                return false;
            }

            // Validate based on question type
            if (question.question_type === 'mcq') {
                if (!question.answers || question.answers.length === 0) {
                    return false;
                }
                // Check all answers have text
                for (const answer of question.answers) {
                    if (!answer.text || answer.text.trim() === '') {
                        return false;
                    }
                }
                // Check if correct answer is selected
                if (question.correct_answer === null || question.correct_answer === undefined) {
                    return false;
                }
            } else if (question.question_type === 'truefalse') {
                if (!question.answers || question.answers.length < 2) {
                    return false;
                }
                // Check both true and false answers have text
                if (!question.answers[0]?.text || question.answers[0].text.trim() === '') {
                    return false;
                }
                if (!question.answers[1]?.text || question.answers[1].text.trim() === '') {
                    return false;
                }
                // Check if correct answer is selected
                if (question.correct_answer === null || question.correct_answer === undefined) {
                    return false;
                }
            }
            // Essay questions only need text, type, and points (validated above)
        }

        return true;
    }

    // Add a new answer to the MCQ
    addAnswer(questionIndex: number): void {
        if (!this.questions[questionIndex].answers) {
            this.questions[questionIndex].answers = [];
        }
        // Prevent adding more than 26 answers (A-Z)
        if (this.questions[questionIndex].answers.length >= 26) {
            return;
        }
        this.questions[questionIndex].answers.push({
            text: '',
            is_correct: false,
            error: false,
            touched: false,
            markAsCorrectError: false
        });
    }

    // Open delete answer confirmation
    openDeleteAnswerConfirmation(questionIndex: number, answerIndex: number): void {
        const question = this.questions[questionIndex];
        if (!question.answers || question.answers.length <= 1) {
            // Cannot remove the last answer - MCQ must have at least one answer
            return;
        }
        this.pendingDeleteAnswerQuestionIndex = questionIndex;
        this.pendingDeleteAnswerIndex = answerIndex;
        this.showDeleteAnswerConfirmation = true;
    }

    // Close delete answer confirmation
    closeDeleteAnswerConfirmation(): void {
        this.showDeleteAnswerConfirmation = false;
        this.pendingDeleteAnswerQuestionIndex = null;
        this.pendingDeleteAnswerIndex = null;
    }

    // Confirm and remove an answer from MCQ
    confirmDeleteAnswer(): void {
        if (this.pendingDeleteAnswerQuestionIndex !== null && this.pendingDeleteAnswerIndex !== null) {
            const question = this.questions[this.pendingDeleteAnswerQuestionIndex];
            const answerIndex = this.pendingDeleteAnswerIndex;
            const answer = question.answers[answerIndex];

            // If answer has an ID (from backend), track it for deletion in payload
            // Otherwise, just remove it (client-side only)
            if (answer.id) {
                // Store deleted answer for payload (mark with record_type: 'delete')
                if (!question.deletedAnswers) {
                    question.deletedAnswers = [];
                }
                question.deletedAnswers.push({
                    id: answer.id,
                    record_type: 'delete'
                });
            }

            // Remove from answers array (for display)
            question.answers.splice(answerIndex, 1);

            // Update correct_answer index if needed
            if (question.correct_answer !== null && question.correct_answer !== undefined) {
                if (question.correct_answer === answerIndex) {
                    // If we removed the correct answer, reset it
                    question.correct_answer = null;
                    // Also reset is_correct flags
                    question.answers.forEach((ans: any) => {
                        ans.is_correct = false;
                    });
                } else if (question.correct_answer > answerIndex) {
                    // If correct answer was after the removed one, adjust the index
                    question.correct_answer = question.correct_answer - 1;
                }
            }
        }
        this.closeDeleteAnswerConfirmation();
    }

    // Remove an answer from MCQ (kept for backward compatibility, now opens confirmation)
    removeAnswer(questionIndex: number, answerIndex: number): void {
        this.openDeleteAnswerConfirmation(questionIndex, answerIndex);
    }

    // Get all order numbers from 1 to total questions
    getAvailableOrders(questionIndex: number): number[] {
        const activeQuestions = this.questions.filter(q => q.record_type !== 'delete');
        const totalQuestions = activeQuestions.length;

        // Return all numbers from 1 to total questions
        const orders: number[] = [];
        for (let i = 1; i <= totalQuestions; i++) {
            orders.push(i);
        }

        return orders;
    }

    // Handle order change for a question
    onOrderChange(questionIndex: number, newOrder: number | string): void {
        const question = this.questions[questionIndex];
        const newOrderNum = typeof newOrder === 'string' ? parseInt(newOrder, 10) : newOrder;
        const oldOrder = question.order || questionIndex + 1;

        if (newOrderNum === oldOrder || isNaN(newOrderNum)) {
            return; // No change needed or invalid value
        }

        // Find the question that currently has this order
        const questionWithNewOrder = this.questions.find((q, idx) =>
            idx !== questionIndex &&
            q.record_type !== 'delete' &&
            (q.order || idx + 1) === newOrderNum
        );

        // Swap orders if another question has the new order
        if (questionWithNewOrder) {
            // Swap: give the other question the current question's old order
            questionWithNewOrder.order = oldOrder;
        }

        // Update current question's order
        question.order = newOrderNum;

        // Ensure all orders are unique after change
        this.ensureUniqueOrders();
    }

    // Ensure all questions have unique orders
    private ensureUniqueOrders(): void {
        const activeQuestions = this.questions
            .map((q, idx) => ({ question: q, index: idx }))
            .filter(item => item.question.record_type !== 'delete');

        if (activeQuestions.length === 0) {
            return;
        }

        // Get all current orders
        const usedOrders = new Set<number>();
        const questionsWithOrders: Array<{ question: any; order: number }> = [];

        activeQuestions.forEach(item => {
            // Use the order from the question if it exists, otherwise use index + 1
            // But don't override if order is explicitly set (including 0, though that's unlikely)
            const order = (item.question.order !== undefined && item.question.order !== null)
                ? item.question.order
                : (item.index + 1);
            questionsWithOrders.push({ question: item.question, order });
            usedOrders.add(order);
        });

        // Check for duplicates
        const orderCounts = new Map<number, number>();
        questionsWithOrders.forEach(item => {
            orderCounts.set(item.order, (orderCounts.get(item.order) || 0) + 1);
        });

        // Find duplicates and reassign
        const duplicates = Array.from(orderCounts.entries())
            .filter(([order, count]) => count > 1)
            .map(([order]) => order);

        if (duplicates.length > 0) {
            // For each duplicate order, keep the first occurrence and reassign others
            duplicates.forEach(duplicateOrder => {
                let firstFound = false;
                questionsWithOrders.forEach(item => {
                    if (item.order === duplicateOrder) {
                        if (!firstFound) {
                            firstFound = true;
                            usedOrders.add(item.order); // Mark as used
                        } else {
                            // Find next available order
                            let nextOrder = 1;
                            while (usedOrders.has(nextOrder)) {
                                nextOrder++;
                            }
                            item.question.order = nextOrder;
                            usedOrders.add(nextOrder);
                        }
                    }
                });
            });
        }
    }

    // Get alphabet letter (A-Z) for answer label
    getAnswerLetter(index: number): string {
        if (index < 0 || index >= 26) {
            return '';
        }
        return String.fromCharCode(65 + index); // 65 is ASCII for 'A'
    }

    getTotalScore(): number {
        return this.questions.reduce((total, q) => total + (q.points || 0), 0);
    }

    getQuestionNumber(index: number): number {
        // Count only non-deleted questions up to the current index
        let questionNumber = 0;
        for (let i = 0; i <= index; i++) {
            if (this.questions[i] && this.questions[i].record_type !== 'delete') {
                questionNumber++;
            }
        }
        return questionNumber;
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    ngOnDestroy(): void {
        // Clean up any blob URLs to prevent memory leaks
        this.questions.forEach(question => {
            const media = question.media?.[0];
            if (media && media.url && media.url.startsWith('blob:')) {
                URL.revokeObjectURL(media.url);
            }
        });

        this.destroy$.next();
        this.destroy$.complete();
    }
}
