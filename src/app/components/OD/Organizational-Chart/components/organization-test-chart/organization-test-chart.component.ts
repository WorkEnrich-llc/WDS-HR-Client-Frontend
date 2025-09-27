import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ChartsService } from 'app/core/services/od/charts/charts.service';

@Component({
  selector: 'app-organization-chart',
  imports: [CommonModule],
  templateUrl: './organization-test-chart.component.html',
  styleUrl: './organization-test-chart.component.css'
})
export class OrganizationTestChartComponent implements OnInit, AfterViewInit {

  @ViewChild('chartBox') chartBox?: ElementRef;
  @ViewChild('orgChart', { static: false }) orgChart!: ElementRef<HTMLIFrameElement>;


  private chartsService = inject(ChartsService);
  chartData: any;
  chart: any;
  zoom = 1;
  isFullScreen = false;
  toggleState = true;

  ngOnInit(): void {
    this.chartsService.jobsChart().subscribe({
      next: (res) => {
        if (res.data?.list_items && res.data.list_items.length > 0) {
          this.chartData = this.transformJobsChartFormat(res.data.list_items[0]);
          console.log('Transformed jobs chartData:', this.chartData);
        } else {
          console.warn('No list_items found in jobsChart response');
        }
        if (this.orgChart?.nativeElement?.contentWindow && this.chartData) {
          this.sendDataToIframe();
        }
      },
      error: (err) => console.error('Error loading jobs chart:', err)
    });

  }
  ngAfterViewInit(): void {
    const iframe = this.orgChart.nativeElement;
    if (iframe.contentWindow && iframe.contentDocument?.readyState === 'complete') {
      this.sendDataToIframe();
    } else {
      iframe.onload = () => {
        console.log('Iframe loaded (jobs chart). Ready to send data.');
        this.sendDataToIframe();
      };
    }
  }

  sendDataToIframe(): void {
    if (!this.chartData) {
      console.warn('Jobs chart data not yet loaded from backend');
      return;
    }

    const iframe = this.orgChart.nativeElement;
    const message = {
      action: 'setData',
      payload: this.chartData,
      chartType: 'jobsChart'
    };
    iframe.contentWindow?.postMessage(message, 'https://orgchart.talentdot.org');
  }


  private transformJobsChartFormat(item: any): any {
    return {
      name: item.name,
      position: item.position,
      jobTitleCode: item.job_title_code,
      level: item.level,
      expanded: item.expanded ?? false,
      firstNode: item.firstNode ?? false,
      children: item.children?.map((child: any) => this.transformJobsChartFormat(child)) || []
    };
  }


  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
    const bodyElement = document.querySelector('.body');
    const sidenav = document.querySelector('.sidenav');
    const htmlElement = document.documentElement;
    const btnFixed = document.querySelector('.btn-fixed') as HTMLElement;
    if (bodyElement) {
      if (this.isFullScreen) {
        bodyElement.classList.add('body-full');
        if (sidenav) {
          sidenav.classList.add('sidenav-hidden');
        }
        htmlElement.style.setProperty('zoom', '1', 'important');
        if (btnFixed) {
          btnFixed.style.setProperty('zoom', '0.85', 'important');
        }
      } else {
        bodyElement.classList.remove('body-full');
        if (sidenav) {
          sidenav.classList.remove('sidenav-hidden');
        }
        htmlElement.style.removeProperty('zoom');
        if (btnFixed) {
          btnFixed.style.removeProperty('zoom');
        }
      }
    }
  }


}
