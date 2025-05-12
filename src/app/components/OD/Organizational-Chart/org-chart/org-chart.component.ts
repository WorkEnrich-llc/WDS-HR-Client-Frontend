import * as d3 from 'd3';
import { curveBundle } from 'd3-shape';
import { Component, OnInit, ViewEncapsulation, CUSTOM_ELEMENTS_SCHEMA, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-org-chart',
  imports: [PageHeaderComponent, CommonModule],
  templateUrl: './org-chart.component.html',
  styleUrl: './org-chart.component.css',
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OrgChartComponent implements OnInit {
orgChartData = {
  name: 'Ahmed Youssef',
  position: 'CEO',
  jobTitleCode: 101,
  level: 'Executive',
  collapsed: false,
  firstNode: true,
  children: [
    {
      name: 'Laila Hassan',
      position: 'CFO',
      jobTitleCode: 102,
      level: 'Senior Management',
      collapsed: true,
      children: [
        {
          name: 'Mona Ali',
          position: 'Finance Manager',
          jobTitleCode: 103,
          level: 'Middle Management',
          collapsed: true,
          children: [
            {
              name: 'Hossam Tarek',
              position: 'Accounting Team Lead',
              jobTitleCode: 104,
              level: 'Team Leadership',
              collapsed: true,
              children: [
                {
                  name: 'Nour El-Din',
                  position: 'Accountant',
                  jobTitleCode: 105,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                },
                {
                  name: 'Salma Refaat',
                  position: 'Junior Accountant',
                  jobTitleCode: 106,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Khaled Ibrahim',
      position: 'COO',
      jobTitleCode: 107,
      level: 'Senior Management',
      collapsed: true,
      children: [
        {
          name: 'Yasmine Adel',
          position: 'Operations Manager',
          jobTitleCode: 108,
          level: 'Middle Management',
          collapsed: true,
          children: [
            {
              name: 'Omar Lotfy',
              position: 'Team Leader - Logistics',
              jobTitleCode: 109,
              level: 'Team Leadership',
              collapsed: true,
              children: [
                {
                  name: 'Tamer Shawky',
                  position: 'Logistics Officer',
                  jobTitleCode: 110,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                },
                {
                  name: 'Dina Magdy',
                  position: 'Warehouse Coordinator',
                  jobTitleCode: 111,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Samar Ahmed',
      position: 'CMO',
      jobTitleCode: 112,
      level: 'Senior Management',
      collapsed: true,
      children: [
        {
          name: 'Fady Nabil',
          position: 'Marketing Manager',
          jobTitleCode: 113,
          level: 'Middle Management',
          collapsed: true,
          children: [
            {
              name: 'Reem Samir',
              position: 'Digital Marketing Lead',
              jobTitleCode: 114,
              level: 'Team Leadership',
              collapsed: true,
              children: [
                {
                  name: 'Nada Hossam',
                  position: 'Content Creator',
                  jobTitleCode: 115,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                },
                {
                  name: 'Hady Mostafa',
                  position: 'SEO Specialist',
                  jobTitleCode: 116,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                }
              ]
            },
            {
              name: 'Aya Sherif',
              position: 'Offline Campaign Lead',
              jobTitleCode: 117,
              level: 'Team Leadership',
              collapsed: true,
              children: [
                {
                  name: 'Mahmoud Saeed',
                  position: 'Marketing Coordinator',
                  jobTitleCode: 118,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'Ehab Farouk',
      position: 'CTO',
      jobTitleCode: 119,
      level: 'Senior Management',
      collapsed: true,
      children: [
        {
          name: 'Mostafa Emad',
          position: 'Engineering Manager',
          jobTitleCode: 120,
          level: 'Middle Management',
          collapsed: true,
          children: [
            {
              name: 'Yara Mohamed',
              position: 'Frontend Team Lead',
              jobTitleCode: 121,
              level: 'Team Leadership',
              collapsed: true,
              children: [
                {
                  name: 'Karim Adel',
                  position: 'Frontend Developer',
                  jobTitleCode: 122,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                },
                {
                  name: 'Sahar Fathy',
                  position: 'Frontend Developer',
                  jobTitleCode: 123,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                }
              ]
            },
            {
              name: 'Hani Younis',
              position: 'Backend Team Lead',
              jobTitleCode: 124,
              level: 'Team Leadership',
              collapsed: true,
              children: [
                {
                  name: 'Alaa Hussein',
                  position: 'Backend Developer',
                  jobTitleCode: 125,
                  level: 'Non-Managerial',
                  collapsed: true,
                  children: []
                },
                {
                  name: 'Sara Atef',
                  position: 'Database Admin',
                  jobTitleCode: 126,
                  level: 'Non-Managerial',
                  collapsed: true,
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


  ngAfterViewInit(): void {
  }


  zoom = 1;
  isFullScreen = false;

  zoomIn() {
    this.zoom += 0.1;
  }

  zoomOut() {
    this.zoom = Math.max(0.5, this.zoom - 0.1);
  }

  toggleFullScreen() {
    this.isFullScreen = !this.isFullScreen;
  }


  ngOnInit(): void {
  }
}