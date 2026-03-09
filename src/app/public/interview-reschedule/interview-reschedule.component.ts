import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { InterviewService } from '../../core/services/recruitment/interview.service';
import { ToastrService } from 'ngx-toastr';
import { DatePickerComponent } from '../../components/shared/date-picker/date-picker.component';

/** Validates that the reschedule date + time is in the future (local time). */
function rescheduleInFutureValidator(control: AbstractControl): ValidationErrors | null {
  const group = control as FormGroup;
  const dateVal = group.get('rescheduleDate')?.value;
  const hourVal = group.get('rescheduleHour')?.value;
  const minuteVal = group.get('rescheduleMinute')?.value;
  if (dateVal == null || dateVal === '' || hourVal == null || hourVal === '' || minuteVal == null || minuteVal === '') {
    return null;
  }
  const [y, m, d] = (dateVal as string).split('-').map(Number);
  const h = parseInt(hourVal as string, 10);
  const min = parseInt(minuteVal as string, 10);
  const chosen = new Date(y, m - 1, d, h, min, 0, 0);
  const now = new Date();
  return chosen.getTime() > now.getTime() ? null : { rescheduleInFuture: true };
}

@Component({
  selector: 'app-interview-reschedule',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, DatePickerComponent],
  templateUrl: './interview-reschedule.component.html',
  styleUrls: ['./interview-reschedule.component.css']
})
export class InterviewRescheduleComponent implements OnInit, AfterViewChecked {
  rescheduleForm!: FormGroup;
  isSubmitting = false;
  isSubmitted = false;
  errorMessage: string | null = null;

  // URL parameters
  token: string | null = null;
  applicantName: string | null = null;

  isTimePickerOpen = false;
  private scrollTimePickerOnce = false;

  @ViewChild('timePickerPopup') timePickerPopup?: ElementRef<HTMLElement>;
  @ViewChild('timePickerTrigger') timePickerTrigger?: ElementRef<HTMLElement>;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private interviewService: InterviewService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Get token and applicant info from URL query params
    this.route.queryParams.subscribe(params => {
      this.token = params['s'] || null;
      this.applicantName = params['name'] || 'Candidate';

      if (!this.token) {
        this.errorMessage = 'Invalid interview token. Please check your email link.';
      }
    });

    // Initialize form (hour and minute only — no seconds)
    this.rescheduleForm = this.fb.group({
      rescheduleDate: ['', [Validators.required]],
      rescheduleHour: ['', [Validators.required]],
      rescheduleMinute: ['', [Validators.required]]
    }, { validators: rescheduleInFutureValidator });
  }

  hourOptions: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  minuteOptions: string[] = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  get displayTime(): string {
    const h = this.rescheduleForm?.get('rescheduleHour')?.value;
    const m = this.rescheduleForm?.get('rescheduleMinute')?.value;
    const hasHour = h != null && h !== '';
    const hasMinute = m != null && m !== '';
    if (hasHour && hasMinute) return `${h} : ${m}`;
    if (hasHour) return `${h} : --`;
    if (hasMinute) return `-- : ${m}`;
    return '';
  }

  get hasAnyTimeSelected(): boolean {
    const h = this.rescheduleForm?.get('rescheduleHour')?.value;
    const m = this.rescheduleForm?.get('rescheduleMinute')?.value;
    return (h != null && h !== '') || (m != null && m !== '');
  }

  openTimePicker(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isTimePickerOpen = true;
    this.scrollTimePickerOnce = true;
  }

  closeTimePicker(): void {
    this.isTimePickerOpen = false;
    this.scrollTimePickerOnce = false;
    this.rescheduleForm.get('rescheduleHour')?.markAsTouched();
    this.rescheduleForm.get('rescheduleMinute')?.markAsTouched();
  }

  selectHour(value: string): void {
    this.rescheduleForm.patchValue({ rescheduleHour: value });
    if (this.hasBothTimePartsSelected) this.closeTimePicker();
  }

  selectMinute(value: string): void {
    this.rescheduleForm.patchValue({ rescheduleMinute: value });
    if (this.hasBothTimePartsSelected) this.closeTimePicker();
  }

  get hasBothTimePartsSelected(): boolean {
    const h = this.rescheduleForm?.get('rescheduleHour')?.value;
    const m = this.rescheduleForm?.get('rescheduleMinute')?.value;
    return (h != null && h !== '') && (m != null && m !== '');
  }

  onTimePickerClick(event: Event): void {
    event.stopPropagation();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isTimePickerOpen) return;
    const target = event?.target as Node | null;
    const popup = this.timePickerPopup?.nativeElement;
    const trigger = this.timePickerTrigger?.nativeElement;
    if (target && popup?.contains(target)) return;
    if (target && trigger?.contains(target)) return;
    this.closeTimePicker();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isTimePickerOpen) this.closeTimePicker();
  }

  ngAfterViewChecked(): void {
    if (!this.scrollTimePickerOnce || !this.isTimePickerOpen || !this.timePickerPopup?.nativeElement) return;
    this.scrollTimePickerOnce = false;
    const popup = this.timePickerPopup.nativeElement;
    const hourEl = popup.querySelector('[data-time-column="hour"] .time-picker-option.selected');
    const minuteEl = popup.querySelector('[data-time-column="minute"] .time-picker-option.selected');
    hourEl?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
    minuteEl?.scrollIntoView?.({ block: 'nearest', behavior: 'auto' });
  }

  onSubmit(): void {
    // Prevent multiple submissions
    if (this.isSubmitting) {
      return;
    }

    if (this.rescheduleForm.invalid) {
      this.rescheduleForm.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Invalid interview token. Please try again.';
      this.toastr.error('Invalid interview token');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const rescheduleDate = this.rescheduleForm.value.rescheduleDate as string; // YYYY-MM-DD
    const hour = this.rescheduleForm.value.rescheduleHour as string;
    const minute = this.rescheduleForm.value.rescheduleMinute as string;
    const rescheduleAvailableAt = `${rescheduleDate}T${hour}:${minute}:00`; // API requires seconds; always send :00, UI stays hour:minute only

    this.interviewService.rescheduleInterview(this.token, rescheduleAvailableAt).subscribe({
      next: (response) => {
        this.isSubmitted = true;
        this.isSubmitting = false;
        this.toastr.success('Your interview has been rescheduled successfully!');
        console.log('Interview rescheduled successfully:', response);
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  get rescheduleDate() {
    return this.rescheduleForm.get('rescheduleDate');
  }

  get rescheduleHour() {
    return this.rescheduleForm.get('rescheduleHour');
  }

  get rescheduleMinute() {
    return this.rescheduleForm.get('rescheduleMinute');
  }
}