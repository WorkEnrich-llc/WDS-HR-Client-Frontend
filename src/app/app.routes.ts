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
            path: 'login',
            loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
            title: 'Login',
          },
          {
            path: 'register',
            loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent),
            title: 'Register'
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
        ]
      },

      // start Attendace layout
      {
        path: '',
        loadComponent: () => import('./layouts/attendance-layout/attendance-layout.component').then(m => m.AttendanceLayoutComponent),

        children: [

          // Attendance Rules routes
          {
            path: 'attendance',
            children: [
              {
                path: '',
                redirectTo: 'attendance-log',
                pathMatch: 'full'
              },
              {
                path: 'attendance-log',
                loadComponent: () => import('./components/Attendance/attendance-log/attendance-log/attendance-log.component').then(m => m.AttendanceLogComponent),
                title: 'Attendance Log',
              },
              {
                path: 'attendance-rules',
                loadComponent: () => import('./components/Attendance/attendance-rules/components/attendance-rule/attendance-rule.component').then(m => m.AttendanceRuleComponent),
                title: 'Attendance Rules',
              },
              {
                path: 'full-time',
                loadComponent: () => import('./components/Attendance/attendance-rules/components/edit-full-time/edit-full-time.component').then(m => m.EditFullTimeComponent),
                title: 'Edit Full Time',
              },
              {
                path: 'part-time',
                loadComponent: () => import('./components/Attendance/attendance-rules/components/edit-part-time/edit-part-time.component').then(m => m.EditPartTimeComponent),
                title: 'Edit Part Time',
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
                loadComponent: () => import('./components/Attendance/Restricted-Days/all-restricted-days/all-restricted-days.component').then(m => m.AllRestrictedDaysComponent),
                title: 'All Restricted Days',
              },
              {
                path: 'create-restricted-days',
                loadComponent: () => import('./components/Attendance/Restricted-Days/create-restricted-days/create-restricted-days.component').then(m => m.CreateRestrictedDaysComponent),
                title: 'Create Restricted Days',
              },
              {
                path: 'update-restricted-day/:id',
                loadComponent: () => import('./components/Attendance/Restricted-Days/update-restricted-days/update-restricted-days.component').then(m => m.UpdateRestrictedDaysComponent),
                title: 'Update Restricted Days',
              },
              {
                path: 'view-restricted-day/:id',
                loadComponent: () => import('./components/Attendance/Restricted-Days/view-restricted-days/view-restricted-days.component').then(m => m.ViewRestrictedDaysComponent),
                title: 'View Restricted Days',
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
                loadComponent: () => import('./components/Attendance/Work-Schedule/work-schedule/work-schedule.component').then(m => m.WorkScheduleComponent),
                title: 'Work Schedule',
              },
              {
                path: 'create-schedule',
                loadComponent: () => import('./components/Attendance/Work-Schedule/create-work-schedule/create-work-schedule.component').then(m => m.CreateWorkScheduleComponent),
                title: 'Create Work Schedule',
              },
              {
                path: 'view-schedule/:id',
                loadComponent: () => import('./components/Attendance/Work-Schedule/view-work-schedule/view-work-schedule.component').then(m => m.ViewWorkScheduleComponent),
                title: 'View Work Schedule',
              },
              {
                path: 'edit-schedule/:id',
                loadComponent: () => import('./components/Attendance/Work-Schedule/edit-work-schedule/edit-work-schedule.component').then(m => m.EditWorkScheduleComponent),
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
                loadComponent: () => import('./components/Attendance/Leave Types/all-leave-types/all-leave-types.component').then(m => m.AllLeaveTypesComponent),
                title: 'All Leave Types',
              },
              {
                path: 'create-leave-types',
                loadComponent: () => import('./components/Attendance/Leave Types/create-leave-type/create-leave-type.component').then(m => m.CreateLeaveTypeComponent),
                title: 'Create Leave Type',
              },
              {
                path: 'view-leave-types/:id',
                loadComponent: () => import('./components/Attendance/Leave Types/view-leave-type/view-leave-type.component').then(m => m.ViewLeaveTypeComponent),
                title: 'View Leave Type',
              },
              {
                path: 'update-leave-types/:id',
                loadComponent: () => import('./components/Attendance/Leave Types/update-leave-types/update-leave-types.component').then(m => m.UpdateLeaveTypesComponent),
                title: 'Update Leave Type',
              },
            ]
          },

          // permission routes
          {
            path: 'permissions',
            children: [
              {
                path: '',
                redirectTo: 'view-permissions',
                pathMatch: 'full'
              },
              {
                path: 'view-permissions',
                loadComponent: () => import('./components/Attendance/permissions/permission/permission.component').then(m => m.PermissionComponent),
                title: 'View Permissions',
              },
              {
                path: 'edit-early-leave',
                loadComponent: () => import('./components/Attendance/permissions/edit-early-leave/edit-early-leave.component').then(m => m.EditEarlyLeaveComponent),
                title: 'Edit Early Leave',
              },
              {
                path: 'edit-late-arrive',
                loadComponent: () => import('./components/Attendance/permissions/edit-late-arrive/edit-late-arrive.component').then(m => m.EditLateArriveComponent),
                title: 'Edit Late Arrive',
              },
            ]
          },

        ]
      },

      // start Recruitment layout
      {
        path: '',
        loadComponent: () => import('./layouts/recruitment-layout/recruitment-layout.component').then(m => m.RecruitmentLayoutComponent),

        children: [
          // Calendar routes
          {
            path: 'calendar',
            children: [
              {
                path: '',
                redirectTo: 'calender',
                pathMatch: 'full'
              },
              {
                path: 'calender',
                loadComponent: () => import('./components/Recruitment/calender/calendar/calendar.component').then(m => m.CalendarComponent),
                title: 'Calendar',
              },

            ]
          },

          // Job Openings routes
          {
            path: 'job-openings',
            children: [
              {
                path: '',
                redirectTo: 'all-job-openings',
                pathMatch: 'full'
              },
              {
                path: 'all-job-openings',
                loadComponent: () => import('./components/Recruitment/job-openings/all-job-openings/all-job-openings.component').then(m => m.AllJobOpeningsComponent),
                title: 'Job Openings',
              },
              {
                path: 'view-job-openings/:id',
                loadComponent: () => import('./components/Recruitment/job-openings/view-jop-open/view-jop-open.component').then(m => m.ViewJopOpenComponent),
                title: 'View Job Openings',
              },
              {
                path: 'create-job-openings',
                loadComponent: () => import('./components/Recruitment/job-openings/create-jop-open/create-jop-open.component').then(m => m.CreateJopOpenComponent),
                title: 'Create Job Openings',
                children: [
                  {
                    path: '',
                    redirectTo: 'main-information',
                    pathMatch: 'full'
                  },
                  {
                    path: 'main-information',
                    loadComponent: () => import('./components/Recruitment/job-openings/create-jop-open/main-info/main-info.component').then(m => m.MainInfoComponent),
                  },
                  {
                    path: 'required-details',
                    loadComponent: () => import('./components/Recruitment/job-openings/create-jop-open/required-details/required-details.component').then(m => m.RequiredDetailsComponent),
                  },
                  {
                    path: 'attachments',
                    loadComponent: () => import('./components/Recruitment/job-openings/create-jop-open/attachments/attachments.component').then(m => m.AttachmentsComponent),
                  },
                ]
              },
              {
                path: 'view-applicant-details/:id',
                loadComponent: () => import('./components/Recruitment/applicant-detais/applicant-detais.component').then(m => m.ApplicantDetaisComponent),
                title: 'View Applicant Details',
              },
            ]
          },

          // Archived Openings routes
          {
            path: 'archived-openings',
            children: [
              {
                path: '',
                redirectTo: 'all-archived-openings',
                pathMatch: 'full'
              },
              {
                path: 'all-archived-openings',
                loadComponent: () => import('./components/Recruitment/archived-openings/all-archived-openings/all-archived-openings.component').then(m => m.AllArchivedOpeningsComponent),
                title: 'Archived Openings',
              },
              {
                path: 'view-archived-openings/:id',
                loadComponent: () => import('./components/Recruitment/archived-openings/view-archived-openings/view-archived-openings.component').then(m => m.ViewArchivedOpeningsComponent),
                title: 'View Archived Openings',
              },
            ]
          },



        ]
      },

      // start Payroll layout
      {
        path: '',
        loadComponent: () => import('./layouts/payroll-layout/payroll-layout.component').then(m => m.PayrollLayoutComponent),

        children: [
          // payroll components routes
          {
            path: 'payroll-components',
            children: [
              {
                path: '',
                redirectTo: 'all-payroll-components',
                pathMatch: 'full'
              },
              {
                path: 'all-payroll-components',
                loadComponent: () => import('./components/Payroll/Payroll-components/all-payroll-components/all-payroll-components.component').then(m => m.AllPayrollComponentsComponent),
                title: 'All Payroll Components',
              },
              {
                path: 'create-payroll-components',
                loadComponent: () => import('./components/Payroll/Payroll-components/create-payroll-component/create-payroll-component.component').then(m => m.CreatePayrollComponentComponent),
                title: 'Create Payroll Components',
              },
              {
                path: 'edit-payroll-components/:id',
                loadComponent: () => import('./components/Payroll/Payroll-components/update-payroll-component/update-payroll-component.component').then(m => m.UpdatePayrollComponentComponent),
                title: 'Edit Payroll Components',
              },
              {
                path: 'view-payroll-components/:id',
                loadComponent: () => import('./components/Payroll/Payroll-components/view-payroll-component/view-payroll-component.component').then(m => m.ViewPayrollComponentComponent),
                title: 'View Payroll Components',
              },

            ]
          },

          // payroll runs routes
          {
            path: 'payroll-runs',
            children: [
              {
                path: '',
                redirectTo: 'payroll-runs',
                pathMatch: 'full'
              },
              {
                path: 'payroll-runs',
                loadComponent: () => import('./components/Payroll/Payroll-runs/all-payroll-runs/all-payroll-runs.component').then(m => m.AllPayrollRunsComponent),
                title: 'All Payroll Runs',
              },
              {
                path: 'view-payroll-run/:id',
                loadComponent: () => import('./components/Payroll/Payroll-runs/view-payroll-runs/view-payroll-runs.component').then(m => m.ViewPayrollRunsComponent),
                title: 'View Payroll Run',
              },
              {
                path: 'edit-payroll-run/:id',
                loadComponent: () => import('./components/Payroll/Payroll-runs/edit-employee-payroll/edit-employee-payroll.component').then(m => m.EditEmployeePayrollComponent),
                title: 'Edit Employee Payroll',
              },
              {
                path: 'view-employee-payroll/:id',
                loadComponent: () => import('./components/Payroll/Payroll-runs/view-employee/view-employee.component').then(m => m.ViewEmployeeComponent),
                title: 'View Employee',
              },

            ]
          },

        ]
      },

      // system cloud layout
      {
        path: '',
        loadComponent: () => import('./layouts/cloud-layout/cloud-layout.component').then(m => m.CloudLayoutComponent),

        children: [
          {
            path: 'cloud',
            children: [
              {
                path: '',
                redirectTo: 'cloud-system',
                pathMatch: 'full'
              },
              {
                path: 'cloud-system',
                loadComponent: () => import('./components/system-cloud/system-cloud/system-cloud.component').then(m => m.SystemCloudComponent),
                title: 'System Cloud'
              },
              {
                path: 'system-file/:id',
                loadComponent: () => import('./components/system-cloud/system_file/system-file.component').then(m => m.SystemFileComponent),
                title: 'System File'
              },

            ]
          },


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
              {
                path: 'google-maps-demo',
                loadComponent: () => import('./components/shared/google-maps-demo/google-maps-demo.component').then(m => m.GoogleMapsDemoComponent),
                title: 'Google Maps Demo'
              },

            ]
          },


        ]
      },


    ]
  },

  // Google Maps Demo (standalone route)
  {
    path: 'google-maps-demo',
    loadComponent: () => import('./components/shared/google-maps-demo/google-maps-demo.component').then(m => m.GoogleMapsDemoComponent),
    title: 'Google Maps Demo'
  },

  {
    path: '**',
    redirectTo: 'auth'
  }








];
