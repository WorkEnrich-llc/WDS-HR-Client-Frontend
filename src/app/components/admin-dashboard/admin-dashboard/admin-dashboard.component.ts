import { Component, ViewEncapsulation } from '@angular/core';
import { PageHeaderComponent } from 'app/components/shared/page-header/page-header.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartOptions, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  imports: [PageHeaderComponent, BaseChartDirective, CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminDashboardComponent {

  // -----------------------------
  // Active Employees Chart
  // -----------------------------
  public activeEmployeeType: 'doughnut' = 'doughnut';

  public activeEmployeeLabels = [
    'On Probation',
    '>1 Year',
    '1-3 Years',
    '3+ Years'
  ];

  public activeEmployeeValues = [27, 12, 5, 17];

  public activeEmployeeColors = [
    '#DDE3EB', // On Probation
    '#93A7C1', // >1 Year
    '#4A6D97', // 1-3 Years
    '#2C435D' // 3+ Years
  ];

  public activeEmployeeData = {
    labels: this.activeEmployeeLabels,
    datasets: [
      {
        data: this.activeEmployeeValues.every(v => v === 0)
          ? [1]
          : this.activeEmployeeValues,
        backgroundColor: this.activeEmployeeValues.every(v => v === 0)
          ? ['#e5e7eb50']
          : this.activeEmployeeColors
      }
    ]
  };

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

  public requestsLabels = [
    'Rejected',
    'Expired',
    'Pending',
    'Approved'
  ];

  public requestsValues = [5, 3, 12, 20];

  public requestsColors = [
    '#FF8F8F',  // Rejected
    '#B83D4A',  // Expired
    '#F9B47D',  // Pending
    '#98DFC0'   // Approved
  ];

  public requestsData = {
    labels: this.requestsLabels,
    datasets: [
      {
        data: this.requestsValues.every(v => v === 0)
          ? [1]
          : this.requestsValues,
        backgroundColor: this.requestsValues.every(v => v === 0)
          ? ['#e5e7eb50']
          : this.requestsColors
      }
    ]
  };

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

  public goalsLabels = [
    'Active',
    'Inactive'
  ];

  public goalsValues = [18, 7];

  public goalsColors = [
    '#98DFC0',  // Active
    '#FF8F8F'   // Inactive
  ];

  public goalsData = {
    labels: this.goalsLabels,
    datasets: [
      {
        data: this.goalsValues.every(v => v === 0)
          ? [1]
          : this.goalsValues,
        backgroundColor: this.goalsValues.every(v => v === 0)
          ? ['#e5e7eb50']
          : this.goalsColors
      }
    ]
  };

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
      tooltip: {
        mode: 'nearest',
        intersect: true,
        callbacks: {
          label: function (context) {
            return context.dataset.label + ': ' + context.raw;
          }
        }
      }
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
  // Department Guidelines 
  // -----------------------------
  public deptGuidelinesType: 'doughnut' = 'doughnut';

  public deptGuidelinesLabels = [
    '100% Done',
    '>80% Done',
    '50-80% Done',
    '30-50% Done',
    '<30% Done'
  ];

  public deptGuidelinesValues = [5, 8, 10, 4, 2];

  public deptGuidelinesColors = [
    '#3F9870',   // 100% Done
    '#98DFC0',   // >80% Done
    '#F9B47D',   // 50-80% Done
    '#FF8F8F',   // 30-50% Done
    '#B83D4A'    // <30% Done
  ];

  public deptGuidelinesData = {
    labels: this.deptGuidelinesLabels,
    datasets: [
      {
        data: this.deptGuidelinesValues.every(v => v === 0)
          ? [1]
          : this.deptGuidelinesValues,
        backgroundColor: this.deptGuidelinesValues.every(v => v === 0)
          ? ['#e5e7eb50']
          : this.deptGuidelinesColors
      }
    ]
  };

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

  public activeDepartmentsLabels = [
    'Technical',
    'Support'
  ];

  public activeDepartmentsValues = [12, 8];

  public activeDepartmentsColors = [
    '#DDE3EB', // Technical
    '#93A7C1'  // Support
  ];

  public activeDepartmentsData = {
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

  public activeDepartmentsOptions: ChartOptions<'doughnut'> = {
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

  public get activeDepartmentsTotal() {
    return this.activeDepartmentsValues.reduce((a, b) => a + b, 0);
  }


}
