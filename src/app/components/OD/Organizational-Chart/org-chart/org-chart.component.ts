import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { OrganizationChartModule } from 'primeng/organizationchart';

@Component({
  selector: 'app-org-chart',
  imports: [PageHeaderComponent, CommonModule, OrganizationChartModule],
  templateUrl: './org-chart.component.html',
  styleUrls: ['./org-chart.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class OrgChartComponent implements OnInit {
  orgChartData: any;

  ngOnInit(): void {
    const root = {
      name: 'Ahmed Youssef',
      position: 'CEO',
      jobTitleCode: 101,
      level: 'Executive',
      expanded: false,
      firstNode: true,
      children: [
        {
          name: 'Laila Hassan',
          position: 'CFO',
          jobTitleCode: 102,
          level: 'Senior Management',
          expanded: false,
          children: [
            {
              name: 'Mona Ali',
              position: 'Finance Manager',
              jobTitleCode: 103,
              level: 'Middle Management',
              expanded: false,
              children: [
                {
                  name: 'Hossam Tarek',
                  position: 'Accounting Team Lead',
                  jobTitleCode: 104,
                  level: 'Team Leadership',
                  expanded: false,
                  children: [
                    {
                      name: 'Nour El-Din',
                      position: 'Accountant',
                      jobTitleCode: 105,
                      level: 'Non-Managerial',
                      expanded: false,
                      children: []
                    },
                    {
                      name: 'Salma Refaat',
                      position: 'Junior Accountant',
                      jobTitleCode: 106,
                      level: 'Non-Managerial',
                      expanded: false,
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
          expanded: false,
          children: [
            {
              name: 'Yasmine Adel',
              position: 'Operations Manager',
              jobTitleCode: 108,
              level: 'Middle Management',
              expanded: false,
              children: [
                {
                  name: 'Omar Lotfy',
                  position: 'Team Leader - Logistics',
                  jobTitleCode: 109,
                  level: 'Team Leadership',
                  expanded: false,
                  children: [
                    {
                      name: 'Tamer Shawky',
                      position: 'Logistics Officer',
                      jobTitleCode: 110,
                      level: 'Non-Managerial',
                      expanded: false,
                      children: []
                    },
                    {
                      name: 'Dina Magdy',
                      position: 'Warehouse Coordinator',
                      jobTitleCode: 111,
                      level: 'Non-Managerial',
                      expanded: false,
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
          expanded: false,
          children: [
            {
              name: 'Fady Nabil',
              position: 'Marketing Manager',
              jobTitleCode: 113,
              level: 'Middle Management',
              expanded: false,
              children: [
                {
                  name: 'Reem Samir',
                  position: 'Digital Marketing Lead',
                  jobTitleCode: 114,
                  level: 'Team Leadership',
                  expanded: false,
                  children: [
                    {
                      name: 'Nada Hossam',
                      position: 'Content Creator',
                      jobTitleCode: 115,
                      level: 'Non-Managerial',
                      expanded: false,
                      children: []
                    },
                    {
                      name: 'Hady Mostafa',
                      position: 'SEO Specialist',
                      jobTitleCode: 116,
                      level: 'Non-Managerial',
                      expanded: false,
                      children: []
                    }
                  ]
                },
                {
                  name: 'Aya Sherif',
                  position: 'Offline Campaign Lead',
                  jobTitleCode: 117,
                  level: 'Team Leadership',
                  expanded: false,
                  children: [
                    {
                      name: 'Mahmoud Saeed',
                      position: 'Marketing Coordinator',
                      jobTitleCode: 118,
                      level: 'Non-Managerial',
                      expanded: false,
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
          expanded: false,
          children: [
            {
              name: 'Mostafa Emad',
              position: 'Engineering Manager',
              jobTitleCode: 120,
              level: 'Middle Management',
              expanded: false,
              children: [
                {
                  name: 'Yara Mohamed',
                  position: 'Frontend Team Lead',
                  jobTitleCode: 121,
                  level: 'Team Leadership',
                  expanded: false,
                  children: [
                    {
                      name: 'Karim Adel',
                      position: 'Frontend Developer',
                      jobTitleCode: 122,
                      level: 'Non-Managerial',
                      expanded: false,
                      children: []
                    },
                    {
                      name: 'Sahar Fathy',
                      position: 'Frontend Developer',
                      jobTitleCode: 123,
                      level: 'Non-Managerial',
                      expanded: false,
                      children: []
                    }
                  ]
                },
                {
                  name: 'Hani Younis',
                  position: 'Backend Team Lead',
                  jobTitleCode: 124,
                  level: 'Team Leadership',
                  expanded: false,
                  children: [
                    {
                      name: 'Alaa Hussein',
                      position: 'Backend Developer',
                      jobTitleCode: 125,
                      level: 'Non-Managerial',
                      expanded: false,
                      children: []
                    },
                    {
                      name: 'Sara Atef',
                      position: 'Database Admin',
                      jobTitleCode: 126,
                      level: 'Non-Managerial',
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

    this.orgChartData = [this.convertToOrgChartFormat(root)];
  }

convertToOrgChartFormat(node: any): any {
  const levelClass = node.level ? node.level.toLowerCase().replace(/\s+/g, '-') : '';
  return {
    label: node.name,
    type: 'person',
    styleClass: `p-person level-${levelClass}`,
    expanded: node.expanded ?? false,
    data: {
      name: node.name,
      position: node.position,
      level: node.level,
      jobTitleCode: node.jobTitleCode
    },
    children: node.children?.map((child: any) => this.convertToOrgChartFormat(child)) || []
  };
}

getLevelClass(level: string): string {
  return 'level-' + (level ? level.toLowerCase().replace(/\s+/g, '-') : '');
}
padJobTitleCode(code: string | number): string {
  return code ? code.toString().padStart(4, '0') : '';
}
  toggleCollapse(node: any) {
    node.collapsed = !node.collapsed;
  }

  hasChildren(node: any): boolean {
    return node.children && node.children.length > 0;
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

    const bodyElement = document.querySelector('.body'); // البحث عن العنصر الذي يحتوي على الكلاس body

    if (bodyElement) {
      if (this.isFullScreen) {
        bodyElement.classList.add('body-full');
      } else {
        bodyElement.classList.remove('body-full');
      }
    }
  }


}