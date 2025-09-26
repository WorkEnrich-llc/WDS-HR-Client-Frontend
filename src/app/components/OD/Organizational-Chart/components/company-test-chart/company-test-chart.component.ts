import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-company-chart',
  imports: [CommonModule],
  templateUrl: './company-test-chart.component.html',
  styleUrl: './company-test-chart.component.css'
})
export class CompanyTestChartComponent implements AfterViewInit {
  // @ViewChild('iframeRef', { static: false }) iframeRef!: ElementRef;
  @ViewChild('chartBox') chartBox?: ElementRef;
  @ViewChild('orgChartFrame', { static: false }) orgChartFrame!: ElementRef<HTMLIFrameElement>;
  private iframeReady = false;


  chart: any;
  zoom = 1;
  isFullScreen = false;
  toggleState = true;

  // orgChartData = [
  //   {
  //     id: 1,
  //     name: "Talent",
  //     number_employees: "1 - 50",
  //     firstNode: true,
  //     type: "company",
  //     expanded: false,
  //     children: [
  //       {
  //         id: 2,
  //         name: "Cairo",
  //         code: "T-OD-B-@-1",
  //         location: "Cairo",
  //         max_employee: 12,
  //         type: "branch",
  //         expanded: false,
  //         children: [
  //           {
  //             id: 3,
  //             name: "IT",
  //             code: "T-OD-D-@-2",
  //             type: "department",
  //             expanded: false,
  //             children: [
  //               {
  //                 id: 4,
  //                 name: "Mobile",
  //                 code: "1",
  //                 type: "section",
  //                 expanded: false,
  //                 children: [
  //                   {
  //                     id: 5,
  //                     name: "Mobile Engineer",
  //                     code: "T-OD-JT-@-1",
  //                     type: "job_title",
  //                     level: "Non-Managerial",
  //                     expanded: false,
  //                     children: []
  //                   }
  //                 ]
  //               }
  //             ]
  //           }
  //         ]
  //       }
  //     ]
  //   }
  // ];

  // companyChartData = [
  //   {
  //     id: 1,
  //     name: "Talent",
  //     number_employees: "1 - 50",
  //     firstNode: true,
  //     type: "company",
  //     expanded: false,
  //     children: [
  //       {
  //         id: 2,
  //         name: "Department A",
  //         type: "department",
  //         code: "DEP-001",
  //         expanded: false,
  //         children: []
  //       },
  //       {
  //         id: 3,
  //         name: "Department B",
  //         type: "department",
  //         code: "DEP-002",
  //         expanded: false,
  //         children: []
  //       }
  //     ]
  //   }
  // ];

  chartData = {
    name: 'Aya Emad',
    position: 'CEO',
    jobTitleCode: 101,
    level: 'Executive',
    expanded: true,
    firstNode: true,
    children: [
      {
        name: 'Laila Mohamed',
        position: 'CFO',
        jobTitleCode: 102,
        level: 'Senior Management',
        expanded: true,
        children: [
          { name: 'Mostafa Khaled', position: 'Accountant', jobTitleCode: 201, level: 'Staff', expanded: false, children: [] },
          { name: 'Sara Nabil', position: 'Financial Analyst', jobTitleCode: 202, level: 'Staff', expanded: false, children: [] }
        ]
      },
    ]
  };



  ngAfterViewInit(): void {
    const iframe = this.orgChartFrame.nativeElement;

    iframe.onload = () => {
      console.log('Iframe loaded. Ready to receive messages via postMessage');
      this.waitForOrgChartAPI(iframe);
    };
  }

  private waitForOrgChartAPI(iframe: HTMLIFrameElement): void {
    const checkInterval = setInterval(() => {
      const chartApi = (iframe.contentWindow as any)?.OrgChartAPI;
      if (chartApi && typeof chartApi.setData === 'function') {
        clearInterval(checkInterval);
        console.log('🚀 OrgChartAPI is ready!');
        chartApi.setData(this.chartData);
      }
    }, 500);
  }

  sendDataToIframe(): void {
    const iframe = this.orgChartFrame.nativeElement;

    if (iframe && iframe.contentWindow) {
      try {
        // Access the exposed OrgChartAPI inside the iframe
        const chartApi = (iframe.contentWindow as any).OrgChartAPI;

        if (chartApi && typeof chartApi.setData === 'function') {
          console.log('📤 Sending data via OrgChartAPI.setData:', this.chartData);
          chartApi.setData(this.chartData);
        } else {
          console.warn('⚠️ OrgChartAPI is not ready yet.');
        }
      } catch (err) {
        console.error('❌ Error while sending data to iframe:', err);
      }
    }
  }


  // sendDataToIframe(): void {
  //   const iframe = this.orgChartFrame.nativeElement;
  //   if (iframe && iframe.contentWindow) {
  //     const message = {
  //       action: 'SET_DATA',
  //       data: this.chartData
  //     };
  //     console.log('📤 Sending data to iframe:', message);
  //     iframe.contentWindow.postMessage(
  //       message,
  //       'https://orgchart.talentdot.org'
  //     );
  //   }
  // }



  // sendDataToIframe(): void {
  //   const iframe = this.orgChartFrame.nativeElement;
  //   if (iframe && iframe.contentWindow) {
  //     iframe.contentWindow.postMessage(
  //       {
  //         action: 'SET_DATA',
  //         data: this.chartData
  //       },
  //       'https://orgchart.talentdot.org'
  //     );
  //     console.log('📤 Data sent via postMessage');
  //   }
  // }







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
