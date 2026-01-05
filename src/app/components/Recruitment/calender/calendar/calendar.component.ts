import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CalendarService } from './calendar.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CalendarComponent as SharedCalendarComponent, CalendarDay } from '../../../shared/calendar/calendar.component';

import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass, CommonModule } from '@angular/common';

export interface CalendarEvent {
  title: string;
  date: string;
  type: string;
  id?: string;
  interviewer?: string;
  interviewee?: string;
  location?: string;
  start?: string;
  end?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-recruitment-calendar',
  standalone: true,
  imports: [PageHeaderComponent, SharedCalendarComponent, FormsModule, DatePipe, NgClass, CommonModule],
  providers: [DatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})

export class CalendarComponent implements OnInit, OnDestroy {
  private calendarSub?: Subscription;
  isLoading = false;
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  selectedDate: Date = new Date();
  selectedDateFormatted: string = '';
  eventsDay: CalendarEvent[] = [];
  events: CalendarEvent[] = [];

  get selectedMonthYear(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  eventTrackBy(index: number, event: CalendarEvent) {
    return event.id || (event.date + '-' + event.title + '-' + event.type);
  }

  constructor(private cdr: ChangeDetectorRef, private calendarService: CalendarService) { }
  fetchCalendarForCurrentDate() {
    this.isLoading = true;
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;
    if (this.calendarSub) {
      this.calendarSub.unsubscribe();
    }
    this.calendarSub = this.calendarService.getCalendar(year, month).subscribe({
      next: (response) => {
        if (response?.data?.list_items) {
          const events: CalendarEvent[] = [];
          response.data.list_items.forEach((item: any) => {
            item.items.forEach((event: any) => {
              events.push({
                ...event,
                date: item.date,
                title: event.title || event.type,
                type: event.type
              });
            });
          });
          this.events = events;
          this.generateCalendar();
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
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const calendarDays: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= lastDay || calendarDays.length % 7 !== 0) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayEvents = this.events.filter(e => e.date === dateStr);

      calendarDays.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isSameDay(currentDate, new Date()),
        isSelected: this.isSameDay(currentDate, this.selectedDate),
        events: dayEvents.map(e => ({
          title: e.title,
          date: e.date,
          type: e.type
        }))
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.calendarDays = calendarDays;
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  onMonthChanged(date: Date) {
    this.currentDate = date;
    this.fetchCalendarForCurrentDate();
  }

  onDaySelected(day: CalendarDay) {
    this.selectedDate = day.date;
    const dateStr = day.date.toISOString().split('T')[0];
    this.selectedDateFormatted = day.date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    this.eventsDay = this.events.filter(e => e.date === dateStr);
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  onTodayClicked() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.fetchCalendarForCurrentDate();
  }

  ngOnInit() {
    this.fetchCalendarForCurrentDate();
    const today = new Date();
    this.selectedDateFormatted = today.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  ngOnDestroy() {
    if (this.calendarSub) {
      this.calendarSub.unsubscribe();
    }
  }
}
