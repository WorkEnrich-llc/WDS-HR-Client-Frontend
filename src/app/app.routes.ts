import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'departments',
    pathMatch: 'full'
  },

  // start OD layout
  {
    path: '',
    loadComponent: () => import('./layouts/od-layout/od-layout.component').then(m => m.OdLayoutComponent),
    children: [
      // Deparments routes
      {
        path: 'departments',
        children: [
          {
            path: '',
            redirectTo:'all-departments',
            pathMatch: 'full'
          },
          {
            path: 'all-departments',
            loadComponent: () => import('./components/OD/Departments/all-departments/all-departments.component').then(m => m.AllDepartmentsComponent),
            title: 'Departments',
          },
          {
            path: 'view-department',
            loadComponent: () => import('./components/OD/Departments/view-departments/view-departments.component').then(m => m.ViewDepartmentsComponent),
            title: 'View Department'
          },
          {
            path: 'create',
            loadComponent: () => import('./components/OD/Departments/create-departments/create-departments.component').then(m => m.CreateDepartmentsComponent),
            title: 'Create Department'
          },
          {
            path: 'edit',
            loadComponent: () => import('./components/OD/Departments/edit-departments/edit-departments.component').then(m => m.EditDepartmentsComponent),
            title: 'Edit Department'
          },
        ]
      },

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
          {
            path: 'create',
            loadComponent: () => import('./components/OD/Branches/create-new-branch/create-new-branch.component').then(m => m.CreateNewBranchComponent),
            title: 'Create Branch'
          },
          {
            path: 'edit',
            loadComponent: () => import('./components/OD/Branches/edit-branch-info/edit-branch-info.component').then(m => m.EditBranchInfoComponent),
            title: 'Edit Branch'
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
