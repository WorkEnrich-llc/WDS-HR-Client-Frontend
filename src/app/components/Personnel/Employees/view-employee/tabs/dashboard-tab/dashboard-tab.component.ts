import { Component, Input, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EmployeeService } from '../../../../../../core/services/personnel/employees/employee.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { LeaveBalanceService } from '../../../../../../core/services/attendance/leave-balance/leave-balance.service';
import { ChartsService } from '../../../../../../core/services/od/charts/charts.service';

@Component({
    selector: 'app-dashboard-tab',
    standalone: true,
    imports: [CommonModule, BaseChartDirective],
    templateUrl: './dashboard-tab.component.html',
    styleUrl: './dashboard-tab.component.css'
})
export class DashboardTabComponent implements OnInit {
    @Input() employeeId!: number;
    private employeeService = inject(EmployeeService);
    private leaveBalanceService = inject(LeaveBalanceService);
    private chartsService = inject(ChartsService);
    private router = inject(Router);

    isLoading = true;
    dashboardData: any[] = [];
    companyStructure: any[] = [];
    isOrgChartModalOpen = false;
    isLoadingOrgChart = true;
    readonly defaultImage: string = './images/profile-defult.jpg';
    months: { value: number, label: string }[] = [];
    years: { value: string, label: string }[] = [];
    leaveTypes: any[] = [];

    params: any = {
        request_month: new Date().getMonth() + 1,
        attendance_year: new Date().getFullYear().toString(),
        leave_balance_leave_id: ''
    };

    onParamChangeEvent(key: string, event: Event): void {
        const value = (event.target as HTMLSelectElement).value;
        this.params[key] = value;
        this.loadDashboardData();
    }

    // Requests Chart
    public requestsData: ChartData<'doughnut'> = {
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }]
    };
    public requestsOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        cutout: '70%',
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
        }
    };

    // Leave Balance Chart
    public leaveBalanceData: ChartData<'doughnut'> = {
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }]
    };
    public leaveBalanceOptions: ChartConfiguration<'doughnut'>['options'] = {
        responsive: true,
        cutout: '70%',
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
        }
    };

    // Attendance Chart (Dummy Data)
    public attendanceData: ChartData<'bar'> = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                data: [85, 70, 90, 95, 75, 40, 60, 80, 90, 80, 98, 80],
                backgroundColor: '#FF8F8F',
                borderRadius: 8,
                maxBarThickness: 40
            }
        ]
    };
    public attendanceOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: (value) => value + '%'
                }
            }
        },
        plugins: {
            legend: { display: false }
        }
    };

    ngOnInit(): void {
        this.initializeFilters();
        if (this.employeeId) {
            this.loadDashboardData();
        }
        this.loadCompanyStructure();
    }

    loadCompanyStructure(): void {
        this.isLoadingOrgChart = true;
        this.chartsService.jobsChart().subscribe({
            next: (res) => {
                this.companyStructure = res.data.list_items || [];
                this.isLoadingOrgChart = false;
            },
            error: (err) => {
                console.error('Error loading company structure:', err);
                this.isLoadingOrgChart = false;
            }
        });
    }

    openOrgChartModal(): void {
        this.isOrgChartModalOpen = true;
    }

    closeOrgChartModal(): void {
        this.isOrgChartModalOpen = false;
    }

    initializeFilters(): void {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        this.months = [];
        this.months.push({ value: currentMonth, label: "This Month" });
        if (currentMonth > 1) {
            this.months.push({ value: currentMonth - 1, label: "Last Month" });
        }
        for (let m = currentMonth - 2; m >= 1; m--) {
            this.months.push({ value: m, label: monthNames[m - 1] });
        }

        this.years = [
            { value: (currentYear).toString(), label: `This Year` },
            { value: (currentYear - 1).toString(), label: `Last Year` },
            { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() }
        ];

        this.params.request_month = currentMonth;
        this.params.attendance_year = currentYear.toString();

        this.loadLeaveTypes();
    }

    loadLeaveTypes(): void {
        this.leaveBalanceService.getAllLeaveBalance({
            page: 1,
            per_page: 1000
        }).subscribe({
            next: (response) => {
                this.leaveTypes = response.data.list_items;
            },
            error: (err) => {
                console.error('Error loading leave types:', err);
            }
        });
    }

    loadDashboardData(): void {
        this.isLoading = true;
        this.employeeService.getEmployeeDashboard(this.employeeId, this.params).subscribe({
            next: (response) => {
                this.dashboardData = response.data.object_info;
                this.processCharts();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading dashboard data:', err);
                this.isLoading = false;
            }
        });
    }

    processCharts(): void {
        // Process Requests
        const requestsSection = this.dashboardData.find(item => item.title === 'Requests');
        if (requestsSection) {
            this.requestsData = {
                labels: requestsSection.value.map((v: any) => v.label),
                datasets: [{
                    data: requestsSection.value.map((v: any) => v.value),
                    backgroundColor: requestsSection.value.map((v: any) => v.color_code)
                }]
            };
        }

        // Process Leave Balance
        const leaveBalanceSection = this.dashboardData.find(item => item.title === 'Leave Balance');
        if (leaveBalanceSection) {
            // Filter out non-chart values if any (like counts)
            const chartValues = leaveBalanceSection.value.filter((v: any) => v.label);
            this.leaveBalanceData = {
                labels: chartValues.map((v: any) => v.label),
                datasets: [{
                    data: chartValues.map((v: any) => v.value),
                    backgroundColor: chartValues.map((v: any) => v.color_code)
                }]
            };
        }
    }

    getSectionTotal(title: string): number {
        const section = this.dashboardData.find(item => item.title === title);
        if (!section) return 0;
        return section.value
            .filter((v: any) => v.label)
            .reduce((acc: number, curr: any) => acc + curr.value, 0);
    }

    getSectionValues(title: string): any[] {
        const section = this.dashboardData.find(item => item.title === title);
        return section ? section.value.filter((v: any) => v.label) : [];
    }

    getEmployeeHierarchy(): any[] {
        const employees: any[] = [];

        const processNode = (node: any, level: number) => {
            employees.push({
                code: node.job_title_code,
                name: node.name,
                position: node.position,
                level: level,
                avatar: null,
                highlighted: employees.length === 2 // Highlight the 3rd item
            });

            // Recursively process children
            if (node.children && node.children.length > 0) {
                node.children.forEach((child: any) => processNode(child, level + 1));
            }
        };

        // Process job titles structure
        this.companyStructure.forEach(root => {
            processNode(root, 0);
        });

        // Return only first 5 employees like in the image
        return employees.slice(0, 5);
    }

    navigateToOrgChart(): void {
        this.router.navigate(['/organizational-Chart/chart/company-chart']);
    }
}
