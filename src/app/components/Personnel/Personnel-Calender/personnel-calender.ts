import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
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
  }
  @ViewChild('calendar') calendarComponent: FullCalendarComponent | undefined;
  constructor(private cdr: ChangeDetectorRef, private calenderService: PersonnelCalenderService) { }

  // Month/Year Picker State
  currentDate: Date = new Date();
  get selectedMonthYear(): string {
    return this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }
  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.fetchCalendarForCurrentDate();
    this.updateCalendarMonth();
  }
  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.fetchCalendarForCurrentDate();
    this.updateCalendarMonth();
  }
  setMonthYear() {
    this.currentDate = new Date(this.pickerYear, this.pickerMonth, 1);
    this.showMonthYearPicker = false;
    this.fetchCalendarForCurrentDate();
    this.updateCalendarMonth();
  }
  fetchCalendarForCurrentDate() {
    this.isLoading = true;
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth() + 1;
    this.calenderService.getCalendar(year, month).subscribe({
      next: (response) => {
        if (response?.data?.list_items) {
          // Group events by date and type to avoid duplication
          const eventMap: { [key: string]: { title: string; date: string; type: string } } = {};
          response.data.list_items.forEach((item: any) => {
            item.items.forEach((event: any) => {
              const key = `${item.date}_${event.type}`;
              let title = event.type;
              if (event.title) title += ' - ' + event.title;
              if (event.name_en) title += ' - ' + event.name_en;
              if (eventMap[key]) {
                // Merge titles for same type on same day
                eventMap[key].title += `, ${title}`;
              } else {
                eventMap[key] = {
                  title,
                  date: item.date,
                  type: event.type
                };
              }
            });
          });
          this.events = Object.values(eventMap);
          this.calendarOptions = {
            ...this.calendarOptions,
            events: this.events
          };
          this.cdr.detectChanges();
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Calendar API error:', err);
        this.isLoading = false;
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
    this.isLoading = true;
    setTimeout(() => {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      this.handleDateClick({ dateStr });

      const calendarApi = this.calendarComponent?.getApi();
      calendarApi?.select(today);

      this.cdr.detectChanges();
    });
    this.fetchCalendarForCurrentDate();
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
      const eventType = (arg.event.extendedProps as any).type?.toLowerCase();
      return [`event-${eventType}`];
    },
    dateClick: this.handleDateClick.bind(this)
  };

  handleDateClick(arg: any) {
    const clickedDate = arg.dateStr;
    const dateObj = new Date(clickedDate);

    this.selectedDateFormatted = dateObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    });

    this.eventsDay = this.events.filter(e => e.date === clickedDate);
  }
}
