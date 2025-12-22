import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { Chart, ChartConfiguration, ChartType, ChartData, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-charts-demo',
  standalone: true,
  imports: [],
  templateUrl: './charts-demo.component.html',
  styleUrls: ['./charts-demo.component.css']
})
export class ChartsDemoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChart', { static: false }) lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart', { static: false }) pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart', { static: false }) doughnutChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('polarChart', { static: false }) polarChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('radarChart', { static: false }) radarChartRef!: ElementRef<HTMLCanvasElement>;

  private lineChart!: Chart;
  private barChart!: Chart;
  private pieChart!: Chart;
  private doughnutChart!: Chart;
  private polarChart!: Chart;
  private radarChart!: Chart;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.createLineChart();
    this.createBarChart();
    this.createPieChart();
    this.createDoughnutChart();
    this.createPolarChart();
    this.createRadarChart();
  }

  private createLineChart(): void {
    const ctx = this.lineChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [
            {
              label: 'Sales 2023',
              data: [65, 59, 80, 81, 56, 55, 40],
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            },
            {
              label: 'Sales 2024',
              data: [28, 48, 40, 19, 86, 27, 90],
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Monthly Sales Comparison'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private createBarChart(): void {
    const ctx = this.barChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.barChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: 'Revenue (in thousands)',
              data: [120, 190, 300, 500],
              backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 205, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 205, 86, 1)',
                'rgba(75, 192, 192, 1)'
              ],
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Quarterly Revenue'
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }

  private createPieChart(): void {
    const ctx = this.pieChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
          datasets: [{
            label: 'Colors',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Color Distribution'
            }
          }
        }
      });
    }
  }

  private createDoughnutChart(): void {
    const ctx = this.doughnutChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.doughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Desktop', 'Mobile', 'Tablet'],
          datasets: [{
            label: 'Device Usage',
            data: [60, 30, 10],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Device Usage Statistics'
            }
          }
        }
      });
    }
  }

  private createPolarChart(): void {
    const ctx = this.polarChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.polarChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
          labels: ['Red', 'Green', 'Yellow', 'Grey', 'Blue'],
          datasets: [{
            label: 'Polar Data',
            data: [11, 16, 7, 3, 14],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(201, 203, 207, 0.8)',
              'rgba(54, 162, 235, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Polar Area Chart'
            }
          }
        }
      });
    }
  }

  private createRadarChart(): void {
    const ctx = this.radarChartRef.nativeElement.getContext('2d');
    if (ctx) {
      this.radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency'],
          datasets: [
            {
              label: 'Product A',
              data: [80, 90, 70, 85, 75],
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              pointBackgroundColor: 'rgba(255, 99, 132, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
            },
            {
              label: 'Product B',
              data: [70, 85, 90, 75, 80],
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              pointBackgroundColor: 'rgba(54, 162, 235, 1)',
              pointBorderColor: '#fff',
              pointHoverBackgroundColor: '#fff',
              pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Product Comparison Radar'
            }
          },
          elements: {
            line: {
              borderWidth: 3
            }
          }
        }
      });
    }
  }

  // Method to update charts with random data
  updateCharts(): void {
    // Update line chart
    this.lineChart.data.datasets[0].data = this.generateRandomData(7, 100);
    this.lineChart.data.datasets[1].data = this.generateRandomData(7, 100);
    this.lineChart.update();

    // Update bar chart
    this.barChart.data.datasets[0].data = this.generateRandomData(4, 600);
    this.barChart.update();

    // Update pie chart
    this.pieChart.data.datasets[0].data = this.generateRandomData(6, 25);
    this.pieChart.update();

    // Update doughnut chart
    this.doughnutChart.data.datasets[0].data = this.generateRandomData(3, 100);
    this.doughnutChart.update();

    // Update polar chart
    this.polarChart.data.datasets[0].data = this.generateRandomData(5, 20);
    this.polarChart.update();

    // Update radar chart
    this.radarChart.data.datasets[0].data = this.generateRandomData(5, 100);
    this.radarChart.data.datasets[1].data = this.generateRandomData(5, 100);
    this.radarChart.update();
  }

  private generateRandomData(length: number, max: number): number[] {
    return Array.from({ length }, () => Math.floor(Math.random() * max));
  }

  ngOnDestroy(): void {
    // Clean up charts to prevent memory leaks
    if (this.lineChart) this.lineChart.destroy();
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.doughnutChart) this.doughnutChart.destroy();
    if (this.polarChart) this.polarChart.destroy();
    if (this.radarChart) this.radarChart.destroy();
  }
}
