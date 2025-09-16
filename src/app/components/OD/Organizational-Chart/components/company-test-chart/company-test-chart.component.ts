import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ChartsService } from 'app/core/services/od/charts/charts.service';
// declare var OrgChart: any;

@Component({
  selector: 'app-company-chart',
  imports: [CommonModule],
  templateUrl: './company-test-chart.component.html',
  styleUrl: './company-test-chart.component.css'
})
export class CompanyTestChartComponent implements OnInit, AfterViewInit {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  @ViewChild('chartBox') chartBox?: ElementRef;
  @ViewChild('iframeRef', { static: false }) iframeRef!: ElementRef;

  constructor(private chartsService: ChartsService, private cd: ChangeDetectorRef) { }
  companyData: any = {};



  // orgChartData = {
  //   name: 'Aya Emad',
  //   position: 'CEO',
  //   jobTitleCode: 101,
  //   level: 'Executive',
  //   expanded: true,
  //   firstNode: true,
  //   children: [
  //     {
  //       name: 'Laila Mohamed',
  //       position: 'CFO',
  //       jobTitleCode: 102,
  //       level: 'Senior Management',
  //       expanded: true,
  //       children: [
  //         { name: 'Mostafa Khaled', position: 'Accountant', jobTitleCode: 201, level: 'Staff', expanded: false, children: [] },
  //         { name: 'Sara Nabil', position: 'Financial Analyst', jobTitleCode: 202, level: 'Staff', expanded: false, children: [] }
  //       ]
  //     }
  //   ]
  // };






  orgChartData = [
    {
      id: 1,
      name: "Talent",
      number_employees: "1 - 50",
      firstNode: true,
      type: "company",
      expanded: false,
      children: [
        {
          id: 2,
          name: "Cairo",
          code: "T-OD-B-@-1",
          location: "Cairo",
          max_employee: 12,
          type: "branch",
          expanded: false,
          children: [
            {
              id: 3,
              name: "IT",
              code: "T-OD-D-@-2",
              type: "department",
              expanded: false,
              children: [
                {
                  id: 4,
                  name: "Mobile",
                  code: "1",
                  type: "section",
                  expanded: false,
                  children: [
                    {
                      id: 5,
                      name: "Mobile Engineer",
                      code: "T-OD-JT-@-1",
                      type: "job_title",
                      level: "Non-Managerial",
                      expanded: false,
                      children: []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ];

  ngOnInit(): void {

    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://orgchart.talentdot.org') return;

      console.log("iframe message:", event.data);

      if (event.data.type === 'chartReady') {
        console.log('chart is ready:', event.data.payload);
        const iframe = document.getElementById('orgChartIframe') as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: 'setData',
              payload: {
                data: this.orgChartData,
                chartType: 'companyChart'
              }
            },
            'https://orgchart.talentdot.org'
          );
          console.log("data sent to iframe");
        }
      }

      if (event.data.type === 'nodeClicked') {
        console.log('Node clicked:', event.data.payload);
      }
    });

    // window.addEventListener('message', (event) => {
    //   if (event.origin !== 'https://orgchart.talentdot.org') return;

    //   console.log("iframe message:", event.data);

    //   if (event.data.type === 'chartReady') {
    //     console.log('chart is ready:', event.data.payload);
    //   }

    //   if (event.data.type === 'nodeClicked') {
    //     console.log('Node clicked:', event.data.payload);
    //   }
    // });

  }

  ngAfterViewInit(): void {
    this.iframeRef.nativeElement.onload = () => {
      console.log('Iframe loaded ✅');
      this.sendData();
    };
  }

  sendData(): void {
    const iframeWindow = this.iframeRef.nativeElement.contentWindow;
    if (iframeWindow) {
      // iframeWindow.postMessage(
      //   { type: 'setData', payload: this.orgChartData },
      //   'https://orgchart.talentdot.org'
      // );

      iframeWindow.postMessage(
        {
          type: 'setData',
          payload: {
            data: this.orgChartData,
            chartType: 'companyChart'
          }
        },
        'https://orgchart.talentdot.org'
      );
      console.log("Data sent to iframe:", this.orgChartData);
    }

  }


  onIframeLoad() {
    console.log("Iframe loaded");

    setTimeout(() => {
      const payload = {
        name: 'Aya Emad',
        position: 'CEO',
        jobTitleCode: 101,
        level: 'Executive',
        expanded: true
      };

      console.log("📤 Sending data to iframe:", payload);

      this.iframeRef.nativeElement.contentWindow.postMessage(
        { type: 'SET_COMPANY_DATA', payload },
        '*'
      );
    }, 1000); // iframe ready delay
  }


  chart: any;
  zoom = 1;
  isFullScreen = false;









  toggleState = true;


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
