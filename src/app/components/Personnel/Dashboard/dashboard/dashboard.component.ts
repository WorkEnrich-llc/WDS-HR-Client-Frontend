import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, CommonModule, FullCalendarModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
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

  if (this.eventsDay.length) {
    // console.log(`Events on ${this.selectedDateFormatted}:`);
    this.eventsDay.forEach(event =>
      console.log(`- ${event.title} (${event.type})`)
    );
  } else {
    // console.log(`No events on ${this.selectedDateFormatted}.`);
  }
}


}
