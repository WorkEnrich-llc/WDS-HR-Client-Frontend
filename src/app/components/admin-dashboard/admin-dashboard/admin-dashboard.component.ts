import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';
import { AdminDashboardService } from 'app/core/services/admin-dashboard/admin-dashboard.service';
import { DepartmentsService } from 'app/core/services/od/departments/departments.service';
import { BranchesService } from 'app/core/services/od/branches/branches.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [PageHeaderComponent, BaseChartDirective, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminDashboardComponent {
  constructor(
    private adminDashboardService: AdminDashboardService,
    private _DepartmentsService: DepartmentsService,
    protected _BranchesService: BranchesService,
  ) { }


  months: { value: number, label: string }[] = [];

  years: { value: string, label: string }[] = [];

  public chartsData: {
    [key: string]: { labels: string[], values: number[], colors: string[] }
  } = {};

  ngOnInit(): void {
    // get monthes selects 
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

    // get last three years
    this.years = [
      { value: (currentYear).toString(), label: `This Year` },
      { value: (currentYear - 1).toString(), label: `Last Year` },
      { value: (currentYear - 2).toString(), label: (currentYear - 2).toString() }
    ];

    // defult selects values
    this.params.request_month = currentMonth;
    this.params.turnover_year = currentYear.toString();
    this.params.employees_year = currentYear.toString();

    // get departments and branchs
    this.getAllDepartment(this.currentPage);
    this.getAllBranchs(this.currentPage);

    // get dashboard data
    this.getDashboardData();
  }




  params: any = {
    request_month: '',
    turnover_year: '',
    employees_year: '',
    active_departments_branch_id: ''
  };

  onParamChangeEvent(key: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    // console.log("Changed:", key, value);
    this.params[key] = value;
    this.getDashboardData();
  }


  getDashboardData(): void {
    this.adminDashboardService.viewDashboard(this.params).subscribe({
      next: (response) => {
        const dashboardData = response.data.object_info;

        dashboardData.forEach((item: any) => {
          const valuesArray = Array.isArray(item.value) ? item.value : [];

          this.chartsData[item.title] = {
            labels: valuesArray.map((v: any) =>
              v?.label ?? v?.name ?? ''
            ),
            values: valuesArray.map((v: any) => v?.value ?? 0),
            colors: valuesArray.map((v: any) => v?.color_code ?? '#e5e7eb50')
          };
        });
        console.log("Charts Data:", this.chartsData);

        // -----------------------------
        // Active Employees
        // -----------------------------
        const activeEmployees = this.chartsData['Active Employees'];
        if (activeEmployees) {
          this.activeEmployeeLabels = activeEmployees.labels;
          this.activeEmployeeValues = activeEmployees.values;
          this.activeEmployeeColors = activeEmployees.colors;

          this.activeEmployeeData = {
            labels: this.activeEmployeeLabels,
            datasets: [
              {
                data: this.activeEmployeeValues.every(v => v === 0) ? [1] : this.activeEmployeeValues,
                backgroundColor: this.activeEmployeeValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.activeEmployeeColors
              }
            ]
          };
          if (this.activeEmployeeValues.every(v => v === 0)) {
            this.activeEmployeeOptions = this.getEmptyChartOptions();
          }
        }

        // -----------------------------
        // Requests
        // -----------------------------
        const requests = this.chartsData['Requests'];
        if (requests) {
          this.requestsLabels = requests.labels;
          this.requestsValues = requests.values;
          this.requestsColors = requests.colors;

          this.requestsData = {
            labels: this.requestsLabels,
            datasets: [
              {
                data: this.requestsValues.every(v => v === 0) ? [1] : this.requestsValues,
                backgroundColor: this.requestsValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.requestsColors
              }
            ]
          };
          if (this.requestsValues.every(v => v === 0)) {
            this.requestsOptions = this.getEmptyChartOptions();
          }
        }

        // -----------------------------
        // Goals
        // -----------------------------
        const goals = this.chartsData['Goals'];
        if (goals) {
          this.goalsLabels = goals.labels;
          this.goalsValues = goals.values;
          this.goalsColors = goals.colors;

          this.goalsData = {
            labels: this.goalsLabels,
            datasets: [
              {
                data: this.goalsValues.every(v => v === 0) ? [1] : this.goalsValues,
                backgroundColor: this.goalsValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.goalsColors
              }
            ]
          };
          if (this.goalsValues.every(v => v === 0)) {
            this.goalsOptions = this.getEmptyChartOptions();
          }
        }
        // -----------------------------
        // Department Guidelines
        // -----------------------------
        const deptGuidelines = this.chartsData['Department Guidelines'];
        if (deptGuidelines) {
          this.deptGuidelinesLabels = deptGuidelines.labels;
          this.deptGuidelinesValues = deptGuidelines.values;
          this.deptGuidelinesColors = deptGuidelines.colors;
          this.deptGuidelinesData = {
            labels: this.deptGuidelinesLabels,
            datasets: [
              {
                data: this.deptGuidelinesValues.every((v) => v === 0)
                  ? [1]
                  : this.deptGuidelinesValues,
                backgroundColor: this.deptGuidelinesValues.every((v) => v === 0)
                  ? ['#e5e7eb50']
                  : this.deptGuidelinesColors,
              },
            ],
          };
          if (this.deptGuidelinesValues.every(v => v === 0)) {
            this.deptGuidelinesOptions = this.getEmptyChartOptions();
          }
        }
        // ------------------
        // Active Departments
        // -------------------
        const activeDeps = this.chartsData['Active Departments'];
        if (activeDeps) {
          this.activeDepartmentsLabels = activeDeps.labels;
          this.activeDepartmentsValues = activeDeps.values;
          this.activeDepartmentsColors = activeDeps.colors;

          this.activeDepartmentsData = {
            labels: this.activeDepartmentsLabels,
            datasets: [
              {
                data: this.activeDepartmentsValues.every(v => v === 0)
                  ? [1]
                  : this.activeDepartmentsValues,
                backgroundColor: this.activeDepartmentsValues.every(v => v === 0)
                  ? ['#e5e7eb50']
                  : this.activeDepartmentsColors
              }
            ]
          };

          if (this.activeDepartmentsValues.every(v => v === 0)) {
            this.activeDepartmentsOptions = this.getEmptyChartOptions();
          }
        }



      },
      error: (error) => {
        console.error('Error fetching dashboard data:', error);
      }
    });
  }

  // empty chart
  getEmptyChartOptions(): ChartOptions<'doughnut'> {
    return {
      responsive: true,
      cutout: '50%',
      animation: {
        animateRotate: true,
        animateScale: true
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: () => '',
            title: () => 'No data'
          }
        }
      }
    };
  }



  departments: any[] = [];
  branches: any[] = [];
  selectAll: boolean = false;
  currentPage: number = 1;
  totalpages: number = 0;
  totalItems: number = 0;
  itemsPerPage: number = 10;
  getAllDepartment(pageNumber: number, searchTerm: string = '') {
    this._DepartmentsService.getAllDepartment(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {
        this.departments = response.data.list_items;
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
  getAllBranchs(pageNumber: number, searchTerm: string = '') {
    this._BranchesService.getAllBranches(pageNumber, 10000, {
      search: searchTerm || undefined,
    }).subscribe({
      next: (response) => {

        this.branches = response.data.list_items;
      },
      error: (err) => {
        console.log(err.error?.details);
      }
    });
  }
  // -----------------------------
  // Active Employees Chart
  // -----------------------------
  public activeEmployeeType: 'doughnut' = 'doughnut';

  public activeEmployeeLabels: string[] = [];
  public activeEmployeeValues: number[] = [];
  public activeEmployeeColors: string[] = [];

  public activeEmployeeData: any;
  public activeEmployeeOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };

  public get activeEmployeeTotal() {
    return this.activeEmployeeValues.reduce((a, b) => a + b, 0);
  }

  // -----------------------------
  // Leave Balance Chart
  // -----------------------------
  public leaveBalanceType: 'doughnut' = 'doughnut';

  public leaveBalanceLabels = [
    'Available',
    'Used',
    'Carryover'
  ];

  public leaveBalanceValues = [15, 8, 5];

  public leaveBalanceColors = [
    '#98DFC0', // Available
    '#FF8F8F', // Used
    '#F9B47D' // Carryover
  ];

  public leaveBalanceData = {
    labels: this.leaveBalanceLabels,
    datasets: [
      {
        data: this.leaveBalanceValues.every(v => v === 0)
          ? [1]
          : this.leaveBalanceValues,
        backgroundColor: this.leaveBalanceValues.every(v => v === 0)
          ? ['#e5e7eb50']
          : this.leaveBalanceColors
      }
    ]
  };

  public leaveBalanceOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };

  public get leaveBalanceTotal() {
    return this.leaveBalanceValues.reduce((a, b) => a + b, 0);
  }


  // -----------------------------
  // Requests Chart
  // -----------------------------
  public requestsType: 'doughnut' = 'doughnut';

  public requestsLabels: string[] = [];
  public requestsValues: number[] = [];
  public requestsColors: string[] = [];

  public requestsData: any;
  public requestsOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };

  public get requestsTotal() {
    return this.requestsValues.reduce((a, b) => a + b, 0);
  }

  // -----------------------------
  // Goals Chart
  // -----------------------------
  public goalsType: 'doughnut' = 'doughnut';

  public goalsLabels: string[] = [];
  public goalsValues: number[] = [];
  public goalsColors: string[] = [];

  public goalsData: any;
  public goalsOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };

  public get goalsTotal() {
    return this.goalsValues.reduce((a, b) => a + b, 0);
  }


  // -----------------------------
  // Alerts
  // -----------------------------
  alerts = [
    {
      number: 2,
      title: 'Probation Alert',
      content: 'The probation period for John Doe will end on 2025-09-30. Please review and take action.'
    },
    {
      number: 1,
      title: 'Leave Alert',
      content: 'Alice Smith has 2 days of leave pending approval. Please review.'
    },
    {
      title: 'Compliance Alert',
      content: 'The compliance training for Michael Brown is overdue. Please follow up.'
    },
    {
      number: 2,
      title: 'Contract Renewal',
      content: 'The contract for Sarah Johnson will expire on 2025-10-15. Action required.'
    },
    {
      number: 1,
      title: 'Probation Alert',
      content: 'The probation period for David Lee will end on 2025-10-01. Please review.'
    }
  ];

  // -----------------------------
  // Turnover Bar Chart
  // -----------------------------
  public turnoverLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  public turnoverValues = [120, 150, 100, 170, 190, 140, 130, 180, 200, 210, 160, 220];

  public turnoverData = {
    labels: this.turnoverLabels,
    datasets: [
      {
        label: 'Turnover',
        data: this.turnoverValues,
        backgroundColor: '#FF8F8F',
        borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false,
        barPercentage: 1.1,
        categoryPercentage: 0.6
      }
    ]
  };

  public turnoverOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: true
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: '#C2C2C2',
          drawTicks: true,
          lineWidth: 1
        },
        ticks: {
          color: '#2C435D',
          font: { size: 16 }
        }
      },
      y: {
        grid: {
          display: true,
          color: '#C2C2C2',
          drawTicks: true,
          lineWidth: 1
        },
        ticks: {
          color: '#2C435D',
          font: { size: 16 }
        }
      }
    }
  };



  public turnoverType: 'bar' = 'bar';

  // -----------------------------
  // Employees Chart
  // ----------------------------- 
  public employeeLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  public hiredValues = [20, 15, 25, 30, 22, 18, 24, 28, 30, 26, 23, 27];
  public terminatedValues = [15, 12, 10, 18, 14, 12, 16, 15, 14, 18, 15, 17];
  public resignedValues = [10, 8, 9, 12, 11, 9, 10, 12, 11, 10, 9, 13];


  public employeeData = {
    labels: this.employeeLabels,
    datasets: [
      {
        label: 'Hired',
        data: this.hiredValues,
        backgroundColor: '#98DFC0',
        borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false
      },
      {
        label: 'Terminated',
        data: this.terminatedValues,
        backgroundColor: '#B83D4A',
        borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false
      },
      {
        label: 'Resigned',
        data: this.resignedValues,
        backgroundColor: '#FF8F8F',
        borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
        borderSkipped: false
      }
    ]
  };

  public employeeOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },

    scales: {
      x: {
        grid: {
          display: true,
          color: '#C2C2C2',
          drawTicks: true,
          lineWidth: 1
        },
        ticks: {
          color: '#2C435D',
          font: { size: 16 }
        }
      },
      y: {
        grid: {
          display: true,
          color: '#C2C2C2',
          drawTicks: true,
          lineWidth: 1
        },
        ticks: {
          color: '#2C435D',
          font: { size: 16 },
        }
      }
    }
  };


  public employeeType: 'bar' = 'bar';

  // -----------------------------
  // Department Guidelines Chart
  // -----------------------------
  public deptGuidelinesType: 'doughnut' = 'doughnut';

  public deptGuidelinesLabels: string[] = [];
  public deptGuidelinesValues: number[] = [];
  public deptGuidelinesColors: string[] = [];

  public deptGuidelinesData: any;
  public deptGuidelinesOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: {
      animateRotate: true,
      animateScale: true
    },
    plugins: {
      legend: { display: false }
    }
  };


  // -----------------------------
  // Active Departments Chart
  // -----------------------------
  public activeDepartmentsType: 'doughnut' = 'doughnut';
  public activeDepartmentsLabels: string[] = [];
  public activeDepartmentsValues: number[] = [];
  public activeDepartmentsColors: string[] = [];
  public activeDepartmentsData: any;
  public activeDepartmentsOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '50%',
    animation: { animateRotate: true, animateScale: true },
    plugins: { legend: { display: false } }
  };
  public get activeDepartmentsTotal() {
    return this.activeDepartmentsValues.reduce((a, b) => a + b, 0);
  }


}
