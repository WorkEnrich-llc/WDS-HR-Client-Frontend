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
    formSubmitted: boolean = false;

    // Popup states
    showDeleteMediaConfirmation: boolean = false;
    showDeleteQuestionConfirmation: boolean = false;
    showDiscardConfirmation: boolean = false;
    pendingDeleteMediaIndex: number | null = null;
    pendingDeleteQuestionIndex: number | null = null;

    private destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.initializeForm();
        this.formatToday();
        this.checkEditMode();
    }

    private initializeForm(): void {
        this.assignmentForm = this.formBuilder.group({
            code: ['', [Validators.required]],
            name: ['', [Validators.required]],
            duration_minutes: ['', [Validators.required, Validators.min(1)]],
            instructions: ['', []]
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
            question_type: null,
            points: 0,
            is_required: false,
            media: [],
            answers: [],
            touched: false,
            questionTextTouched: false
        };
        this.questions.push(emptyQuestion);
        this.expandedQuestion = 0;
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
                    this.questions = (assignmentData.questions || []).map((q: any) => ({
                        id: q.id,
                        question_text: q.question_text,
                        question_type: q.question_type?.name?.toLowerCase() || null,
                        points: q.points || 0,
                        is_required: q.is_required || false,
                        media: (q.media || []).map((m: any) => ({
                            id: m.id,
                            name: m.document_url?.info?.file_name || 'Unknown',
                            size: this.formatFileSizeKB(m.document_url?.info?.file_size_kb),
                            url: m.document_url?.generate_signed_url,
                            type: m.media_type?.name,
                            file: null
                        })),
                        answers: (q.answers || []).map((a: any) => ({
                            id: a.id,
                            text: a.text,
                            is_correct: a.is_correct,
                            error: false,
                            touched: false
                        })),
                        correct_answer: q.answers?.findIndex((a: any) => a.is_correct) ?? null,
                        touched: false,
                        questionTextTouched: false
                    }));

                    // Set first question as expanded by default
                    if (this.questions.length > 0) {
                        this.expandedQuestion = 0;
                    }
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

        // Mark all questions as touched
        this.questions.forEach(q => {
            q.touched = true;
            q.questionTextTouched = true;
            if (q.answers) {
                q.answers.forEach((a: any) => {
                    a.touched = true;
                });
            }
        });

        // Validate questions
        if (this.questions.length === 0) {
            return;
        }

        // Validate each question
        for (let i = 0; i < this.questions.length; i++) {
            const question = this.questions[i];
            if (!question.question_text || question.question_text.trim() === '') {
                this.expandedQuestion = i;
                return;
            }
            if (!question.question_type) {
                this.expandedQuestion = i;
                return;
            }
            if (!question.points || question.points <= 0) {
                this.expandedQuestion = i;
                return;
            }
            if (question.question_type === 'mcq') {
                if (!question.answers || question.answers.length === 0) {
                    this.expandedQuestion = i;
                    return;
                }
                for (let j = 0; j < question.answers.length; j++) {
                    if (!question.answers[j].text || question.answers[j].text.trim() === '') {
                        question.answers[j].error = true;
                        this.expandedQuestion = i;
                        return;
                    } else {
                        question.answers[j].error = false;
                    }
                }
                if (question.correct_answer === null || question.correct_answer === undefined) {
                    this.expandedQuestion = i;
                    return;
                }
            }
            if (question.question_type === 'truefalse') {
                if (!question.answers || question.answers.length < 2) {
                    this.expandedQuestion = i;
                    return;
                }
                for (let j = 0; j < question.answers.length; j++) {
                    if (!question.answers[j].text || question.answers[j].text.trim() === '') {
                        question.answers[j].error = true;
                        this.expandedQuestion = i;
                        return;
                    } else {
                        question.answers[j].error = false;
                    }
                }
                if (question.correct_answer === null || question.correct_answer === undefined) {
                    this.expandedQuestion = i;
                    return;
                }
            }
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
                    console.error('Error updating assignment:', error);
                    this.toaster.showError('Failed to update assignment');
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
        const questionsPayload = this.questions.map((question, index) => ({
            id: question.id || undefined,
            record_type: question.id ? 'update' : 'create',
            question_type: this.getQuestionTypeCode(question.question_type),
            question_text: question.question_text,
            points: question.points,
            order: index + 1,
            is_required: question.is_required || false,
            // Media array: includes uploaded file responses from /recruiter/assignments/upload-file
            // Each media object contains the API response data needed for server processing
            media: question.media.map((media: any, mediaIndex: number) => ({
                id: media.id || undefined,
                record_type: media.id ? 'update' : 'create',
                media_type: this.getMediaTypeCode(media.type),
                // File data comes from the upload-file API response
                // This structure ensures the server receives all necessary URLs and metadata
                file: media.file ? {
                    image_url: media.file.image_url, // URL where file is stored
                    generate_signed_url: media.file.generate_signed_url, // Signed URL for access
                    info: media.file.info // File metadata (name, size, extension, type)
                } : undefined,
                order: mediaIndex + 1
            })).filter((m: any) => m.file || m.id), // Only include media with files or existing records
            answers: question.answers.map((answer: any, answerIndex: number) => ({
                id: answer.id || undefined,
                record_type: answer.id ? 'update' : 'create',
                text: answer.text,
                order: answerIndex + 1,
                is_correct: answer.is_correct || false
            }))
        }));

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
        const newQuestion = {
            id: null,
            question_text: '',
            question_type: null,
            points: 0,
            is_required: false,
            media: [],
            answers: [],
            touched: false,
            questionTextTouched: false
        };
        this.questions.push(newQuestion);
        this.expandedQuestion = this.questions.length - 1;
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
            // Clean up media blob URL if exists
            const media = this.questions[this.pendingDeleteQuestionIndex].media?.[0];
            if (media && media.url && media.url.startsWith('blob:')) {
                URL.revokeObjectURL(media.url);
            }
            this.questions.splice(this.pendingDeleteQuestionIndex, 1);
            if (this.expandedQuestion === this.pendingDeleteQuestionIndex) {
                this.expandedQuestion = null;
            }
            this.toaster.showSuccess('Question deleted successfully', 'Deleted');
        }
        this.closeDeleteQuestionConfirmation();
    }

    toggleQuestion(index: number): void {
        this.expandedQuestion = this.expandedQuestion === index ? null : index;
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
        if (duplicated.answers) {
            duplicated.answers.forEach((a: any) => {
                a.touched = false;
            });
        }
        this.questions.splice(index + 1, 0, duplicated);
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
        }

        return null;
    }

    onMediaSelect(event: any, questionIndex: number): void {
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

            // Upload file to server
            this.jobOpeningsService.uploadAssignmentMedia(file)
                .pipe(
                    takeUntil(this.destroy$),
                    finalize(() => {
                        this.mediaUploadingIndex = null;
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

                        // Revoke old blob URL if exists to prevent memory leaks
                        const oldMedia = this.questions[questionIndex].media?.[0];
                        if (oldMedia && oldMedia.url && oldMedia.url.startsWith('blob:')) {
                            URL.revokeObjectURL(oldMedia.url);
                        }

                        // Force complete replacement - create new question object
                        const updatedQuestion = {
                            ...this.questions[questionIndex],
                            media: [mediaItem]
                        };

                        // Replace the entire questions array with a new one
                        this.questions = [
                            ...this.questions.slice(0, questionIndex),
                            updatedQuestion,
                            ...this.questions.slice(questionIndex + 1)
                        ];
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

    openDeleteMediaConfirmation(questionIndex: number): void {
        this.pendingDeleteMediaIndex = questionIndex;
        this.showDeleteMediaConfirmation = true;
    }

    closeDeleteMediaConfirmation(): void {
        this.showDeleteMediaConfirmation = false;
        this.pendingDeleteMediaIndex = null;
    }

    confirmDeleteMedia(): void {
        if (this.pendingDeleteMediaIndex !== null) {
            // Revoke blob URL if exists to prevent memory leaks
            const media = this.questions[this.pendingDeleteMediaIndex].media?.[0];
            if (media && media.url && media.url.startsWith('blob:')) {
                URL.revokeObjectURL(media.url);
            }
            this.questions[this.pendingDeleteMediaIndex].media = [];
            this.toaster.showSuccess('Media deleted successfully', 'Deleted');
        }
        this.closeDeleteMediaConfirmation();
    }

    removeMedia(questionIndex: number): void {
        // Open confirmation popup
        this.openDeleteMediaConfirmation(questionIndex);
    }

    setCorrectAnswer(questionIndex: number, answerIndex: number): void {
        const answer = this.questions[questionIndex].answers[answerIndex];

        // Validation: check if answer is not empty or only spaces
        if (!answer.text || answer.text.trim() === '') {
            answer.error = true;
            return;
        }

        answer.error = false;
        this.questions[questionIndex].correct_answer = answerIndex;
    }

    // Clear error when user types in answer input
    clearAnswerError(answer: any): void {
        answer.error = false;
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
                    touched: false
                }];
                this.questions[questionIndex].correct_answer = null;
            }
        } else if (type === 'truefalse') {
            // If switching to True/False, initialize with two answers
            this.questions[questionIndex].answers = [
                { text: '', is_correct: false, error: false, touched: false },
                { text: '', is_correct: false, error: false, touched: false }
            ];
            this.questions[questionIndex].correct_answer = null;
        }
    }

    // Add a new answer to the MCQ
    addAnswer(questionIndex: number): void {
        if (!this.questions[questionIndex].answers) {
            this.questions[questionIndex].answers = [];
        }
        this.questions[questionIndex].answers.push({
            text: '',
            is_correct: false,
            error: false,
            touched: false
        });
    }

    getTotalScore(): number {
        return this.questions.reduce((total, q) => total + (q.points || 0), 0);
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
