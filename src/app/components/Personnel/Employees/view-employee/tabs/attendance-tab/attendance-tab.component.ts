import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';
import { TableComponent } from '../../../../../shared/table/table.component';

interface AttendanceRecord {
  in: string;
  out: string;
  date: string;
  dayType: string;
  workingHrs: string;
  missingHrs: string;
  deduction: string;
}

@Component({
    selector: 'app-attendance-tab',
    imports: [CommonModule, TableComponent],
    templateUrl: './attendance-tab.component.html',
    styleUrl: './attendance-tab.component.css'
})
export class AttendanceTabComponent {
    @Input() employee: Employee | null = null;
    @Input() isEmployeeActive: boolean = false;

    attendanceData: AttendanceRecord[] = [
      {
        in: '09:00 am',
        out: '05:00 pm',
        date: '20/05/2025',
        dayType: 'Working Day',
        workingHrs: '8 Hrs',
        missingHrs: '8 hrs',
        deduction: '-'
      },
      {
        in: '09:00 am',
        out: '05:00 pm',
        date: '04:00 pm',
        dayType: 'Working Day',
        workingHrs: '8 Hrs',
        missingHrs: '7 Hr',
        deduction: '1 Hr'
      },
      {
        in: '09:00 am',
        out: '-',
        date: '-',
        dayType: 'Working Day',
        workingHrs: '8 Hrs',
        missingHrs: '-',
        deduction: 'Absent'
      },
      {
        in: '09:00 am',
        out: '1:00 pm',
        date: '04:00 pm',
        dayType: 'Working Day',
        workingHrs: '8 Hrs',
        missingHrs: '1 Hr',
        deduction: '3 Hrs'
      },
      {
        in: '09:00 am',
        out: '05:00 pm',
        date: '20/05/2025',
        dayType: 'Working Day',
        workingHrs: 'Holiday',
        missingHrs: '1 Hr',
        deduction: '-'
      },
      {
        in: '09:00 am',
        out: '05:00 pm',
        date: '20/05/2025',
        dayType: 'Working Day',
        workingHrs: '8 Hrs',
        missingHrs: '1 Hr',
        deduction: '-'
      },
      {
        in: '09:00 am',
        out: '05:00 pm',
        date: '20/05/2025',
        dayType: 'Working Day',
        workingHrs: '8 Hrs',
        missingHrs: '1 Hr',
        deduction: '-'
      },
      {
        in: '09:00 am',
        out: '05:00 pm',
        date: '20/05/2025',
        dayType: 'Working Day',
        workingHrs: '8 Hrs',
        missingHrs: '1 Hr',
        deduction: '-'
      },
      {
        in: '09:00 am',
        out: '05:00 pm',
        date: '20/05/2025',
        dayType: 'Working Day',
        workingHrs: '8 Hrs',
        missingHrs: '1 Hr',
        deduction: '-'
      },
      {
        in: '09:00 am',
        out: '05:00 pm',
        date: '20/05/2025',
        dayType: 'Working Day',
        workingHrs: '8 Hrs',
        missingHrs: '1 Hr',
        deduction: '-'
      }
    ];
}
