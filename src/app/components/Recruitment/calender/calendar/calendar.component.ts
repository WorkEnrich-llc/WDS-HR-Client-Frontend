import { ChangeDetectorRef, Component, ViewChild, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { CalendarService } from './calendar.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { FormsModule } from '@angular/forms';

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
  selector: 'app-calendar',
  standalone: true,
  imports: [PageHeaderComponent, CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})

export class CalendarComponent {
  private calendarSub?: Subscription;
  isLoading = false;
  showMonthYearPicker = false;
  pickerMonth: number = new Date().getMonth();
  pickerYear: number = new Date().getFullYear();
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  years: number[] = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

  eventTrackBy(index: number, event: CalendarEvent) {
    return event.id || (event.date + '-' + event.title + '-' + event.type);
  }

  toggleMonthYearPicker() {
    this.showMonthYearPicker = !this.showMonthYearPicker;
    if (this.showMonthYearPicker) {
      setTimeout(() => {
        this.pickerMonth = this.currentDate.getMonth();
        this.pickerYear = this.currentDate.getFullYear();
      });
    }
    this.cdr.detectChanges();
  }

  @ViewChild('calendar') calendarComponent: FullCalendarComponent | undefined;
  constructor(private cdr: ChangeDetectorRef, private calendarService: CalendarService, private ngZone: NgZone) { }

  currentDate: Date = new Date();
  get selectedMonthYear(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.cdr.detectChanges();
    this.fetchCalendarForCurrentDate();
    this.updateCalendarMonth();
  }
  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.cdr.detectChanges();
    this.fetchCalendarForCurrentDate();
    this.updateCalendarMonth();
  }
  setMonthYear() {
    this.currentDate = new Date(this.pickerYear, this.pickerMonth, 1);
    this.showMonthYearPicker = false;
    this.cdr.detectChanges();
    this.fetchCalendarForCurrentDate();
    this.updateCalendarMonth();
  }
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
          // Map each event with all details for calendar and day details
          const events: CalendarEvent[] = [];
          response.data.list_items.forEach((item: any) => {
            item.items.forEach((event: any) => {
              events.push({
                ...event,
                date: item.date,
                // For FullCalendar display
                title: event.title || event.type,
                type: event.type
              });
            });
          });
          this.events = events;
          this.calendarOptions = {
            ...this.calendarOptions,
            events: this.events
          };
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

  updateCalendarMonth() {
    const calendarApi = this.calendarComponent?.getApi();
    if (calendarApi) {
      calendarApi.gotoDate(this.currentDate);
    }
    this.cdr.detectChanges();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.isLoading = true;
      this.cdr.detectChanges();

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      this.handleDateClick({ dateStr });

      const calendarApi = this.calendarComponent?.getApi();
      calendarApi?.select(today);

      this.fetchCalendarForCurrentDate();
    });
  }

  selectedDateFormatted: string = '';
  eventsDay: CalendarEvent[] = [];
  events: CalendarEvent[] = [];
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    fixedWeekCount: false,
    selectable: true,
    events: [],
    dayMaxEvents: 4,
    height: 'auto',
    eventClassNames: (arg) => {
      const eventType = (arg.event.extendedProps as any).type?.toLowerCase();
      return [`event-${eventType}`];
    },
    dateClick: this.handleDateClick.bind(this),
    eventClick: (arg) => {
      // arg.event.startStr is the date string for the event
      this.handleDateClick({ dateStr: arg.event.startStr });
    }
  };

  handleDateClick(arg: any) {
    this.ngZone.run(() => {
      const clickedDate = arg.dateStr;
      const dateObj = new Date(clickedDate);

      this.selectedDateFormatted = dateObj.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      // Show all events for the selected date
      this.eventsDay = this.events.filter(e => e.date === clickedDate);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.calendarSub) {
      this.calendarSub.unsubscribe();
    }
  }
}
