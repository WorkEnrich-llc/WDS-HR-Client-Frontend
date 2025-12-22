import { ChangeDetectorRef, Component, ViewChild, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { PersonnelCalenderService } from './personnel-calender.service';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personnel-calender',
  standalone: true,
  imports: [PageHeaderComponent, CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './personnel-calender.html',
  styleUrl: './personnel-calender.css'
})
export class PersonnelCalenderComponent {
  private calendarSub?: Subscription;
  eventTrackBy(index: number, event: { title: string; date: string; type: string }) {
    return event.date + '-' + event.title + '-' + event.type;
  }
  isLoading = false;
  // Month/Year Picker UI
  showMonthYearPicker = false;
  pickerMonth: number = new Date().getMonth();
  pickerYear: number = new Date().getFullYear();
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  years: number[] = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

  toggleMonthYearPicker() {
    this.showMonthYearPicker = !this.showMonthYearPicker;
    this.pickerMonth = this.currentDate.getMonth();
    this.pickerYear = this.currentDate.getFullYear();
    this.cdr.detectChanges();
  }
  @ViewChild('calendar') calendarComponent: FullCalendarComponent | undefined;
  constructor(private cdr: ChangeDetectorRef, private calenderService: PersonnelCalenderService, private ngZone: NgZone) { }

  // Month/Year Picker State
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
    this.calendarSub = this.calenderService.getCalendar(year, month).subscribe({
      next: (response) => {
        if (response?.data?.list_items) {
          // Show all events, including New Joiner, End Contracts, End Probation, etc.
          const events: { title: string; date: string; type: string }[] = [];
          response.data.list_items.forEach((item: any) => {
            item.items.forEach((event: any) => {
              let title = event.type;
              // Custom formatting for special types
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
          // Force FullCalendar to re-render by creating a new object reference
          this.calendarOptions = {
            ...this.calendarOptions,
            events: [...this.events],
            eventContent: function (arg) {
              // Custom rendering: show type and title
              const type = arg.event.extendedProps['type'];
              return {
                html: `<div class='fc-event-custom'><span class='fc-event-type'>${type}</span><br><span class='fc-event-title'>${arg.event.title}</span></div>`
              };
            }
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
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    fixedWeekCount: false,
    selectable: true,
    events: this.events,
    dayMaxEvents: 4,
    height: 'auto',
    eventClassNames: (arg) => {
      let eventType = (arg.event.extendedProps as any).type?.toLowerCase();
      // Normalize for New Joiner and End Contract
      if (eventType === 'new joiner') eventType = 'new-joiner';
      if (eventType === 'end contract') eventType = 'end-contract';
      return [`event-${eventType}`];
    },
    dateClick: this.handleDateClick.bind(this),
    eventClick: (arg) => {
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
        month: 'long'
      });

      this.eventsDay = this.events.filter(e => e.date === clickedDate);
    });
  }

  ngOnDestroy() {
    if (this.calendarSub) {
      this.calendarSub.unsubscribe();
    }
  }
}
