import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
declare var OrgChart: any;

@Component({
  selector: 'app-org-chart',
  imports: [PageHeaderComponent, CommonModule],
  templateUrl: './org-chart.component.html',
  styleUrls: ['./org-chart.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class OrgChartComponent implements OnInit, AfterViewInit {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  root: any;
  chart: any;

  ngAfterViewInit(): void {
    OrgChart.templates.cool = Object.assign({}, OrgChart.templates.ana);
    OrgChart.templates.cool.size = [310, 150];
    OrgChart.templates.cool.node = `
    <rect x="0" y="0" height="150" width="310" fill="#ffffff" stroke-width="1" stroke="#000000" rx="10" ry="10"></rect>
`;
    OrgChart.templates.cool.field_0 = `<g class="level">
  
    <rect x="10" y="10" rx="20" ry="20" width="120" height="30" fill="#f0f0f0" stroke="#333" stroke-width="1" />
    
    <text x="20" y="30">{val}</text>
  </g>`;
    OrgChart.templates.cool.field_1 = `<text class="code" x="20" y="60">{val}</text>`;
    OrgChart.templates.cool.field_2 = `<text class="postion" x="20" y="90">{val}</text>`;
    OrgChart.templates.cool.field_3 = `<text class="name" x="20" y="120">{val}</text>`;
    OrgChart.templates.cool.svg = `
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                 style="background-color:#F2F2F2;display:block;" width="{w}" height="{h}" viewBox="{viewBox}">
                {content}
            </svg>
        `;

    const nodes: any[] = [];
    let idCounter = 1;

    const flattenTree = (node: any, parentId: number | null = null) => {
      const currentId = idCounter++;
      nodes.push({
        id: currentId,
        pid: parentId,
        points: node.level,
        name: node.name,
        title: node.position,
        title2: [this.padJobTitleCode(node.jobTitleCode)],
        tags: [this.getNodeTag(node)]
      });

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          flattenTree(child, currentId);
        }
      }
    };

    flattenTree(this.root);

    this.chart = new OrgChart(this.chartContainer.nativeElement, {
      mouseScrool: OrgChart.action.scroll,
      scaleInitial: OrgChart.match.boundary,
      enableSearch: false,
      template: 'cool',
      nodeBinding: {
        field_0: 'points',
        field_1: 'title2',
        field_2: 'title',
        field_3: 'name',
      },
      classNameField: "class",
      nodeMouseClick: OrgChart.action.expandCollapseSingle,
      collapse: {
        level: 1,
        allChildren: true
      },
      expand: {
        nodes: [1],
        allChildren: false
      },

    });

    this.chart.onNodeClick((_: any, args: any) => {
      console.log('Node clicked:', args.node.data);
      this.fitChart();
      return false;
    });

    this.chart.on('expand', () => {
      this.fitChart();
    });

    this.chart.on('init', () => {
      this.fitChart();
    });

    this.chart.load(nodes);
    this.chart.on('redraw', () => {
      const levels = document.querySelectorAll('.level');
      levels.forEach((group: any) => {
        const text = group.querySelector('text');
        const rect = group.querySelector('rect');

        if (!text || !rect) return;

        const bbox = text.getBBox();
        const paddingX = 20;

        rect.setAttribute('x', String(bbox.x - paddingX / 2));
        rect.setAttribute('y', String(bbox.y - 5));
        rect.setAttribute('width', String(bbox.width + paddingX));
        rect.setAttribute('height', String(bbox.height + 10));
      });
    });


  }

  getNodeTag(node: any): string {
    if (node.level === 'Executive') return 'executive-tag';
    if (node.level === 'Senior Management') return 'senior-tag';
    if (node.level === 'Middle Management') return 'middle-tag';
    if (node.level === 'Team Leadership') return 'team-leader-tag';
    return 'default-tag';
  }

  fitChart(): void {
    if (this.chart) {
      const container = this.chartContainer.nativeElement;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const chartWidth = this.chart.width();
      const chartHeight = this.chart.height();

      const scaleX = containerWidth / chartWidth;
      const scaleY = containerHeight / chartHeight;
      const scale = Math.min(scaleX, scaleY);

      this.chart.setScale(scale);
      this.chart.center();
      this.chart.fit();
    }
  }

  zoomIn(): void {
    this.chart.zoom(true);
  }

  zoomOut(): void {
    this.chart.zoom(false);
  }

  openfitChart(): void {
    if (this.chart) {
      this.chart.fit();
      this.chart.expand(0, 'all');
      const container = this.chartContainer.nativeElement;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const chartWidth = this.chart.offsetWidth;
      const chartHeight = this.chart.offsetHeight;
      const scaleX = containerWidth / chartWidth;
      const scaleY = containerHeight / chartHeight;
      const scale = Math.min(scaleX, scaleY);
      this.chart.zoom(scale);
      this.chart.fit();
    }
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
  
  
  resetTreeToRoot() {
    location.reload();
  }

  zoom = 1;
  isFullScreen = false;
  @ViewChild('chartBox') chartBox?: ElementRef;
  ngOnInit(): void {
    this.root = {
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
  }
  padJobTitleCode(code: string | number): string {
    return code ? code.toString().padStart(4, '0') : '';
  }
}