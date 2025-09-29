// import { CommonModule } from '@angular/common';
// import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
// import { ChartsService } from 'app/core/services/od/charts/charts.service';
// declare var OrgChart: any;

// @Component({
//   selector: 'app-organization-chart',
//   imports: [CommonModule],
//   templateUrl: './organization-chart.component.html',
//   styleUrl: './organization-chart.component.css'
// })
// export class OrganizationChartComponent {
//   @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
//   @ViewChild('chartBox') chartBox?: ElementRef;
//   constructor(private chartsService: ChartsService, private cd: ChangeDetectorRef) { }
//   companyData: any = {};

//   ngOnInit(): void {
//     this.getCompanyChart();
//   }

//   getCompanyChart() {
//     this.chartsService.jobsChart().subscribe({
//       next: (response) => {
//         const list = response.data.list_items;
//         console.log(list);
//         this.companyData = this.mapToCompanyData(list[0]);
//         console.log(this.companyData);
//         this.cd.detectChanges();
//         this.initChart();
//       },
//       error: (err) => {
//         console.log(err.error?.details);
//       }
//     });
//   }


//   mapToCompanyData(item: any): any {
//     return {
//       name: item.name,
//       position: item.position,
//       jobTitleCode: item.job_title_code ?? item.id,
//       level: item.level,
//       job_level: item.job_level,
//       expanded: item.expanded ?? false,
//       firstNode: item.firstNode ?? false,
//       class: this.getNodeTag(item),
//      children: item.children ? item.children.map((c: any) => this.mapToCompanyData(c)) : []
//     };
//   }
//   getNodeTag(node: any): string {
//     if (node.level === 'Executive') return 'executive-tag';
//     if (node.level === 'Senior Management') return 'senior-tag';
//     if (node.level === 'Middle Management') return 'middle-tag';
//     if (node.level === 'Team Leadership') return 'team-leader-tag';
//     if (node.job_level === 'Expert') return 'expert-tag';
//     return 'default-tag';
//   }



//   chart: any;
//   zoom = 1;
//   isFullScreen = false;


//   initChart(): void {

//     OrgChart.templates.cool = Object.assign({}, OrgChart.templates.ana);
//     OrgChart.templates.cool.size = [310, 150];
//     OrgChart.templates.cool.node = `
//     <rect x="0" y="0" height="150" width="310" fill="#ffffff" stroke-width="1" stroke="#000000" rx="10" ry="10"></rect>
// `;
//     OrgChart.templates.cool.field_0 = `<g class="level">
  
//     <rect x="10" y="10" rx="20" ry="20" width="120" height="30" fill="#f0f0f0" stroke="#333" stroke-width="1" />
    
//     <text x="20" y="30">{val}</text>
//   </g>`;
//     OrgChart.templates.cool.field_1 = `<text class="code" x="20" y="60">{val}</text>`;
//     OrgChart.templates.cool.field_2 = `<text class="postion" x="20" y="90">{val}</text>`;
//     OrgChart.templates.cool.field_3 = `<text class="name" x="20" y="120">{val}</text>`;
//     OrgChart.templates.cool.svg = `
//             <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
//                  style="background-color:#F2F2F2;display:block;" width="{w}" height="{h}" viewBox="{viewBox}">
//                 {content}
//             </svg>
//         `;

//     const nodes: any[] = [];
//     let idCounter = 1;

//     // Add a check in flattenTree:
//     const flattenTree = (node: any, parentId: number | null = null) => {
//       const currentId = idCounter++;
//       if (!node.name || !node.position || !node.jobTitleCode) {
//         // console.warn('Invalid node data:', node);
//         return;
//       }

//       nodes.push({
//         id: currentId,
//         pid: parentId,
//         points: node.level,
//         name: node.name,
//         title: node.position,
//         title2: [this.padJobTitleCode(node.jobTitleCode)],
//         tags: [this.getNodeTag(node)]
//       });


//       if (Array.isArray(node.children)) {
//         for (const child of node.children) {
//           flattenTree(child, currentId);
//         }
//       }
//     };


//     flattenTree(this.companyData);

//     this.chart = new OrgChart(this.chartContainer.nativeElement, {
//       mouseScrool: OrgChart.action.scroll,
//       scaleInitial: OrgChart.match.boundary,
//       enableSearch: false,
//       template: 'cool',
//       lazyLoading: false,
//       nodeBinding: {
//         field_0: 'points',
//         field_1: 'title2',
//         field_2: 'title',
//         field_3: 'name',
//       },
//       classNameField: "class",
//       nodeMouseClick: OrgChart.action.expandCollapseSingle,
//       collapse: {
//         level: 1,
//         allChildren: true
//       },
//       expand: {
//         nodes: [1],
//         allChildren: false
//       },

//     });

//     this.chart.onNodeClick((_: any, args: any) => {
//       // console.log('Node clicked:', args.node.data);
//       this.fitChart();
//       return false;
//     });

//     this.chart.on('expand', () => {
//       this.fitChart();
//     });

//     this.chart.on('init', () => {
//       setTimeout(() => {
//         this.fitChart();
//       }, 0);
//     });

//     this.chart.load(nodes);
//     this.chart.on('redraw', () => {
//       const levels = document.querySelectorAll('.level');
//       levels.forEach((group: any) => {
//         const text = group.querySelector('text');
//         const rect = group.querySelector('rect');

//         if (!text || !rect) return;

//         const bbox = text.getBBox();
//         const paddingX = 25;
//         const paddingY = 15;

//         rect.setAttribute('x', String(bbox.x - paddingX / 2));
//         rect.setAttribute('y', String(bbox.y - paddingY / 2));
//         rect.setAttribute('width', String(bbox.width + paddingX));
//         rect.setAttribute('height', String(bbox.height + paddingY));
//       });
//     });






//   }




//   fitChart(): void {
//     if (this.chart) {
//       const container = this.chartContainer.nativeElement;
//       const containerWidth = container.offsetWidth;
//       const containerHeight = container.offsetHeight;
//       const chartWidth = this.chart.width();
//       const chartHeight = this.chart.height();

//       if (!chartWidth || !chartHeight) {
//         return;
//       }

//       const scaleX = containerWidth / chartWidth;
//       const scaleY = containerHeight / chartHeight;
//       const targetScale = Math.min(scaleX, scaleY);
//       const currentScale = this.chart.getScale();

//       const steps = 20;
//       let step = 0;

//       const animate = () => {
//         step++;
//         const progress = step / steps;
//         const ease = 1 - Math.pow(1 - progress, 2); // Ease-out
//         const newScale = currentScale + (targetScale - currentScale) * ease;

//         this.chart.setScale(newScale);

//         if (step < steps) {
//           requestAnimationFrame(animate);
//         } else {
//           this.chart.center();
//           this.chart.fit(); // optional for best final adjustment
//         }
//       };

//       animate();
//     }
//   }



//   zoomIn(): void {
//     this.chart.zoom(true);
//   }

//   zoomOut(): void {
//     this.chart.zoom(false);
//   }

//   toggleState = true;

//   toggleChartView(): void {
//     if (this.toggleState) {
//       this.openfitChart();
//     } else {
//       this.resetTreeToRoot();
//     }
//     this.toggleState = !this.toggleState;
//   }

//   openfitChart(): void {
//     if (this.chart) {
//       this.chart.fit();
//       this.chart.expand(0, 'all');
//       const container = this.chartContainer.nativeElement;
//       const containerWidth = container.offsetWidth;
//       const containerHeight = container.offsetHeight;
//       const chartWidth = this.chart.offsetWidth;
//       const chartHeight = this.chart.offsetHeight;
//       const scaleX = containerWidth / chartWidth;
//       const scaleY = containerHeight / chartHeight;
//       const scale = Math.min(scaleX, scaleY);
//       this.chart.zoom(scale);
//       this.chart.fit();
//     }
//   }
//   resetTreeToRoot() {
//     location.reload();
//   }
//   toggleFullScreen() {
//     this.isFullScreen = !this.isFullScreen;
//     const bodyElement = document.querySelector('.body');
//     const sidenav = document.querySelector('.sidenav');
//     const htmlElement = document.documentElement;
//     const btnFixed = document.querySelector('.btn-fixed') as HTMLElement;
//     if (bodyElement) {
//       if (this.isFullScreen) {
//         bodyElement.classList.add('body-full');
//         if (sidenav) {
//           sidenav.classList.add('sidenav-hidden');
//         }
//         htmlElement.style.setProperty('zoom', '1', 'important');
//         if (btnFixed) {
//           btnFixed.style.setProperty('zoom', '0.85', 'important');
//         }
//       } else {
//         bodyElement.classList.remove('body-full');
//         if (sidenav) {
//           sidenav.classList.remove('sidenav-hidden');
//         }
//         htmlElement.style.removeProperty('zoom');
//         if (btnFixed) {
//           btnFixed.style.removeProperty('zoom');
//         }
//       }
//     }
//   }


//   padJobTitleCode(code: string | number): string {
//     return code ? code.toString().padStart(4, '0') : '';
//   }
// }
