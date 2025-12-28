
import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { ChartsService } from 'app/core/services/od/charts/charts.service';
declare var OrgChart: any;

@Component({
  selector: 'app-company-chart',
  imports: [],
  templateUrl: './company-chart.component.html',
  styleUrl: './company-chart.component.css'
})
export class CompanyChartComponent {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  @ViewChild('chartBox') chartBox?: ElementRef;
  constructor(private chartsService: ChartsService, private cd: ChangeDetectorRef) { }
  companyData: any = {};

  ngOnInit(): void {
    this.getCompanyChart();
  }

  getCompanyChart() {
    this.chartsService.companyChart().subscribe({
      next: (response) => {
        const list = response.data.list_items;
        // console.log(list);
        this.companyData = this.mapToCompanyData(list[0]);
        // console.log(this.companyData);
        this.cd.detectChanges();
        this.initChart();
      },
      error: (err) => {
        console.error(err.error?.details);
      }
    });
  }

  mapToCompanyData(item: any): any {
    const levelMapping: any = {
      "company": "Executive",
      "branch": "Senior Management",
      "department": "Middle Management",
      "section": "Team Leadership",
      "job_title": "Non-Managerial"
    };

    let nodeLevelClass: string | null = levelMapping[item.type] || item.type;

    let nodeLevel: string | null = null;


    if (item.max_employee) {
      nodeLevel = `<tspan class="node-label">Max Employees:</tspan> <tspan class="node-value">${item.max_employee}</tspan>`;
    } else if (item.number_employees) {
      nodeLevel = `<tspan class="node-label">Employees:</tspan> <tspan class="node-value">${item.number_employees}</tspan>`;
    } else if (item.location) {
      nodeLevel = `<tspan class="node-label">Location:</tspan> <tspan class="node-value">${item.location}</tspan>`;
    } else if (item.jobTitleId || item.jobTitleCode) {
      nodeLevel = `<tspan class="node-label">ID:</tspan> <tspan class="node-value">${item.jobTitleId ?? item.jobTitleCode}</tspan>`;
    } else if (item.code && item.code.trim() !== "") {
      nodeLevel = `<tspan class="node-label">Code:</tspan> <tspan class="node-value">${item.code}</tspan>`;
    } else {
      const paddedId = item.id.toString().padStart(4, "0");
      nodeLevel = `<tspan class="node-label">ID:</tspan> <tspan class="node-value">${paddedId}</tspan>`;
    }


    return {
      name: item.name,
      type: item.type,
      position: item.type,
      jobTitleCode: item.jobTitleCode ?? item.id,
      class: this.getNodeTag(item),
      level: nodeLevel,
      expanded: item.expanded ?? false,
      firstNode: item.firstNode ?? false,
      children: item.children ? item.children.map((c: any) => this.mapToCompanyData(c)) : []
    };
  }


  getNodeTag(node: any): string {
    switch (node.type) {
      case "company": return "executive-tag";
      case "branch": return "senior-tag";
      case "department": return "middle-tag";
      case "section": return "team-leader-tag";
      case "job_title": return "nonmanager-tag";
      default: return "default-tag";
    }
  }

  chart: any;
  zoom = 1;
  isFullScreen = false;


  initChart(): void {

    OrgChart.templates.cool = Object.assign({}, OrgChart.templates.ana);
    OrgChart.templates.cool.size = [310, 150];
    OrgChart.templates.cool.node = `
    <rect x="0" y="0" height="150" width="310" fill="#ffffff" stroke-width="1" stroke="#000000" rx="10" ry="10"></rect>
`;
    OrgChart.templates.cool.field_0 = `<g class="level">
  
    <rect x="10" y="10" rx="20" ry="20" width="120" height="30" fill="#f0f0f0" stroke="#333" stroke-width="1" />
    
    <text x="30" y="30">{val}</text>
  </g>`;
    OrgChart.templates.cool.field_1 = `<text class="code" x="20" y="60">{val}</text>`;
    OrgChart.templates.cool.field_2 = `<text class="postion" x="20" y="70">{val}</text>`;
    OrgChart.templates.cool.field_3 = `
  <foreignObject x="20" y="85" width="270" height="60" class="name">
    <div xmlns="http://www.w3.org/1999/xhtml" style="text-align: start; line-height: 1.2;">
      {val}
    </div>
  </foreignObject>
`;

    OrgChart.templates.cool.svg = `
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
                 style="background-color:#F2F2F2;display:block;" width="{w}" height="{h}" viewBox="{viewBox}">
                {content}
            </svg>
        `;

    const nodes: any[] = [];
    let idCounter = 1;

    // Add a check in flattenTree:
    const flattenTree = (node: any, parentId: number | null = null) => {
      const currentId = idCounter++;
      if (!node.name || !node.position || !node.jobTitleCode) {
        // console.warn('Invalid node data:', node);
        return;
      }

      nodes.push({
        id: currentId,
        pid: parentId,
        points: node.level,
        name: node.name,
        title: node.position,
        tags: [node.class]
      });


      if (Array.isArray(node.children)) {
        for (const child of node.children) {
          flattenTree(child, currentId);
        }
      }
    };


    flattenTree(this.companyData);

    this.chart = new OrgChart(this.chartContainer.nativeElement, {
      mouseScrool: OrgChart.action.scroll,
      scaleInitial: OrgChart.match.boundary,
      enableSearch: false,
      template: 'cool',
      lazyLoading: false,
      nodeBinding: {
        field_0: 'title',
        field_1: '',
        field_2: 'points',
        field_3: 'name',
      },
      classNameField: "tags",

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
      this.fitChart();
      return false;
    });

    this.chart.on('expand', () => {
      this.fitChart();
    });

    this.chart.on('init', () => {
      setTimeout(() => {
        this.fitChart();
      }, 0);
    });

    this.chart.load(nodes);
    this.chart.on('redraw', () => {
      const levels = document.querySelectorAll('.level');
      levels.forEach((group: any) => {
        const text = group.querySelector('text');
        const rect = group.querySelector('rect');

        if (!text || !rect) return;

        const bbox = text.getBBox();
        const paddingX = 25;
        const paddingY = 15;

        rect.setAttribute('x', String(bbox.x - paddingX / 2));
        rect.setAttribute('y', String(bbox.y - paddingY / 2));
        rect.setAttribute('width', String(bbox.width + paddingX));
        rect.setAttribute('height', String(bbox.height + paddingY));
      });
    });






  }


  fitChart(): void {
    if (this.chart) {
      const container = this.chartContainer.nativeElement;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const chartWidth = this.chart.width();
      const chartHeight = this.chart.height();

      if (!chartWidth || !chartHeight) {
        return;
      }

      const scaleX = containerWidth / chartWidth;
      const scaleY = containerHeight / chartHeight;
      const targetScale = Math.min(scaleX, scaleY);
      const currentScale = this.chart.getScale();

      const steps = 20;
      let step = 0;

      const animate = () => {
        step++;
        const progress = step / steps;
        const ease = 1 - Math.pow(1 - progress, 2);
        const newScale = currentScale + (targetScale - currentScale) * ease;

        this.chart.setScale(newScale);

        if (step < steps) {
          requestAnimationFrame(animate);
        } else {
          this.chart.center();
          this.chart.fit();
        }
      };

      animate();
    }
  }



  zoomIn(): void {
    this.chart.zoom(true);
  }

  zoomOut(): void {
    this.chart.zoom(false);
  }

  toggleState = true;

  toggleChartView(): void {
    if (this.toggleState) {
      this.openfitChart();
    } else {
      this.resetTreeToRoot();
    }
    this.toggleState = !this.toggleState;
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
  resetTreeToRoot() {
    location.reload();
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


  padJobTitleCode(code: string | number): string {
    return code ? code.toString().padStart(4, '0') : '';
  }

}
