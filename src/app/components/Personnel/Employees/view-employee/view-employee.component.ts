import { Component, inject, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PopupComponent } from '../../../shared/popup/popup.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EmployeeService } from '../../../../core/services/personnel/employees/employee.service';
import { Employee, Subscription } from '../../../../core/interfaces/employee';



@Component({
  selector: 'app-view-employee',
  imports: [PageHeaderComponent, CommonModule,RouterLink,PopupComponent,FullCalendarModule],
  templateUrl: './view-employee.component.html',
  styleUrl: './view-employee.component.css'
})
export class ViewEmployeeComponent implements OnInit {
  private employeeService = inject(EmployeeService);
  private route = inject(ActivatedRoute);
  
  employee: Employee | null = null;
  subscription: Subscription | null = null;
  loading = false;
  employeeId: number = 0;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.employeeId = +params['id'];
      if (this.employeeId) {
        this.loadEmployeeData();
      }
    });
  }

  loadEmployeeData(): void {
    this.loading = true;
    this.employeeService.getEmployeeById(this.employeeId).subscribe({
      next: (response) => {
        this.employee = response.data.object_info;
        this.subscription = response.data.subscription;
        this.loading = false;
        console.log('Employee data loaded:', response);
      },
      error: (error) => {
        console.error('Error loading employee:', error);
        this.loading = false;
      }
    });
  }

  // Legacy property for backward compatibility with template
  get employeeData() {
    if (!this.employee) {
      return {
        id: 0,
        name: "",
        employeeStatus: "",
        accountStatus: "inactive" as 'active' | 'inactive',
        jobTitle: "",
        branch: "",
        joinDate: ""
      };
    }

    return {
      id: this.employee.id,
      name: this.employee.contact_info.name,
      employeeStatus: this.getEmployeeStatus(this.employee),
      accountStatus: this.employee.employee_active ? 'active' as const : 'inactive' as const,
      jobTitle: this.employee.job_info.job_title.name,
      branch: this.employee.job_info.branch.name,
      joinDate: this.employee.job_info.start_contract
    };
  }

  // Determine employee status based on contract dates and status
  private getEmployeeStatus(employee: Employee): string {
    const today = new Date();
    const startDate = new Date(employee.job_info.start_contract);
    const daysDiff = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

    if (daysDiff < 0) {
      return 'New Joiner'; // Contract hasn't started yet
    } else if (daysDiff <= 90) {
      return 'New Employee'; // Within first 90 days
    } else {
      return 'Employed'; // More than 90 days
    }
  }

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
    
    if (this.employee) {
      this.employeeService.updateEmployeeStatus(this.employee.id, false).subscribe({
        next: (response) => {
          console.log('Employee deactivated successfully:', response);
          // Update local employee status
          if (this.employee) {
            this.employee.employee_active = false;
          }
        },
        error: (error) => {
          console.error('Error deactivating employee:', error);
        }
      });
    }
  }
  openActivate() {
    this.activateOpen = true;
  }

  closeActivate() {
    this.activateOpen = false;
  }
  confirmActivate() {
    this.activateOpen = false;
    
    if (this.employee) {
      this.employeeService.updateEmployeeStatus(this.employee.id, true).subscribe({
        next: (response) => {
          console.log('Employee activated successfully:', response);
          // Update local employee status
          if (this.employee) {
            this.employee.employee_active = true;
          }
        },
        error: (error) => {
          console.error('Error activating employee:', error);
        }
      });
    }
  }

  // Helper method to check subscription permissions
  hasEmployeePermission(action: string): boolean {
    if (!this.subscription) return false;
    
    const personnelFeature = this.subscription.features.find(f => f.main.name === 'Personnel');
    if (!personnelFeature || !personnelFeature.is_support) return false;
    
    const employeeSub = personnelFeature.sub_list.find(s => s.sub.name === 'Employees');
    if (!employeeSub || !employeeSub.is_support) return false;
    
    const allowedAction = employeeSub.allowed_actions.find(a => a.name === action);
    return allowedAction ? allowedAction.status : false;
  }

  // Helper method to get remaining action count
  getEmployeeActionCount(action: string): number {
    if (!this.subscription) return 0;
    
    const personnelFeature = this.subscription.features.find(f => f.main.name === 'Personnel');
    if (!personnelFeature) return 0;
    
    const employeeSub = personnelFeature.sub_list.find(s => s.sub.name === 'Employees');
    if (!employeeSub) return 0;
    
    const allowedAction = employeeSub.allowed_actions.find(a => a.name === action);
    return allowedAction ? allowedAction.count : 0;
  }

  // Helper method to check if action has infinite usage
  hasInfiniteEmployeePermission(action: string): boolean {
    if (!this.subscription) return false;
    
    const personnelFeature = this.subscription.features.find(f => f.main.name === 'Personnel');
    if (!personnelFeature) return false;
    
    const employeeSub = personnelFeature.sub_list.find(s => s.sub.name === 'Employees');
    if (!employeeSub) return false;
    
    const allowedAction = employeeSub.allowed_actions.find(a => a.name === action);
    return allowedAction ? allowedAction.infinity : false;
  }
}
