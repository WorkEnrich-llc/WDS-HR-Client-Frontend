import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ChartsService } from 'app/core/services/od/charts/charts.service';

@Component({
  selector: 'app-company-chart',
  imports: [CommonModule],
  templateUrl: './company-test-chart.component.html',
  styleUrl: './company-test-chart.component.css'
})
export class CompanyTestChartComponent implements OnInit, AfterViewInit {

  @ViewChild('chartBox') chartBox?: ElementRef;
  @ViewChild('orgChartFrame', { static: false }) orgChartFrame!: ElementRef<HTMLIFrameElement>;

  private chartsService = inject(ChartsService);
  chartData: any;
  chart: any;
  zoom = 1;
  isFullScreen = false;
  toggleState = true;

  ngOnInit(): void {
    this.chartsService.companyChart().subscribe({
      next: (res) => {
        // Correct path: res.data.list_items
        console.log(res.data?.list_items);
        if (res.data?.list_items && res.data.list_items.length > 0) {
          this.chartData = this.transformToChartFormat(res.data.list_items[0]);
          console.log('Transformed chartData:', this.chartData);
        } else {
          console.warn('No list_items found in response');
        }
        // If iframe already loaded, send immediately
        if (this.orgChartFrame?.nativeElement?.contentWindow && this.chartData) {
          this.sendDataToIframe();
        }
      },
      error: (err) => console.error('Error loading chart data:', err)
    });

  }

  ngAfterViewInit(): void {
    const iframe = this.orgChartFrame.nativeElement;
    // If iframe is already loaded
    if (iframe.contentWindow && iframe.contentDocument?.readyState === 'complete') {
      this.sendDataToIframe();
    } else {
      // Otherwise wait for load
      iframe.onload = () => {
        console.log('Iframe loaded. Ready to receive messages via postMessage');
        this.sendDataToIframe();
      };
    }
  }

  sendDataToIframe(): void {
    if (!this.chartData) {
      console.warn('Chart data not yet loaded from backend');
      return;
    }
    const iframe = this.orgChartFrame.nativeElement;
    if (iframe && iframe.contentWindow) {
      const message = {
        action: 'setData',
        payload: this.chartData,
        chartType: 'chartData'
      };
      iframe.contentWindow.postMessage(message, 'https://orgchart.talentdot.org');
      // optional retry
      setTimeout(() => {
        iframe.contentWindow?.postMessage(message, 'https://orgchart.talentdot.org');
      }, 500);
    }
  }


  private transformToChartFormat(item: any): any {

    const paddedId = item.id.toString().padStart(4, '0');

    const typeLabel = item.type
      ? item.type.charAt(0).toUpperCase() + item.type.slice(1)
      : '';

    const typeColors: Record<string, string> = {
      company: '#2E86C1',
      branch: '#28B463',
      department: '#AF7AC5',
      section: '#F39C12',
      job_title: '#E74C3C'
    };

    const nodeColor = typeColors[item.type] || '#7F8C8D';

    return {
      name: item.name,
      details: [
        `ID: ${paddedId}`,
        `Type: ${typeLabel}`
      ],
      color: nodeColor,

      expanded: item.expanded ?? false,
      firstNode: item.firstNode ?? false,
      children: item.children?.map((child: any) => this.transformToChartFormat(child)) || []
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
