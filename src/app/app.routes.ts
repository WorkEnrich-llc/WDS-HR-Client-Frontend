import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'branches',
    pathMatch: 'full'
  },

  // start OD layout
  {
    path: '',
    loadComponent: () => import('./layouts/od-layout/od-layout.component').then(m => m.OdLayoutComponent),
    children: [
      // Branch routes
      {
        path: 'branches',
        children: [
          {
            path: '',
            redirectTo:'all-branches',
            pathMatch: 'full'
          },
          {
            path: 'all-branches',
            loadComponent: () => import('./components/OD/Branches/all-branches/all-branches.component').then(m => m.AllBranchesComponent),
            title: 'Branches',
          },
          {
            path: 'view-branch',
            loadComponent: () => import('./components/OD/Branches/view-branches/view-branches.component').then(m => m.ViewBranchesComponent),
            title: 'View Branch'
          },
        ]
      },

      // Job routes
      {
        path: 'jobs',
        children: [
          {
            path: '',
            redirectTo:'job-titles',
            pathMatch: 'full'
          },
          {
            path: 'job-titles',
            loadComponent: () => import('./components/OD/Job-Titles/all-job-titles/all-job-titles.component').then(m => m.AllJobTitlesComponent),
            title: 'Job Titles'
          }
        ]
      }
    ]
  }
];
