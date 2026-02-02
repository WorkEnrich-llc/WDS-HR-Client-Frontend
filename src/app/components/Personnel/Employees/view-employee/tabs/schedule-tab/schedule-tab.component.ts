import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Employee } from '../../../../../../core/interfaces/employee';
import { WorkSchaualeService } from '../../../../../../core/services/attendance/work-schaduale/work-schauale.service';

@Component({
    selector: 'app-schedule-tab',
    standalone: true,
    imports: [CommonModule],
    providers: [DatePipe],
    templateUrl: './schedule-tab.component.html',
    styleUrls: ['./schedule-tab.component.css']
})
export class ScheduleTabComponent implements OnInit, OnChanges {
    @Input() employee: Employee | null = null;

    workScduleData: any = null;
    workingDays: string[] = [];
    isLoading = true;
    error: string | null = null;

    constructor(
        private workScheduleService: WorkSchaualeService,
        private datePipe: DatePipe
    ) { }

    ngOnInit(): void {
        this.loadSchedule();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['employee'] && !changes['employee'].firstChange) {
            this.loadSchedule();
        }
    }

    loadSchedule(): void {
        if (!this.employee?.job_info?.work_schedule?.id) {
            this.isLoading = false;
            return;
        }

        const scheduleId = this.employee.job_info.work_schedule.id;
        this.isLoading = true;
        this.error = null;

        const body = {
            request_data: {
                status: true
            }
        };

        this.workScheduleService.getWorkScheduleWithStatus(scheduleId, body).subscribe({
            next: (response) => {
                this.workScduleData = response.data.object_info;
                this.processScheduleData();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching work schedule:', err);
                this.error = 'Failed to load work schedule';
                this.isLoading = false;
            }
        });
    }

    processScheduleData(): void {
        if (!this.workScduleData?.system?.days) return;

        const days = this.workScduleData.system.days;
        const orderedDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

        this.workingDays = orderedDays
            .filter(day => days[day])
            .map(day => day.charAt(0).toUpperCase() + day.slice(1));
    }

    formatTime(time: string): string {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return this.datePipe.transform(date, 'h:mm a') || time;
    }
}
