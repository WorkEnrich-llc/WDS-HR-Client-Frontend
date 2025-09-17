import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-company-chart',
  imports: [CommonModule],
  templateUrl: './company-test-chart.component.html',
  styleUrl: './company-test-chart.component.css'
})
export class CompanyTestChartComponent implements OnInit, AfterViewInit {
  @ViewChild('chartBox') chartBox?: ElementRef;
  @ViewChild('iframeRef', { static: false }) iframeRef!: ElementRef;


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

  companyChartData = [
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
          name: "Department A",
          type: "department",
          code: "DEP-001",
          expanded: false,
          children: []
        },
        {
          id: 3,
          name: "Department B",
          type: "department",
          code: "DEP-002",
          expanded: false,
          children: []
        }
      ]
    }
  ];



  ngOnInit(): void {
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://orgchart.talentdot.org') return;

      console.log('📩 Message from iframe:', event.data);

      if (event.data.type === 'orgChartReady') {
        console.log('✅ OrgChart API ready, sending data now...');
        this.sendData();
      }
    });

  }

  ngAfterViewInit(): void {
    window.addEventListener("message", (event) => {
      if (event.origin === "https://orgchart.talentdot.org") {
        console.log("📩 Message from iframe:", event.data);

        if (event.data?.type === "ready") {
          console.log("✅ Iframe says it's ready, sending data now...");
          this.sendDataToIframe();
        }
      }
    });
  }


  // ngAfterViewInit() {
  //   this.iframeRef.nativeElement.onload = () => {
  //     console.log('Iframe loaded');
  //   };
  // }

  // sendData() {
  //   const payload = this.orgChartData;
  //   console.log("Sending data to iframe:", payload);
  //   console.log(this.iframeRef.nativeElement.src);
  //   this.iframeRef.nativeElement.contentWindow.postMessage(
  //     {
  //       type: "setData",
  //       data: this.orgChartData,
  //       chartId: "orgChart"
  //     },

  //     "https://orgchart.talentdot.org/"
  //   );
  // }

  sendData() {
    const payload = {
      type: "setData",
      data: this.companyChartData,
      chartId: "companyChart"
    };

    console.log("📤 Sending RAW data to iframe:", JSON.stringify(payload, null, 2));

    this.iframeRef.nativeElement.contentWindow.postMessage(
      payload,
      "https://orgchart.talentdot.org/"
    );
  }

  sendDataToIframe() {
    const iframe = this.iframeRef.nativeElement;
    if (!iframe || !iframe.contentWindow) {
      console.error("❌ Iframe not ready yet");
      return;
    }

    const payload = {
      type: "setData",
      chartId: "companyChart",
      data: this.companyChartData
    };
    console.log("📤 Sending RAW data to iframe:", payload);
    iframe.contentWindow.postMessage(payload, "https://orgchart.talentdot.org");
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
