import { Component, Input, Output, EventEmitter, ChangeDetectorRef, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: { title: string; date: string; type: string }[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, NgClass, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  @Input() isLoading = false;
  @Input() calendarDays: CalendarDay[] = [];
  @Input() currentDate: Date = new Date();
  @Input() events: { title: string; date: string; type: string }[] = [];

  @Output() daySelected = new EventEmitter<CalendarDay>();
  @Output() monthChanged = new EventEmitter<Date>();
  @Output() todayClicked = new EventEmitter<void>();

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  selectedDate: Date = new Date();

  // Month/Year Picker UI
  showMonthYearPicker = false;
  pickerMonth: number = new Date().getMonth();
  pickerYear: number = new Date().getFullYear();
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  years: number[] = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

  get selectedMonthYear(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) { }

  @HostListener('document:click', ['$event'])
  closeDropdownOnClickOutside(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside && this.showMonthYearPicker) {
      this.showMonthYearPicker = false;
    }
  }

  ngOnInit() {
    this.selectedDate = new Date();
  }

  toggleMonthYearPicker() {
    this.showMonthYearPicker = !this.showMonthYearPicker;
    this.pickerMonth = this.currentDate.getMonth();
    this.pickerYear = this.currentDate.getFullYear();
    this.cdr.detectChanges();
  }

  prevMonth() {
    const newDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.monthChanged.emit(newDate);
  }

  nextMonth() {
    const newDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.monthChanged.emit(newDate);
  }

  setMonthYear() {
    const newDate = new Date(this.pickerYear, this.pickerMonth, 1);
    this.monthChanged.emit(newDate);
    this.showMonthYearPicker = false;
    this.cdr.detectChanges();
  }

  goToToday() {
    this.todayClicked.emit();
  }

  onDayClick(day: CalendarDay) {
    this.selectedDate = day.date;
    this.daySelected.emit(day);
  }

  getTotalEventCount(events: any[]): number {
    return events.length;
  }

  getVisibleEvents(events: any[], maxVisible: number = 4): any[] {
    return events.slice(0, maxVisible);
  }

  getRemainingEventsCount(events: any[], maxVisible: number = 4): number {
    return Math.max(0, events.length - maxVisible);
  }

  getEventClass(type: string): string {
    const normalized = type.toLowerCase().replace(/ /g, '-');
    return `event-${normalized}`;
  }
}
