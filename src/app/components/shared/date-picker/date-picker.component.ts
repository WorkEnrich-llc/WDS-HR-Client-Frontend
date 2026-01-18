import { Component, Input, Output, EventEmitter, OnInit, forwardRef, HostListener, ElementRef, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-date-picker',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './date-picker.component.html',
    styleUrls: ['./date-picker.component.css'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: true
        }
    ]
})
export class DatePickerComponent implements OnInit, ControlValueAccessor {
    @Input() label: string = '';
    @Input() placeholder: string = 'Select a date';
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() disableBeforeDate: boolean = true; // Flag to disable dates before today
    @Input() minDate: string | null = null; // Dynamic minimum date (ISO format: YYYY-MM-DD)
    @Input() maxDate: string | null = null; // Maximum date (ISO format: YYYY-MM-DD)
    @Input() errorMessage: string | null = null;
    @Input() showTime: boolean = false; // For date-time selection

    @Output() dateChange = new EventEmitter<string>();

    @ViewChild('calendarPopup', { static: false }) calendarPopup!: ElementRef;
    @ViewChild('dateInput', { static: false }) dateInput!: ElementRef;
    @ViewChild('dateWrapper', { static: false }) dateWrapper!: ElementRef;

    value: string = '';
    displayValue: string = '';
    minDateValue: string = '';
    maxDateValue: string = '';

    // Calendar state
    isCalendarOpen: boolean = false;
    currentMonth: number = 0; // 0-11
    currentYear: number = 0;
    selectedDate: Date | null = null;

    // Month/Year picker state
    showMonthPicker: boolean = false;
    showYearPicker: boolean = false;

    // Year picker navigation
    yearPickerStartYear: number = 0;
    yearPickerEndYear: number = 0;
    yearsPerPage: number = 20; // Number of years to show per page

    // Popup positioning
    popupTop: string = '0px';
    popupLeft: string = '0px';
    popupPositionAbove: boolean = false;

    // Month and year lists
    months: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    years: Array<{ year: number; disabled: boolean }> = [];

    // Calendar data
    weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    calendarDays: Array<{ date: Date; disabled: boolean; isToday: boolean; isSelected: boolean; isOtherMonth: boolean }> = [];

    private onChange = (value: string) => { };
    private onTouched = () => { };

    constructor(private elementRef: ElementRef) {
        const now = new Date();
        this.currentMonth = now.getMonth();
        this.currentYear = now.getFullYear();
        this.generateYearList();
    }

    ngOnInit(): void {
        this.updateMinDate();
        if (this.value) {
            const date = new Date(this.value);
            if (!isNaN(date.getTime())) {
                this.selectedDate = date;
                this.currentMonth = date.getMonth();
                this.currentYear = date.getFullYear();
            }
        }
        this.generateYearList();
        this.buildCalendar();
    }

    private generateYearList(): void {
        const currentYear = new Date().getFullYear();

        // Set default range if year picker hasn't been initialized
        if (this.yearPickerStartYear === 0) {
            this.yearPickerStartYear = currentYear - 10; // Start 10 years back
            this.yearPickerEndYear = currentYear + 20; // End 20 years forward
        }

        this.years = [];

        // Get min/max date restrictions
        let minYear: number | null = null;
        let maxYear: number | null = null;

        if (this.minDateValue) {
            const minDate = new Date(this.minDateValue);
            minYear = minDate.getFullYear();
        }

        if (this.maxDateValue) {
            const maxDate = new Date(this.maxDateValue);
            maxYear = maxDate.getFullYear();
        }

        // Generate years for current page
        for (let year = this.yearPickerStartYear; year <= this.yearPickerEndYear; year++) {
            let disabled = false;

            // Disable years before minDate
            if (minYear !== null && year < minYear) {
                disabled = true;
            }

            // Disable years after maxDate
            if (maxYear !== null && year > maxYear) {
                disabled = true;
            }

            this.years.push({ year, disabled });
        }
    }

    previousYearPage(): void {
        const yearRange = this.yearPickerEndYear - this.yearPickerStartYear + 1;
        this.yearPickerStartYear -= yearRange;
        this.yearPickerEndYear -= yearRange;
        this.generateYearList();
    }

    nextYearPage(): void {
        const yearRange = this.yearPickerEndYear - this.yearPickerStartYear + 1;
        this.yearPickerStartYear += yearRange;
        this.yearPickerEndYear += yearRange;
        this.generateYearList();
    }

    canGoToPreviousYearPage(): boolean {
        if (!this.minDateValue) return true;
        const minDate = new Date(this.minDateValue);
        const minYear = minDate.getFullYear();
        return this.yearPickerStartYear > minYear;
    }

    canGoToNextYearPage(): boolean {
        if (!this.maxDateValue) return true;
        const maxDate = new Date(this.maxDateValue);
        const maxYear = maxDate.getFullYear();
        return this.yearPickerEndYear < maxYear;
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event): void {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            if (this.showMonthPicker || this.showYearPicker) {
                this.showMonthPicker = false;
                this.showYearPicker = false;
            } else if (this.isCalendarOpen) {
                this.closeCalendar();
            }
        }
    }

    private updateMinDate(): void {
        if (this.disableBeforeDate) {
            if (this.minDate) {
                this.minDateValue = this.minDate;
            } else {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                this.minDateValue = today.toISOString().split('T')[0];
            }
        } else {
            this.minDateValue = this.minDate || '';
        }

        if (this.maxDate) {
            this.maxDateValue = this.maxDate;
        }

        // Regenerate year list when min/max dates change
        if (this.years.length > 0) {
            this.generateYearList();
        }
    }

    toggleCalendar(): void {
        if (this.disabled) return;
        this.isCalendarOpen = !this.isCalendarOpen;
        if (this.isCalendarOpen) {
            if (!this.selectedDate) {
                const now = new Date();
                this.currentMonth = now.getMonth();
                this.currentYear = now.getFullYear();
            } else {
                this.currentMonth = this.selectedDate.getMonth();
                this.currentYear = this.selectedDate.getFullYear();
            }
            this.showMonthPicker = false;
            this.showYearPicker = false;
            this.updatePopupPosition();
            this.buildCalendar();
            this.onTouched();
        }
    }

    toggleMonthPicker(): void {
        this.showMonthPicker = !this.showMonthPicker;
        this.showYearPicker = false;
    }

    toggleYearPicker(): void {
        this.showYearPicker = !this.showYearPicker;
        this.showMonthPicker = false;
        if (this.showYearPicker) {
            // Initialize year picker around current year or selected year
            const targetYear = this.currentYear || new Date().getFullYear();
            const yearRange = this.yearsPerPage;
            const halfRange = Math.floor(yearRange / 2);

            // Reset year range if it hasn't been initialized or if we need to center on current year
            if (this.yearPickerStartYear === 0 ||
                this.currentYear < this.yearPickerStartYear ||
                this.currentYear > this.yearPickerEndYear) {
                this.yearPickerStartYear = targetYear - halfRange;
                this.yearPickerEndYear = targetYear + halfRange;
            }

            this.generateYearList();
        }
    }

    selectMonth(monthIndex: number): void {
        this.currentMonth = monthIndex;
        this.showMonthPicker = false;
        this.buildCalendar();
    }

    selectYear(yearData: { year: number; disabled: boolean }): void {
        if (yearData.disabled) return;
        this.currentYear = yearData.year;
        this.showYearPicker = false;
        this.buildCalendar();
    }

    private updatePopupPosition(): void {
        setTimeout(() => {
            if (this.dateInput && this.dateInput.nativeElement) {
                const inputElement = this.dateInput.nativeElement;
                const inputRect = inputElement.getBoundingClientRect();
                const computedStyle = window.getComputedStyle(inputElement);

                // Get the computed border and padding values
                const borderLeftWidth = parseFloat(computedStyle.borderLeftWidth) || 0;
                const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;

                // Use wrapper element if available, otherwise use input
                let containerRect = inputRect;
                if (this.dateWrapper && this.dateWrapper.nativeElement) {
                    containerRect = this.dateWrapper.nativeElement.getBoundingClientRect();
                }

                const spacing = 0; // No spacing - directly adjacent to input
                const popupHeight = 380; // Approximate height of calendar popup (can be adjusted)
                const viewportHeight = window.innerHeight;

                // Calculate space below and above the input
                const spaceBelow = viewportHeight - inputRect.bottom;
                const spaceAbove = inputRect.top;

                // Check if there's enough space below (popup height + some buffer)
                const enoughSpaceBelow = spaceBelow >= (popupHeight + 20);

                if (enoughSpaceBelow) {
                    // Position below input - directly adjacent, no gap
                    this.popupTop = `${inputRect.bottom}px`;
                    this.popupPositionAbove = false;
                } else {
                    // Position above input - directly adjacent, no gap
                    this.popupTop = `${inputRect.top - popupHeight}px`;
                    this.popupPositionAbove = true;

                    // If there's not enough space above either, position below anyway (will scroll)
                    if (spaceAbove < popupHeight) {
                        this.popupTop = `${inputRect.bottom}px`;
                        this.popupPositionAbove = false;
                    }
                }

                // Align left edge of popup with left edge of input
                // Use input's left edge directly for precise alignment
                this.popupLeft = `${inputRect.left}px`;

                // Adjust if popup would go off-screen to the right
                const popupWidth = 320; // Approximate width of calendar popup
                if (inputRect.left + popupWidth > window.innerWidth) {
                    this.popupLeft = `${window.innerWidth - popupWidth - 16}px`; // 16px margin from edge
                }

                // Adjust if popup would go off-screen to the left
                if (inputRect.left < 0) {
                    this.popupLeft = '16px'; // 16px margin from edge
                }
            }
        }, 0);
    }

    @HostListener('window:scroll')
    @HostListener('window:resize')
    onWindowScrollOrResize(): void {
        if (this.isCalendarOpen) {
            this.updatePopupPosition();
        }
    }

    closeCalendar(): void {
        this.isCalendarOpen = false;
    }

    buildCalendar(): void {
        this.calendarDays = [];
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const minDate = this.minDateValue ? new Date(this.minDateValue) : null;
        const maxDate = this.maxDateValue ? new Date(this.maxDateValue) : null;

        // Generate 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const isOtherMonth = date.getMonth() !== this.currentMonth;
            const isToday = date.getTime() === today.getTime();
            const isSelected = this.selectedDate ? date.toDateString() === this.selectedDate.toDateString() : false;

            let disabled = false;
            if (minDate) {
                const minDateOnly = new Date(minDate);
                minDateOnly.setHours(0, 0, 0, 0);
                if (date < minDateOnly) disabled = true;
            }
            if (maxDate && !disabled) {
                const maxDateOnly = new Date(maxDate);
                maxDateOnly.setHours(0, 0, 0, 0);
                if (date > maxDateOnly) disabled = true;
            }

            this.calendarDays.push({
                date: new Date(date),
                disabled,
                isToday,
                isSelected,
                isOtherMonth
            });
        }
    }

    previousMonth(): void {
        if (this.currentMonth === 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else {
            this.currentMonth--;
        }
        this.buildCalendar();
    }

    nextMonth(): void {
        if (this.currentMonth === 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else {
            this.currentMonth++;
        }
        this.buildCalendar();
    }

    selectDate(day: { date: Date; disabled: boolean }): void {
        if (day.disabled) return;

        this.selectedDate = new Date(day.date);
        this.selectedDate.setHours(12, 0, 0, 0);

        if (this.showTime) {
            const now = new Date();
            this.selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
        }

        this.displayValue = this.formatDateForDisplay(this.selectedDate);
        this.value = this.selectedDate.toISOString();

        this.onChange(this.value);
        this.dateChange.emit(this.value);
        this.closeCalendar();
        this.buildCalendar();
    }

    getMonthName(): string {
        return this.months[this.currentMonth];
    }

    getCurrentYear(): number {
        return this.currentYear;
    }

    formatDateForDisplay(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}/${year}`;
    }

    onInputClick(): void {
        this.toggleCalendar();
    }

    onInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        // Prevent manual typing - only allow calendar selection
        input.value = this.displayValue;
    }

    // ControlValueAccessor implementation
    writeValue(value: string): void {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                this.value = value;
                this.selectedDate = new Date(date);
                this.displayValue = this.formatDateForDisplay(this.selectedDate);
                this.currentMonth = date.getMonth();
                this.currentYear = date.getFullYear();
                this.buildCalendar();
            } else {
                if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const dateOnly = new Date(value + 'T12:00:00');
                    this.selectedDate = dateOnly;
                    this.value = dateOnly.toISOString();
                    this.displayValue = this.formatDateForDisplay(dateOnly);
                    this.currentMonth = dateOnly.getMonth();
                    this.currentYear = dateOnly.getFullYear();
                    this.buildCalendar();
                } else {
                    this.value = '';
                    this.displayValue = '';
                    this.selectedDate = null;
                }
            }
        } else {
            this.value = '';
            this.displayValue = '';
            this.selectedDate = null;
        }
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // Public method for template to call onTouched
    onBlur(): void {
        this.onTouched();
    }

    // Keyboard navigation
    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (this.isCalendarOpen) {
            switch (event.key) {
                case 'Escape':
                    this.closeCalendar();
                    event.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.previousMonth();
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    this.nextMonth();
                    event.preventDefault();
                    break;
            }
        }
    }
}