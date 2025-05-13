import { importProvidersFrom } from '@angular/core';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },

  // Auth layout
  {
    path: '',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'auth',
        children: [
          {
            path: '',
            redirectTo:'register',
            pathMatch: 'full'
          },
          {
            path: 'register',
            loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent),
            title: 'Register'
          },
          {
            path: 'login',
            loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
            title: 'Login',
          },
          {
            path: 'reset-password',
            loadComponent: () => import('./components/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
            title: 'Reset Password',
          },
          
        ]
      },

      
    ]
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
            redirectTo:'all-job-titles',
            pathMatch: 'full'
          },
          {
            path: 'all-job-titles',
            loadComponent: () => import('./components/OD/Job-Titles/all-job-titles/all-job-titles.component').then(m => m.AllJobTitlesComponent),
            title: 'Job Titles'
          },
          {
            path: 'view-job',
            loadComponent: () => import('./components/OD/Job-Titles/view-job/view-job.component').then(m => m.ViewJobComponent),
            title: 'View Job'
          },
          {
            path: 'create',
            loadComponent: () => import('./components/OD/Job-Titles/create-new-job-title/create-new-job-title.component').then(m => m.CreateNewJobTitleComponent),
            title: 'Create job'
          },
          {
            path: 'edit',
            loadComponent: () => import('./components/OD/Job-Titles/edit-job/edit-job.component').then(m => m.EditJobComponent),
            title: 'Edit job'
          },
        ]
      },

      // Organizational Chart
      {
        path: 'organizational-Chart',
        children: [
          {
            path: '',
            redirectTo:'chart',
            pathMatch: 'full'
          },
          {
            path: 'chart',
            loadComponent: () => import('./components/OD/Organizational-Chart/org-chart/org-chart.component').then(m => m.OrgChartComponent),
            title: 'Organizational Chart',
          },
        ]
      }
    ]
  },




  // settings layout
  {
    path: '',
    loadComponent: () => import('./layouts/settings/settings.component').then(m => m.SettingsComponent),
    children: [
      {
        path: 'settings',
        children: [
          {
            path: '',
            redirectTo:'profile-settings',
            pathMatch: 'full'
          },
          {
            path: 'profile-settings',
            loadComponent: () => import('./components/settings/profile-settings/profile-settings.component').then(m => m.ProfileSettingsComponent),
            title: 'Profile Settings'
          },
          {
            path: 'app-settings',
            loadComponent: () => import('./components/settings/app-settings/app-settings.component').then(m => m.AppSettingsComponent),
            title: 'App Settings'
          },
          {
            path: 'notifications-settings',
            loadComponent: () => import('./components/settings/notifications-settings/notifications-settings.component').then(m => m.NotificationsSettingsComponent),
            title: 'Notifications Settings'
          },
          {
            path: 'password-settings',
            loadComponent: () => import('./components/settings/password-settings/password-settings.component').then(m => m.PasswordSettingsComponent),
            title: 'Password Settings'
          },
          
        ]
      },

      
    ]
  },
  
];
