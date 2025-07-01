import { importProvidersFrom } from '@angular/core';
import { Routes } from '@angular/router';
import { GuestGuard } from './core/guards/guest.guard';
import { AuthGuard } from './core/guards/auth.guard';

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
    canActivate: [GuestGuard],
    children: [
      {
        path: 'auth',
        children: [
          {
            path: '',
            redirectTo: 'login',
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



  {
    path: '',
    loadComponent: () => import('./layouts/system-layout/system-layout.component').then(m => m.SystemLayoutComponent),
    canActivate: [AuthGuard],
    children: [


      // start OD layout
      {
        path: '',
        loadComponent: () => import('./layouts/od-layout/od-layout.component').then(m => m.OdLayoutComponent),
        // canActivate: [AuthGuard],
        children: [
          // Deparments routes
          {
            path: 'departments',
            children: [
              {
                path: '',
                redirectTo: 'all-departments',
                pathMatch: 'full'
              },
              {
                path: 'all-departments',
                loadComponent: () => import('./components/OD/Departments/all-departments/all-departments.component').then(m => m.AllDepartmentsComponent),
                title: 'Departments',
              },
              {
                path: 'view-department/:id',
                loadComponent: () => import('./components/OD/Departments/view-departments/view-departments.component').then(m => m.ViewDepartmentsComponent),
                title: 'View Department'
              },
              {
                path: 'create',
                loadComponent: () => import('./components/OD/Departments/create-departments/create-departments.component').then(m => m.CreateDepartmentsComponent),
                title: 'Create Department'
              },
              {
                path: 'edit/:id',
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
                redirectTo: 'all-branches',
                pathMatch: 'full'
              },
              {
                path: 'all-branches',
                loadComponent: () => import('./components/OD/Branches/all-branches/all-branches.component').then(m => m.AllBranchesComponent),
                title: 'Branches',
              },
              {
                path: 'view-branch/:id',
                loadComponent: () => import('./components/OD/Branches/view-branches/view-branches.component').then(m => m.ViewBranchesComponent),
                title: 'View Branch'
              },
              {
                path: 'create',
                loadComponent: () => import('./components/OD/Branches/create-new-branch/create-new-branch.component').then(m => m.CreateNewBranchComponent),
                title: 'Create Branch'
              },
              {
                path: 'edit/:id',
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
                redirectTo: 'all-job-titles',
                pathMatch: 'full'
              },
              {
                path: 'all-job-titles',
                loadComponent: () => import('./components/OD/Job-Titles/all-job-titles/all-job-titles.component').then(m => m.AllJobTitlesComponent),
                title: 'Job Titles'
              },
              {
                path: 'view-job/:id',
                loadComponent: () => import('./components/OD/Job-Titles/view-job/view-job.component').then(m => m.ViewJobComponent),
                title: 'View Job'
              },
              {
                path: 'create',
                loadComponent: () => import('./components/OD/Job-Titles/create-new-job-title/create-new-job-title.component').then(m => m.CreateNewJobTitleComponent),
                title: 'Create job'
              },
              {
                path: 'edit/:id',
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
                redirectTo: 'chart',
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


      // start Personnel layout
      {
        path: '',
        loadComponent: () => import('./layouts/Personnel-layout/Personnel-layout.component').then(m => m.PersonnelLayoutComponent),
        // canActivate: [AuthGuard],
        children: [
          // Dashboard routes
          {
            path: 'dashboard',
            children: [
              {
                path: '',
                redirectTo: 'personal-dashboard',
                pathMatch: 'full'
              },
              {
                path: 'personal-dashboard',
                loadComponent: () => import('./components/Personnel/Dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
                title: 'Personnel Dashboard',
              },
            ]
          },

          // Employees routes
          {
            path: 'employees',
            children: [
              {
                path: '',
                redirectTo: 'all-employees',
                pathMatch: 'full'
              },
              {
                path: 'all-employees',
                loadComponent: () => import('./components/Personnel/Employees/all-employees/all-employees.component').then(m => m.AllEmployeesComponent),
                title: 'All Employees',
              },
              {
                path: 'create-employee',
                loadComponent: () => import('./components/Personnel/Employees/create-employee/create-employee.component').then(m => m.CreateEmployeeComponent),
                title: 'Create Employees',
              },
              {
                path: 'view-employee/:id',
                loadComponent: () => import('./components/Personnel/Employees/view-employee/view-employee.component').then(m => m.ViewEmployeeComponent),
                title: 'View Employee',
              },
              {
                path: 'view-newjoiner/:id',
                loadComponent: () => import('./components/Personnel/Employees/view-new-joiner/view-new-joiner.component').then(m => m.ViewNewJoinerComponent),
                title: 'View New Joiner',
              },
              {
                path: 'edit-employee/:id',
                loadComponent: () => import('./components/Personnel/Employees/edit-employee/edit-employee.component').then(m => m.EditEmployeeComponent),
                title: 'Edit Employee',
              },
            ]
          },

          // Work Schedule routes
          {
            path: 'schedule',
            children: [
              {
                path: '',
                redirectTo: 'work-schedule',
                pathMatch: 'full'
              },
              {
                path: 'work-schedule',
                loadComponent: () => import('./components/Personnel/Work-Schedule/work-schedule/work-schedule.component').then(m => m.WorkScheduleComponent),
                title: 'Work Schedule',
              },
              {
                path: 'create-schedule',
                loadComponent: () => import('./components/Personnel/Work-Schedule/create-work-schedule/create-work-schedule.component').then(m => m.CreateWorkScheduleComponent),
                title: 'Create Work Schedule',
              },
              {
                path: 'view-schedule/:id',
                loadComponent: () => import('./components/Personnel/Work-Schedule/view-work-schedule/view-work-schedule.component').then(m => m.ViewWorkScheduleComponent),
                title: 'View Work Schedule',
              },
              {
                path: 'edit-schedule/:id',
                loadComponent: () => import('./components/Personnel/Work-Schedule/edit-work-schedule/edit-work-schedule.component').then(m => m.EditWorkScheduleComponent),
                title: 'Edit Work Schedule',
              },
            ]
          },

          // Leave Types routes
          {
            path: 'leave-types',
            children: [
              {
                path: '',
                redirectTo: 'all-leave-types',
                pathMatch: 'full'
              },
              {
                path: 'all-leave-types',
                loadComponent: () => import('./components/Personnel/Leave Types/all-leave-types/all-leave-types.component').then(m => m.AllLeaveTypesComponent),
                title: 'All Leave Types',
              },
              {
                path: 'create-leave-types',
                loadComponent: () => import('./components/Personnel/Leave Types/create-leave-type/create-leave-type.component').then(m => m.CreateLeaveTypeComponent),
                title: 'Create Leave Type',
              },
              {
                path: 'view-leave-types/:id',
                loadComponent: () => import('./components/Personnel/Leave Types/view-leave-type/view-leave-type.component').then(m => m.ViewLeaveTypeComponent),
                title: 'View Leave Type',
              },
              {
                path: 'update-leave-types/:id',
                loadComponent: () => import('./components/Personnel/Leave Types/update-leave-types/update-leave-types.component').then(m => m.UpdateLeaveTypesComponent),
                title: 'Update Leave Type',
              },
            ]
          },

          // Approval Workflow routes
          {
            path: 'workflow',
            children: [
              {
                path: '',
                redirectTo: 'all-workflows',
                pathMatch: 'full'
              },
              {
                path: 'all-workflows',
                loadComponent: () => import('./components/Personnel/Approval-Workflow/all-workflow/all-workflow.component').then(m => m.AllWorkflowComponent),
                title: 'All WorkFlows',
              },
              {
                path: 'create-workflows',
                loadComponent: () => import('./components/Personnel/Approval-Workflow/create-workflow/create-workflow.component').then(m => m.CreateWorkflowComponent),
                title: 'Create WorkFlows',
              },
              {
                path: 'view-workflows/:id',
                loadComponent: () => import('./components/Personnel/Approval-Workflow/view-workflow/view-workflow.component').then(m => m.ViewWorkflowComponent),
                title: 'View Workflows',
              },
              {
                path: 'update-workflows/:id',
                loadComponent: () => import('./components/Personnel/Approval-Workflow/update-workflow/update-workflow.component').then(m => m.UpdateWorkflowComponent),
                title: 'Update Workflows',
              },
            ]
          },

          // Approval Requests routes
          {
            path: 'requests',
            children: [
              {
                path: '',
                redirectTo: 'all-requests',
                pathMatch: 'full'
              },
              {
                path: 'all-requests',
                loadComponent: () => import('./components/Personnel/Approval-Requests/all-requests/all-requests.component').then(m => m.AllRequestsComponent),
                title: 'All Requests',
              },
              {
                path: 'view-requests/:id',
                loadComponent: () => import('./components/Personnel/Approval-Requests/view-assigned-request/view-assigned-request.component').then(m => m.ViewAssignedRequestComponent),
                title: 'View Requests',
              },
            ]
          },

          // Restricted Days routes
          {
            path: 'restricted-days',
            children: [
              {
                path: '',
                redirectTo: 'all-restricted-days',
                pathMatch: 'full'
              },
              {
                path: 'all-restricted-days',
                loadComponent: () => import('./components/Personnel/Restricted-Days/all-restricted-days/all-restricted-days.component').then(m => m.AllRestrictedDaysComponent),
                title: 'All Restricted Days',
              },
              {
                path: 'create-restricted-days',
                loadComponent: () => import('./components/Personnel/Restricted-Days/create-restricted-days/create-restricted-days.component').then(m => m.CreateRestrictedDaysComponent),
                title: 'Create Restricted Days',
              },
              {
                path: 'update-restricted-day/:id',
                loadComponent: () => import('./components/Personnel/Restricted-Days/update-restricted-days/update-restricted-days.component').then(m => m.UpdateRestrictedDaysComponent),
                title: 'Update Restricted Days',
              },
              {
                path: 'view-restricted-day/:id',
                loadComponent: () => import('./components/Personnel/Restricted-Days/view-restricted-days/view-restricted-days.component').then(m => m.ViewRestrictedDaysComponent),
                title: 'View Restricted Days',
              },
            ]
          },
        ]
      },


      // settings layout
      {
        path: '',
        loadComponent: () => import('./layouts/settings/settings.component').then(m => m.SettingsComponent),
        // canActivate: [AuthGuard],
        children: [
          {
            path: 'settings',
            children: [
              {
                path: '',
                redirectTo: 'profile-settings',
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


    ]
  },








];
