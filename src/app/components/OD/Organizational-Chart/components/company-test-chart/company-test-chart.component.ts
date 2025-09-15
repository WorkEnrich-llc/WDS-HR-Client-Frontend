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

  orgChartData = {
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
      }
    ]
  };

  ngOnInit(): void {

    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://orgchart.talentdot.org') return;
      if (event.data.type === 'orgChartReady') {
        console.log('Org Chart is ready');
      }
      if (event.data.type === 'someResponse') {
        console.log('Data returned:', event.data.payload);
      }
    });

  }

  ngAfterViewInit() {
    this.iframeRef.nativeElement.onload = () => {
      console.log('Iframe loaded');
      this.sendData();
    };
  }

  sendData() {
    const payload = this.orgChartData;
    console.log("Sending data to iframe:", payload);
    if (this.iframeRef && this.iframeRef.nativeElement) {
      this.iframeRef.nativeElement.contentWindow.postMessage(
        { type: 'initOrgChart', payload: this.orgChartData },
        'https://orgchart.talentdot.org'
      );
    }
    console.log("Message sent to iframe");
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
