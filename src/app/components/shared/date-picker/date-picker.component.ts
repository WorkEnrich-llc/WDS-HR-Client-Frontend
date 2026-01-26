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
    @Input() positionAbove: boolean = false; // Position calendar above input instead of below

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
    /** Set when user selects month/year; prevents document click from closing calendar (dropdown is removed so target is detached). */
    private justSelectedFromPicker: boolean = false;

    // Year picker navigation
    yearPickerStartYear: number = 0;
    yearPickerEndYear: number = 0;
    yearsPerPage: number = 20; // Number of years to show per page


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
    onClickOutside(_event: Event): void {
        if (this.justSelectedFromPicker) {
            this.justSelectedFromPicker = false;
            return;
        }
        if (!this.elementRef.nativeElement.contains(_event.target as Node)) {
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
        this.justSelectedFromPicker = true;
        this.buildCalendar();
    }

    selectYear(yearData: { year: number; disabled: boolean }): void {
        if (yearData.disabled) return;
        this.currentYear = yearData.year;
        this.showYearPicker = false;
        this.justSelectedFromPicker = true;
        this.buildCalendar();
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

    onInputClick(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.disabled) {
            this.toggleCalendar();
        }
    }

    onIconClick(event: Event): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.disabled) {
            this.toggleCalendar();
        }
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