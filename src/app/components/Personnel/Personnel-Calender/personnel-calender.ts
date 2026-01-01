import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { PersonnelCalenderService } from './personnel-calender.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { FormsModule } from '@angular/forms';
import { NgClass, CommonModule } from '@angular/common';
import { CalendarComponent, CalendarDay } from '../../shared/calendar/calendar.component';

@Component({
  selector: 'app-personnel-calender',
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, NgClass, CommonModule, CalendarComponent],
  templateUrl: './personnel-calender.html',
  styleUrl: './personnel-calender.css'
})
export class PersonnelCalenderComponent {
  private calendarSub?: Subscription;
  isLoading = false;

  // Calendar data
  calendarDays: CalendarDay[] = [];
  currentDate: Date = new Date();
  selectedDate: Date = new Date();

  constructor(private cdr: ChangeDetectorRef, private calenderService: PersonnelCalenderService, private ngZone: NgZone) { }

  ngOnInit() {
    this.generateCalendar();
  }
  fetchCalendarForCurrentDate() {
    this.isLoading = true;
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;
    if (this.calendarSub) {
      this.calendarSub.unsubscribe();
    }
    this.calendarSub = this.calenderService.getCalendar(year, month).subscribe({
      next: (response) => {
        if (response?.data?.list_items) {
          const events: { title: string; date: string; type: string }[] = [];
          response.data.list_items.forEach((item: any) => {
            item.items.forEach((event: any) => {
              let title = event.type;
              if (event.type === 'New Joiner') {
                title = `New Joiner: ${event.name_en || event.name_ar || ''}`;
              } else if (event.type === 'End Contracts') {
                title = `End Contract: ${event.name_en || event.name_ar || ''}`;
              } else if (event.type === 'End Probation') {
                title = `End Probation: ${event.name_en || event.name_ar || ''}`;
              } else {
                if (event.title) title += ` - ${event.title}`;
                if (event.name_en) title += ` - ${event.name_en}`;
              }
              events.push({
                title,
                date: item.date,
                type: event.type
              });
            });
          });
          this.events = events;
          this.generateCalendar();
          // Update sidebar events for the currently selected date
          const dateStr = this.formatDateToString(this.selectedDate);
          this.eventsDay = this.events.filter(e => e.date === dateStr);
          this.cdr.detectChanges();
        }
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Calendar API error:', err);
        setTimeout(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevLastDate - i);
      days.push({
        date,
        day: prevLastDate - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: this.isSameDay(date, this.selectedDate),
        events: this.getEventsForDate(date)
      });
    }

    // Current month days
    for (let i = 1; i <= lastDateOfMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday: this.isSameDay(date, today),
        isSelected: this.isSameDay(date, this.selectedDate),
        events: this.getEventsForDate(date)
      });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        day: i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: this.isSameDay(date, this.selectedDate),
        events: this.getEventsForDate(date)
      });
    }

    this.calendarDays = days;
  }
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  getEventsForDate(date: Date): { title: string; date: string; type: string }[] {
    const dateStr = this.formatDateToString(date);
    return this.events.filter(e => e.date === dateStr);
  }

  formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  goToToday() {
    const today = new Date();
    this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedDate = today;
    this.cdr.detectChanges();
    this.fetchCalendarForCurrentDate();
    this.generateCalendar();
    this.onDaySelected(this.calendarDays.find(d => this.isSameDay(d.date, today)) || this.calendarDays[0]);
  }

  onDayClick(day: CalendarDay) {
    this.selectedDate = day.date;
    this.generateCalendar();

    const dateStr = this.formatDateToString(day.date);
    this.selectedDateFormatted = day.date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });

    this.eventsDay = this.events.filter(e => e.date === dateStr);
    this.cdr.detectChanges();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.isLoading = true;
      this.cdr.detectChanges();

      const today = new Date();
      this.selectedDate = today;
      const dateStr = this.formatDateToString(today);

      this.selectedDateFormatted = today.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long'
      });

      this.eventsDay = this.events.filter(e => e.date === dateStr);
      this.fetchCalendarForCurrentDate();
    });
  }

  onMonthChanged(newDate: Date) {
    this.currentDate = newDate;
    this.cdr.detectChanges();
    this.fetchCalendarForCurrentDate();
    this.generateCalendar();
  }

  onDaySelected(day: CalendarDay) {
    this.selectedDate = day.date;
    this.generateCalendar();

    const dateStr = this.formatDateToString(day.date);
    this.selectedDateFormatted = day.date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });

    this.eventsDay = this.events.filter(e => e.date === dateStr);
    this.cdr.detectChanges();
  }

  onTodayClicked() {
    const today = new Date();
    this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.selectedDate = today;
    this.cdr.detectChanges();
    this.fetchCalendarForCurrentDate();
    this.generateCalendar();
    this.onDaySelected(this.calendarDays.find(d => this.isSameDay(d.date, today)) || this.calendarDays[0]);
  }

  selectedDateFormatted: string = '';
  eventsDay: { title: string; date: string; type: string }[] = [];
  events = [
    // Multiple events on June 12
    { title: 'Holiday - Eid', date: '2025-06-12', type: 'Holiday' },
    { title: 'Blackout - Maintenance', date: '2025-06-12', type: 'Blackout' },
    { title: 'Meeting - Strategy Call', date: '2025-06-12', type: 'Meeting' },
    { title: 'Reminder - Submit Timesheet', date: '2025-06-12', type: 'Reminder' },
    { title: 'Meeting - Maintenance', date: '2025-06-12', type: 'Meeting' },
    { title: 'Reminder - Maintenance', date: '2025-06-12', type: 'Reminder' },
    // Multiple events on June 25
    { title: 'Blackout - System Upgrade', date: '2025-06-25', type: 'Blackout' },
    { title: 'Holiday - Internal Day Off', date: '2025-06-25', type: 'Holiday' },
    { title: 'Reminder - Team Outing', date: '2025-06-25', type: 'Reminder' },
    { title: 'Meeting - Planning', date: '2025-06-25', type: 'Meeting' },

    // Other events
    { title: 'Holiday - National Day', date: '2025-06-15', type: 'Holiday' },
    { title: 'Holiday - Company Off', date: '2025-06-22', type: 'Holiday' },
    { title: 'Meeting - Team Sync', date: '2025-06-20', type: 'Meeting' },
    { title: 'Reminder - Report Due', date: '2025-06-28', type: 'Reminder' }
  ];

  ngOnDestroy() {
    if (this.calendarSub) {
      this.calendarSub.unsubscribe();
    }
  }
}
