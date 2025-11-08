import { importProvidersFrom } from '@angular/core';
import { Routes } from '@angular/router';
import { GuestGuard } from './core/guards/guest.guard';
import { AuthGuard } from './core/guards/auth.guard';
import { SubscriptionGuard } from './core/guards/subscription.guard';
import { invitationResolver } from './core/resolver/invitation-resolver.resolver';
import { PaginationStateService } from './core/services/pagination-state/pagination-state.service';

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
          {
            path: 'link-expired',
            loadComponent: () => import('./components/auth/link-expired/link-expired.component').then(m => m.LinkExpiredComponent),
            title: 'Link Expired',
          },
          {
            path: 'invitation/set-password',
            loadComponent: () => import('./components/activate-account/activate-account/activate-account.component').then(m => m.ActivateAccountComponent),
            title: 'Activate Your Account',
            resolve: { invitation: invitationResolver }
          },

        ]
      },


    ]
  },

  // Activate Acount layout
  {
    path: '',
    loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'activate',
        children: [
          {
            path: '',
            redirectTo: 'activate-account',
            pathMatch: 'full'
          },
          {
            path: 'activate-account',
            loadComponent: () => import('./components/activate-account/activate-account/activate-account.component').then(m => m.ActivateAccountComponent),
            title: 'Activate Your Account',
          },
        ]
      },


    ]
  },





  // system layout
  {
    path: '',
    loadComponent: () => import('./layouts/system-layout/system-layout.component').then(m => m.SystemLayoutComponent),
    canActivate: [AuthGuard],
    children: [


      // start Admin dashboard layout
      {
        path: '',
        loadComponent: () => import('./layouts/admin-layout/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),

        children: [
          // admin dashboard routes
          {
            path: '',
            children: [
              {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
              },
              {
                path: 'dashboard',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Dashboard' },
                loadComponent: () => import('./components/admin-dashboard/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
                title: 'Dashboard',
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
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Departments' },
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
                title: 'Create Department',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Departments', action: 'create' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./components/OD/Departments/edit-departments/edit-departments.component').then(m => m.EditDepartmentsComponent),
                title: 'Edit Department',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Departments', action: 'update' }
              },
            ]
          },

          // Branch routes
          {
            path: 'branches',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Branches' },
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
                title: 'Create Branch',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Branches', action: 'create' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./components/OD/Branches/edit-branch-info/edit-branch-info.component').then(m => m.EditBranchInfoComponent),
                title: 'Edit Branch',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Branches', action: 'update' }
              },
            ]
          },

          // Job routes
          {
            path: 'jobs',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Job_Titles' },
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
                title: 'Create job',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Job_Titles', action: 'create' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./components/OD/Job-Titles/edit-job/edit-job.component').then(m => m.EditJobComponent),
                title: 'Edit job',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Job_Titles', action: 'update' }
              },
            ]
          },

          // Organizational Chart
          {
            path: 'organizational-Chart',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Company_Chart' },
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
                children: [
                  {
                    path: '',
                    redirectTo: 'company-chart',
                    pathMatch: 'full'
                  },
                  // {
                  //   path: 'company-chart',
                  //   loadComponent: () => import('./components/OD/Organizational-Chart/components/company-chart/company-chart.component').then(m => m.CompanyChartComponent),
                  //   title: 'Company Chart'
                  // },
                  {
                    path: 'company-chart',
                    loadComponent: () => import('./components/OD/Organizational-Chart/components/company-test-chart/company-test-chart.component').then(m => m.CompanyTestChartComponent),
                    title: 'Company Chart'
                  },
                  {
                    path: 'organizational-chart',
                    loadComponent: () => import('./components/OD/Organizational-Chart/components/organization-test-chart/organization-test-chart.component').then(m => m.OrganizationTestChartComponent),
                    title: 'Organizational Chart'
                  },
                  // {
                  //   path: 'organizational-chart',
                  //   loadComponent: () => import('./components/OD/Organizational-Chart/components/organization-chart/organization-chart.component').then(m => m.OrganizationChartComponent),
                  //   title: 'organizational Chart'
                  // },
                ]
              },
            ]
          },

          // Goals routes
          {
            path: 'goals',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Goals' },
            children: [
              {
                path: '',
                redirectTo: 'all-goals',
                pathMatch: 'full'
              },
              {
                path: 'all-goals',
                loadComponent: () => import('./components/OD/Goals/all-goals/all-goals.component').then(m => m.AllGoalsComponent),
                title: 'Goals',
              },
              {
                path: 'view-goal/:id',
                loadComponent: () => import('./components/OD/Goals/view-goal/view-goal.component').then(m => m.ViewGoalComponent),
                title: 'View Goal'
              },
              {
                path: 'create',
                loadComponent: () => import('./components/OD/Goals/new-goal/new-goal.component').then(m => m.NewGoalComponent),
                title: 'Create Goal',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Goals', action: 'create' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./components/OD/Goals/edit-goal/edit-goal.component').then(m => m.EditGoalComponent),
                title: 'Edit Goal',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Goals', action: 'update' }
              },
            ]
          },

          // department checklists routes
          {
            path: 'dept-check',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Departments_Checklist' },
            children: [
              {
                path: '',
                redirectTo: 'view-checklist',
                pathMatch: 'full'
              },
              {
                path: 'view-checklist',
                loadComponent: () => import('./components/OD/department-checklist/department-checklist/department-checklist.component').then(m => m.DepartmentChecklistComponent),
                title: 'Department Checklists',
              },
              {
                path: 'edit-checklist',
                loadComponent: () => import('./components/OD/department-checklist/edit-department-checklists/edit-department-checklists.component').then(m => m.EditDepartmentChecklistsComponent),
                title: 'Edit Department Checklists',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Departments_Checklist', action: 'update' }
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
            path: 'personnel-calender',
            children: [
              {
                path: '',
                redirectTo: 'calender',
                pathMatch: 'full'
              },
              {
                path: 'calender',
                loadComponent: () => import('./components/Personnel/Dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
                title: 'Personnel Dashboard',
              },
            ]
          },

          // Employees routes
          {
            path: 'employees',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Employees' },
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
              // {
              //   path: 'create-employee',
              //   loadComponent: () => import('./components/Personnel/Employees/create-employee/create-employee.component').then(m => m.CreateEmployeeComponent),
              //   title: 'Create Employees',
              //   canActivate: [SubscriptionGuard],
              //   data: { feature: 'Employees', action: 'create' }
              // },
              {
                path: 'create-employee',
                loadComponent: () => import('./components/Personnel/Employees/manage-employee/manage-employee.component').then(m => m.ManageEmployeeComponent),
                title: 'Create Employees',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Employees', action: 'create' }
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
              // {
              //   path: 'edit-employee/:id',
              //   loadComponent: () => import('./components/Personnel/Employees/edit-employee/edit-employee.component').then(m => m.EditEmployeeComponent),
              //   title: 'Edit Employee',
              //   canActivate: [SubscriptionGuard],
              //   data: { feature: 'Employees', action: 'update' }
              // },
              {
                path: 'edit-employee/:id',
                loadComponent: () => import('./components/Personnel/Employees/manage-employee/manage-employee.component').then(m => m.ManageEmployeeComponent),
                title: 'Edit Employee',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Employees', action: 'update' }
              },
            ]
          },

          // Approval Workflow routes
          {
            path: 'workflow',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Workflow' },
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Workflow', action: 'create' }
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Workflow', action: 'update' }
              },
            ]
          },

          // Approval Requests routes
          {
            path: 'requests',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Requests' },
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
                path: 'create-request',
                loadComponent: () => import('./components/Personnel/Approval-Requests/create-request/create-request.component').then(m => m.CreateRequestComponent),
                title: 'Create New Request',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Requests', action: 'create' }
              },
              {
                path: 'view-requests/:id',
                loadComponent: () => import('./components/Personnel/Approval-Requests/view-assigned-request/view-assigned-request.component').then(m => m.ViewAssignedRequestComponent),
                title: 'View Requests',
              },
            ]
          },

          // onboarding routes
          {
            path: 'onboarding',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Onboarding' },
            children: [
              {
                path: '',
                redirectTo: 'view-onboarding',
                pathMatch: 'full'
              },
              {
                path: 'view-onboarding',
                loadComponent: () => import('./components/Personnel/onboarding/onboarding/onboarding.component').then(m => m.OnboardingComponent),
                title: 'Onboarding List',
              },
              {
                path: 'edit-onboarding',
                loadComponent: () => import('./components/Personnel/onboarding/edit-onboarding/edit-onboarding.component').then(m => m.EditOnboardingComponent),
                title: 'Onboarding List',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Onboarding', action: 'update' }
              },
            ]
          },

          // delegation routes
          {
            path: 'delegation',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Delegation' },
            children: [
              {
                path: '',
                redirectTo: 'all-delegation',
                pathMatch: 'full'
              },
              {
                path: 'all-delegation',
                loadComponent: () => import('./components/Personnel/Delegation/all-delegation/all-delegation.component').then(m => m.AllDelegationComponent),
                title: 'All Delegations',
              },
              {
                path: 'create',
                loadComponent: () => import('./components/Personnel/Delegation/manage-delegation/manage-delegation.component').then(m => m.ManageDelegationComponent),
                title: 'Create Delegation',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Delegation', action: 'create' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./components/Personnel/Delegation/manage-delegation/manage-delegation.component').then(m => m.ManageDelegationComponent),
                title: 'Edit Delegation',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Delegation', action: 'update' }
              },
            ]
          },

          // custom fields routes
          {
            path: 'custom-fields',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Custom_Field' },
            children: [
              {
                path: '',
                redirectTo: 'all-custom-fields',
                pathMatch: 'full'
              },
              {
                path: 'all-custom-fields',
                loadComponent: () => import('./components/Personnel/Custom-Fields/custom-fields.component').then(c => c.CustomFieldsComponent),
                title: 'All custom-fields',
              },
              {
                path: 'manage-custom-fields',
                loadComponent: () => import('./components/Personnel/Custom-Fields/manage-fields/manage-fields.component').then(c => c.ManageFieldsComponent),
                title: 'Manage Custom Fields',
                canActivate: [SubscriptionGuard],
                data: { action: 'create' }
              },
              {
                path: 'manage-custom-fields/:id',
                loadComponent: () => import('./components/Personnel/Custom-Fields/manage-fields/manage-fields.component').then(c => c.ManageFieldsComponent),
                title: 'Manage Custom Field',
                // canActivate: [SubscriptionGuard],
                data: { feature: 'Custom-Field', action: 'update' }
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

          // Attendance log routes
          {
            path: 'attendance',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Attendance_Log' },
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
              // {
              //   path: 'manage-attendance',
              //   loadComponent: () => import('./components/Attendance/attendance-log/manage-attendance/manage-attendance.component').then(c => c.ManageAttendanceComponent),
              //   title: 'Create Attendance Log',
              // },
              // {
              //   path: 'manage-attendance/:id',
              //   loadComponent: () => import('./components/Attendance/attendance-log/manage-attendance/manage-attendance.component').then(c => c.ManageAttendanceComponent),
              //   title: 'Edit Attendance Log',
              //   canActivate: [SubscriptionGuard],
              //   data: { feature: 'Attendance_Log', action: 'update' }
              // }
            ]
          },

          // attendance rules
          {
            path: 'attendance-rules',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Attendance_Rules' },
            children: [
              {
                path: '',
                redirectTo: 'attendance-rules',
                pathMatch: 'full'
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Attendance_Rules', action: 'update' }
              },
              {
                path: 'part-time',
                loadComponent: () => import('./components/Attendance/attendance-rules/components/edit-part-time/edit-part-time.component').then(m => m.EditPartTimeComponent),
                title: 'Edit Part Time',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Attendance_Rules', action: 'update' }
              },
            ]
          },

          // Restricted Days routes
          {
            path: 'restricted-days',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Restricted' },
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Restricted', action: 'create' }
              },
              {
                path: 'update-restricted-day/:id',
                loadComponent: () => import('./components/Attendance/Restricted-Days/update-restricted-days/update-restricted-days.component').then(m => m.UpdateRestrictedDaysComponent),
                title: 'Update Restricted Days',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Restricted', action: 'update' }
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
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Work_Schedule' },
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Work_Schedule', action: 'create' }
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Work_Schedule', action: 'update' }
              },
            ]
          },

          // Leave Types routes
          {
            path: 'leave-types',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Leave_Types' },
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Leave_Types', action: 'create' }
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Leave_Types', action: 'update' }
              },
            ]
          },

          // Leave balance routes
          {
            path: 'leave-balance',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Leave_Balance' },
            children: [
              {
                path: '',
                redirectTo: 'leave-balance',
                pathMatch: 'full'
              },
              {
                path: 'leave-balance',
                loadComponent: () => import('./components/Attendance/Leave Types/leave-balance/leave-balance.component').then(m => m.LeaveBalanceComponent),
                title: 'Leave Balance',
              },
            ]
          },

          // permission routes
          {
            path: 'permissions',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Permissions_Control' },
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Permissions_Control', action: 'update' }
              },
              {
                path: 'edit-late-arrive',
                loadComponent: () => import('./components/Attendance/permissions/edit-late-arrive/edit-late-arrive.component').then(m => m.EditLateArriveComponent),
                title: 'Edit Late Arrive',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Permissions_Control', action: 'update' }
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
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Job_Openings' },
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Job_Openings', action: 'create' },
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
                path: 'update-job-openings/:id',
                loadComponent: () => import('./components/Recruitment/job-openings/update-job-open/update-job-open.component').then(m => m.UpdateJobOpenComponent),
                title: 'Update Job Opening',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Job_Openings', action: 'update' },
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
                path: 'view-applicant-details/:applicationId',
                loadComponent: () => import('./components/Recruitment/applicant-detais/applicant-detais.component').then(m => m.ApplicantDetaisComponent),
                title: 'View Applicant Details',
              },
            ]
          },

          // Archived Openings routes
          {
            path: 'archived-openings',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Archived_Openings' },
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
                loadComponent: () => import('./components/Recruitment/archived-openings/view-archived-opening/view-archived-opening.component').then(m => m.ViewArchivedOpeningComponent),
                title: 'View Archived Opening',
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
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Payroll_Components' },
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Payroll_Components', action: 'create' }
              },
              {
                path: 'edit/:id',
                loadComponent: () => import('./components/Payroll/Payroll-components/create-payroll-component/create-payroll-component.component').then(m => m.CreatePayrollComponentComponent),
                title: 'Edit Payroll Components',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Payroll_Components', action: 'update' }
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
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Payroll_Runs' },
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
                canActivate: [SubscriptionGuard],
                data: { feature: 'Payroll_Runs', action: 'update' }
              },
              {
                path: 'view-employee-payroll/:id',
                loadComponent: () => import('./components/Payroll/Payroll-runs/view-employee/view-employee.component').then(m => m.ViewEmployeeComponent),
                title: 'View Employee',
              },

            ]
          },

          // Salary Portions routes
          {
            path: 'salary-portions',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Salary_Portions' },
            children: [
              {
                path: '',
                redirectTo: 'salary-portions',
                pathMatch: 'full'
              },
              {
                path: 'salary-portions',
                loadComponent: () => import('./components/Payroll/salary-portions/salary-potions/salary-potions.component').then(m => m.SalaryPotionsComponent),
                title: 'Salary Portions',
              },
              {
                path: 'edit-salary-portions',
                loadComponent: () => import('./components/Payroll/salary-portions/edit-salary-portions/edit-salary-portions.component').then(m => m.EditSalaryPortionsComponent),
                title: 'Edit Salary Portions',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Salary_Portions', action: 'update' }
              },

            ]
          },

        ]
      },


      // start Admin settings

      // system cloud layout
      {
        path: '',
        loadComponent: () => import('./layouts/cloud-layout/cloud-layout.component').then(m => m.CloudLayoutComponent),

        children: [
          {
            path: 'cloud',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Files' },
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

      // roles
      {
        path: '',
        loadComponent: () => import('./layouts/cloud-layout/cloud-layout.component').then(m => m.CloudLayoutComponent),

        children: [
          {
            path: 'roles',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Roles' },
            children: [
              {
                path: '',
                redirectTo: 'all-role',
                pathMatch: 'full'
              },
              {
                path: 'all-role',
                loadComponent: () =>
                  import(
                    './components/admin-settings/roles/roles/roles.component'
                  ).then(m => m.RolesComponent),
                title: 'Roles'
              },
              {
                path: 'add-role',
                loadComponent: () =>
                  import(
                    './components/admin-settings/roles/manage-role/manage-role.component'
                  ).then(m => m.ManageRoleComponent),
                title: 'Add Role',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Roles', action: 'create' }
              },
              {
                path: 'edit-role/:id',
                loadComponent: () =>
                  import(
                    './components/admin-settings/roles/manage-role/manage-role.component'
                  ).then(m => m.ManageRoleComponent),
                title: 'Edit Role',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Roles', action: 'update' }
              },
            ]
          }
        ]
      },

      // users
      {
        path: '',
        loadComponent: () =>
          import('./layouts/cloud-layout/cloud-layout.component').then(
            m => m.CloudLayoutComponent
          ),
        children: [
          {
            path: 'users',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'Users' },
            children: [
              {
                path: '',
                redirectTo: 'all-users',
                pathMatch: 'full'
              },
              {
                path: 'all-users',
                loadComponent: () =>
                  import(
                    './components/admin-settings/users/users/users.component'
                  ).then(m => m.UsersComponent),
                title: 'Users'
              },
              {
                path: 'add-user',
                loadComponent: () =>
                  import(
                    './components/admin-settings/users/manage-user/manage-user.component'
                  ).then(m => m.ManageUserComponent),
                title: 'Add User',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Users', action: 'create' }
              },
              {
                path: 'edit-user/:id',
                loadComponent: () =>
                  import(
                    './components/admin-settings/users/manage-user/manage-user.component'
                  ).then(m => m.ManageUserComponent),
                title: 'Edit User',
                canActivate: [SubscriptionGuard],
                data: { feature: 'Users', action: 'update' }
              },
              {
                path: 'view-user/:id',
                loadComponent: () =>
                  import(
                    './components/admin-settings/users/view-user/view-user.component'
                  ).then(m => m.ViewUserComponent),
                title: 'View User'
              }
            ]
          },
          {
            path: 'integrations',
            providers: [PaginationStateService],
            canActivate: [SubscriptionGuard],
            data: { feature: 'External_Integration' },
            loadComponent: () =>
              import(
                './components/admin-settings/integrations/integrations.component'
              ).then(m => m.IntegrationsComponent),
            title: 'Integrations'
          },
          {
            path: 'integrations/create-integration',
            canActivate: [SubscriptionGuard],
            data: { feature: 'External_Integration' },
            loadComponent: () =>
              import(
                './components/admin-settings/integrations/create-integration/create-integration.component'
              ).then(m => m.CreateIntegrationComponent),
            title: 'Create Integration Key'
          },
          {
            path: 'integrations/update-integration/:id',
            canActivate: [SubscriptionGuard],
            data: { feature: 'External_Integration', action: 'update' },
            loadComponent: () =>
              import(
                './components/admin-settings/integrations/update-integration/update-integration.component'
              ).then(m => m.UpdateIntegrationComponent),
            title: 'Update Integration Key'
          },
          {
            path: 'announcements',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Announcement' },
            loadComponent: () =>
              import('./components/admin-settings/announcements/announcements.component').then(m => m.AnnouncementsComponent),
            title: 'Announcements'
          },
          {
            path: 'announcements/view/:id',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Announcement' },
            loadComponent: () =>
              import('./components/admin-settings/announcements/view-announcement/view-announcement.component').then(m => m.ViewAnnouncementComponent),
            title: 'View Announcement'
          },
          {
            path: 'announcements/create',
            canActivate: [SubscriptionGuard],
            data: { feature: 'Announcement', action: 'create' },
            loadComponent: () =>
              import('./components/admin-settings/announcements/create-announcement/create-announcement.component').then(m => m.CreateAnnouncementComponent),
            title: 'Create Announcement'
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
              // {
              //   path: 'google-maps-demo',
              //   loadComponent: () => import('./components/shared/google-maps-demo/google-maps-demo.component').then(m => m.GoogleMapsDemoComponent),
              //   title: 'Google Maps Demo'
              // },

            ]
          },


        ]
      },


      // not authorized
      {
        path: 'not-authorized',
        loadComponent: () => import('./components/errors/not-authorized/not-authorized.component').then(m => m.NotAuthorizedComponent),
        title: 'Not Authorized'
      }
    ]
  },

  // Google Maps Demo (standalone route)
  {
    path: 'google-maps-demo',
    loadComponent: () => import('./components/shared/google-maps-demo/google-maps-demo.component').then(m => m.GoogleMapsDemoComponent),
    title: 'Google Maps Demo'
  },

  // Charts Demo (standalone route)
  {
    path: 'charts-demo',
    loadComponent: () => import('./components/charts-demo/charts-demo.component').then(m => m.ChartsDemoComponent),
    title: 'Charts Demo'
  },


  // page not font 404
  {
    path: '**',
    loadComponent: () => import('./components/errors/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found'
  }








];
