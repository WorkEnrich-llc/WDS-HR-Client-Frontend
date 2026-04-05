import { NavItem, NavSection } from './models';

import {
  OD_ICON, PERSONNEL_ICON, ATTENDANCE_ICON, RECRUITMENT_ICON, PAYROLL_ICON, ADMIN_SETTINGS_ICON,
  DEPARTMENTS_ICON, BRANCHES_ICON, JOB_TITLES_ICON, ORG_CHART_ICON, GOALS_ICON, DEPT_CHECK_ICON,
  CALENDAR_ICON, EMPLOYEES_ICON, WORKFLOW_ICON, REQUESTS_ICON, DELEGATION_ICON, ONBOARDING_ICON,
  ATTENDANCE_LOG_ICON, ATTENDANCE_RULES_ICON, RESTRICTED_DAYS_ICON, WORK_SCHEDULE_ICON,
  LEAVE_TYPES_ICON, LEAVE_BALANCE_ICON, PERMISSIONS_ICON, SUMMARY_REPORT_ICON,
  RECRUITMENT_CALENDAR_ICON, JOB_OPENINGS_ICON, ASSIGNMENTS_ICON, ARCHIVED_OPENINGS_ICON, JOB_BOARD_SETUP_ICON,
  PAYROLL_COMPONENTS_ICON, PAYROLL_RUNS_ICON, SALARY_PORTIONS_ICON, TAXES_ICON, BONUS_DEDUCTIONS_ICON,
  SYSTEM_CLOUD_ICON, ROLES_ICON, USERS_ICON, INTEGRATIONS_ICON, ANNOUNCEMENTS_ICON,
  COMPANY_POLICY_ICON, COMPANY_DOCUMENTS_ICON, EMAIL_SETTINGS_ICON, CUSTOM_FIELDS_ICON,
} from './icons';

export const NAV_SECTIONS: NavSection[] = [
  {
    collapseId: 'collapseOne',
    headingId: 'headingOne',
    labelKey: 'od',
    label: 'Operations Development',
    featureKeys: ['Departments', 'Branches', 'Job_Titles', 'Company_Chart', 'Goals', 'Departments_Checklist'],
    routePatterns: ['departments', 'branches', 'jobs', 'organizational-Chart', 'goals', 'dept-check'],
    icon: OD_ICON,
    items: [
      { id: 'departments',  labelKey: 'departments',      label: 'Departments',         route: '/departments',               featureKey: 'Departments',          icon: DEPARTMENTS_ICON },
      { id: 'branches',     labelKey: 'branches',         label: 'Branches',            route: '/branches',                  featureKey: 'Branches',             icon: BRANCHES_ICON },
      { id: 'job-titles',   labelKey: 'jobTitles',        label: 'Job Titles',          route: '/jobs',                      featureKey: 'Job_Titles',           icon: JOB_TITLES_ICON },
      { id: 'org-chart',    labelKey: 'orgStructure',     label: 'Org Structure',       route: '/organizational-Chart',      featureKey: 'Company_Chart',        icon: ORG_CHART_ICON },
      { id: 'goals',        labelKey: 'goals',            label: 'Goals',               route: '/goals',                     featureKey: 'Goals',                icon: GOALS_ICON },
      { id: 'dept-check',   labelKey: 'departmentChecks', label: 'Department Checks',   route: '/dept-check',                featureKey: 'Departments_Checklist',icon: DEPT_CHECK_ICON },
    ],
  },

  {
    collapseId: 'collapseTwo',
    headingId: 'headingTwo',
    labelKey: 'personnel',
    label: 'Personnel',
    featureKeys: ['Calendar', 'Employees', 'Workflow', 'Requests', 'Delegation', 'Onboarding'],
    routePatterns: ['personnel-calender', 'employees', 'workflow', 'requests', 'delegation', 'onboarding'],
    icon: PERSONNEL_ICON,
    items: [
      { id: 'personnel-calendar', labelKey: 'calendar',      label: 'Calendar',        route: '/personnel-calender', featureKey: 'Calendar',    routePattern: 'personnel-calender', icon: CALENDAR_ICON },
      { id: 'employees',          labelKey: 'employees',     label: 'Employees',       route: '/employees',          featureKey: 'Employees',                                       icon: EMPLOYEES_ICON },
      { id: 'workflow',           labelKey: 'workflow',      label: 'Workflow',        route: '/workflow',           featureKey: 'Workflow',                                        icon: WORKFLOW_ICON },
      { id: 'requests',           labelKey: 'requests',      label: 'Requests',        route: '/requests',           featureKey: 'Requests',                                        icon: REQUESTS_ICON },
      { id: 'delegation',         labelKey: 'delegation',    label: 'Delegation',      route: '/delegation',         featureKey: 'Delegation',                                      icon: DELEGATION_ICON },
      { id: 'onboarding',         labelKey: 'onboardingList',label: 'Onboarding List', route: '/onboarding',         featureKey: 'Onboarding',                                      icon: ONBOARDING_ICON },
    ],
  },

  {
    collapseId: 'collapseThree',
    headingId: 'headingThree',
    labelKey: 'attendance',
    label: 'Attendance',
    featureKeys: ['Attendance_Log', 'Attendance_Rules', 'Restricted', 'Work_Schedule', 'Leave_Types', 'Leave_Balance', 'Permissions_Control'],
    routePatterns: ['attendance', 'attendance-rules', 'restricted-days', 'schedule', 'leave-types', 'leave-balance', 'permissions', 'summary-report'],
    icon: ATTENDANCE_ICON,
    items: [
      { id: 'attendance-log',   labelKey: 'attendanceLog',   label: 'Attendance Log',   route: '/attendance/attendance-log', featureKey: 'Attendance_Log',       routePattern: 'attendance',icon: ATTENDANCE_LOG_ICON },
      { id: 'attendance-rules', labelKey: 'attendanceRules', label: 'Attendance Rules', route: '/attendance-rules',          featureKey: 'Attendance_Rules',                            icon: ATTENDANCE_RULES_ICON },
      { id: 'restricted-days',  labelKey: 'restrictedDays',  label: 'Restricted Days',  route: '/restricted-days',           featureKey: 'Restricted',                                  icon: RESTRICTED_DAYS_ICON },
      { id: 'work-schedule',    labelKey: 'workSchedule',    label: 'Work Schedule',    route: '/schedule',                  featureKey: 'Work_Schedule',        routePattern: 'schedule', icon: WORK_SCHEDULE_ICON },
      { id: 'leave-types',      labelKey: 'leaveTypes',      label: 'Leave Types',      route: '/leave-types',               featureKey: 'Leave_Types',                                 icon: LEAVE_TYPES_ICON },
      { id: 'leave-balance',    labelKey: 'leaveBalance',    label: 'Leave Balance',    route: '/leave-balance',             featureKey: 'Leave_Balance',                               icon: LEAVE_BALANCE_ICON },
      { id: 'permissions',      labelKey: 'permissions',     label: 'Permissions',      route: '/permissions',               featureKey: 'Permissions_Control',                         icon: PERMISSIONS_ICON },
      { id: 'summary-report',   labelKey: 'summaryReport',   label: 'Summary Report',   route: '/summary-report',            featureKey: 'Permissions_Control',                         icon: SUMMARY_REPORT_ICON },
    ],
  },

  {
    collapseId: 'collapseFour',
    headingId: 'headingFour',
    labelKey: 'recruitment',
    label: 'Recruitment',
    featureKeys: ['Calendar', 'Job_Openings', 'Archived_Openings', 'Job_Board_Setup'],
    routePatterns: ['calendar', 'job-openings', 'archived-openings', 'job-board-setup', 'assignments'],
    icon: RECRUITMENT_ICON,
    items: [
      { id: 'recruitment-calendar', labelKey: 'calendar',       label: 'Calendar',        route: '/calendar',          featureKey: 'Calendar',          icon: RECRUITMENT_CALENDAR_ICON },
      { id: 'job-openings',         labelKey: 'jobOpenings',    label: 'Job Openings',    route: '/job-openings',      featureKey: 'Job_Openings',      icon: JOB_OPENINGS_ICON },
      { id: 'assignments',          labelKey: 'assignments',    label: 'Assignments',     route: '/assignments',       featureKey: 'Job_Openings',      icon: ASSIGNMENTS_ICON },
      { id: 'archived-openings',    labelKey: 'archivedJobs',   label: 'Archived Jobs',   route: '/archived-openings', featureKey: 'Archived_Openings', icon: ARCHIVED_OPENINGS_ICON },
      { id: 'job-board-setup',      labelKey: 'jobBoardSetup',  label: 'Job Board Setup', route: '/job-board-setup',   featureKey: 'Job_Board_Setup',   icon: JOB_BOARD_SETUP_ICON },
    ],
  },

  {
    collapseId: 'collapseFive',
    headingId: 'headingFive',
    labelKey: 'payroll',
    label: 'Payroll',
    featureKeys: ['Payroll_Components', 'Payroll_Runs', 'Salary_Portions'],
    routePatterns: ['payroll-components', 'payroll-runs', 'salary-portions', 'taxes', 'bonus-deductions'],
    icon: PAYROLL_ICON,
    items: [
      { id: 'payroll-components', labelKey: 'payrollComponents', label: 'Payroll Components', route: '/payroll-components',                  featureKey: 'Payroll_Components', icon: PAYROLL_COMPONENTS_ICON },
      { id: 'payroll-runs',       labelKey: 'payrollRuns',       label: 'Payroll Runs',       route: '/payroll-runs',                        featureKey: null,                 icon: PAYROLL_RUNS_ICON },
      { id: 'salary-portions',    labelKey: 'salaryPortions',    label: 'Salary Portions',    route: '/salary-portions',                     featureKey: 'Salary_Portions',    icon: SALARY_PORTIONS_ICON },
      { id: 'taxes',              labelKey: 'taxes',             label: 'Taxes',              route: '/taxes/all-taxes',       routePattern: 'taxes',          featureKey: 'Salary_Portions',    icon: TAXES_ICON },
      { id: 'bonus-deductions',   labelKey: 'bonusDeductions',   label: 'Bonus & Deductions', route: '/bonus-deductions/all-bonus-deductions', routePattern: 'bonus-deductions', featureKey: null, icon: BONUS_DEDUCTIONS_ICON },
    ],
  },

  {
    collapseId: 'collapseSix',
    headingId: 'headingSix',
    labelKey: 'adminSettings',
    label: 'Admin Settings',
    featureKeys: ['Files', 'Roles', 'Users', 'Custom_Field', 'Company_Policy', 'Company_Documents', 'Email_Settings', 'External_Integration', 'Announcement'],
    routePatterns: ['cloud', 'roles', 'users', 'integrations', 'announcements', 'company-policy', 'company-documents', 'email-settings', 'custom-field'],
    icon: ADMIN_SETTINGS_ICON,
    items: [
      { id: 'system-cloud',       labelKey: 'systemCloud',       label: 'System Cloud',       route: '/cloud',             featureKey: 'Files',                icon: SYSTEM_CLOUD_ICON },
      { id: 'roles',              labelKey: 'roles',             label: 'Roles',              route: '/roles',             featureKey: 'Roles',                icon: ROLES_ICON },
      { id: 'users',              labelKey: 'users',             label: 'Users',              route: '/users',             featureKey: 'Users',                icon: USERS_ICON },
      { id: 'integrations',       labelKey: 'integrations',      label: 'Integrations',       route: '/integrations',      featureKey: 'External_Integration', icon: INTEGRATIONS_ICON },
      { id: 'announcements',      labelKey: 'announcements',     label: 'Announcements',      route: '/announcements',     featureKey: 'Announcement',         icon: ANNOUNCEMENTS_ICON },
      { id: 'company-policy',     labelKey: 'companyPolicy',     label: 'Company Policy',     route: '/company-policy',    featureKey: 'Company_Policy',       icon: COMPANY_POLICY_ICON },
      { id: 'company-documents',  labelKey: 'companyDocuments',  label: 'Company Documents',  route: '/company-documents', featureKey: 'Company_Documents',    icon: COMPANY_DOCUMENTS_ICON },
      { id: 'email-settings',     labelKey: 'emailSettings',     label: 'Email Settings',     route: '/email-settings',    featureKey: 'Email_Settings',       icon: EMAIL_SETTINGS_ICON },
      { id: 'custom-fields',      labelKey: 'customFields',      label: 'Custom Fields',      route: '/custom-fields',     featureKey: 'Custom_Field',         icon: CUSTOM_FIELDS_ICON },
    ],
  },
];

export type { NavItem, NavSection };
