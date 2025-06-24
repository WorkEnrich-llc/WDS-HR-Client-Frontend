import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';



interface EmployeeData {
  id: number;
  name: string;
  employeeStatus: string;
  accountStatus: 'active' | 'inactive';
  jobTitle: string;
  branch: string;
  joinDate: string;
}
@Component({
  selector: 'app-view-employee',
  imports: [PageHeaderComponent, CommonModule,RouterLink,PopupComponent,FullCalendarModule],
  templateUrl: './view-employee.component.html',
  styleUrl: './view-employee.component.css'
})
export class ViewEmployeeComponent {
   employeeData: EmployeeData = {
    id: 3,
    name: "Michael Brown",
    employeeStatus: "Employed",
    accountStatus: "active",
    jobTitle: "UI/UX Designer",
    branch: "Berlin",
    joinDate: "2023-09-23"
  };



  // calender

  selectedDateFormatted: string = '';
  eventsDay: { title: string; date: string; type: string }[] = [];
events = [
  // Multiple events on June 12
  { title: 'Join Date', date: '2025-06-11', type: 'Holiday' },
  { title: '09:00AM - 05:00PM', date: '2025-06-12', type: 'Meeting' },
  { title: '09:00AM - 05:00PM', date: '2025-06-15', type: 'Meeting' },
  { title: '09:00AM - 05:00PM', date: '2025-06-16', type: 'Meeting' },
  { title: '09:00AM - 05:00PM', date: '2025-06-17', type: 'Meeting' },
];
  calendarOptions: CalendarOptions = {
  initialView: 'dayGridMonth',
  plugins: [dayGridPlugin, interactionPlugin],
  fixedWeekCount: false,
  selectable: true,
  events: this.events,
  dayMaxEvents: 3, 
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



  // popups
  deactivateOpen = false;
  activateOpen = false;
  openDeactivate() {
    this.deactivateOpen = true;
  }

  closeDeactivate() {
    this.deactivateOpen = false;
  }

  confirmDeactivate() {
    this.deactivateOpen = false;

    const deptStatus = {
      request_data: {
        status: false
      }
    };

  }
  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }
  confirmActivate() {
    this.activateOpen = false;
    const deptStatus = {
      request_data: {
        status: true
      }
    };

  }

}
