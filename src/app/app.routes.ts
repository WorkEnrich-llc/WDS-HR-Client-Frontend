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
       // branches
      {
        path: 'branches',
        loadComponent: () => import('./components/OD/Branches/all-branches/all-branches.component').then(m => m.AllBranchesComponent),
        title: 'Branches'
      },


      // job titles
      {
        path: 'job-titles',
        loadComponent: () => import('./components/OD/Job-Titles/all-job-titles/all-job-titles.component').then(m => m.AllJobTitlesComponent),
        title: 'Job Titles'
      },
    ]
  },



];
