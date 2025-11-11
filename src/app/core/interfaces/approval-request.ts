export interface ApprovalRequestStatus {
  id: number;
  name: string;
}

export interface ContactInformation {
  id: number;
  name: string;
  phone: number;
  email: string;
}

export interface DirectManagerInfo {
  id?: number;
  name: string;
  email?: string;
  job_title?: string;
}

export interface JobInfo {
  branch: string;
  department: string;
  direct_manager: string | DirectManagerInfo;
  employment_type: string;
  job_title: string;
  section: string;
}

export interface RequestsInfo {
  code: string;
  created_at: string;
  id: number;
  name: string;
  updated_at: string;
}

export interface LeaveInfo {
  id: number | string;
  code: string;
  name: string;
}

export interface MissionInfo {
  id: number | string;
  description: string;
  mission_type: string;
  title: string;
  latitude: number;
  longitude: number;
}

export interface PermissionInfo {
  late_arrive: boolean;
  early_leave: boolean;
}

export interface TimesInfo {
  minutes_used?: number;
  hours_used?: number;
  total_minutes?: number;
}


export interface EmployeeInfo {
  id: number;
  name: string;
  job_title: string;
}

export interface ReasonInfo {
  status: ApprovalRequestStatus;
  note: string;
  mandatory: boolean;
}

export interface DateRange {
  from_date: string;
  to_date: string;
  total: number;
}

export interface DocumentUrl {
  image_url: string;
  generate_signed_url: string;
}

export interface ApprovalRequestItem {
  id: number;
  code: string;
  name: string;
  employee_info: EmployeeInfo;
  reason: ReasonInfo;
  dates: DateRange;
  document_url: DocumentUrl;
  status: ApprovalRequestStatus;
  contact_information: ContactInformation;
  job_info: JobInfo;
  request_info: RequestsInfo;
  created_at: string;
  updated_at: string;

  mission: MissionInfo
  work_type?: string;
  current_step?: string;
  permission?: PermissionInfo;
  leave?: LeaveInfo;
  times?: TimesInfo;
}

export interface AllowedAction {
  name: string;
  status: boolean;
  infinity: boolean;
  count: number;
}

export interface SubFeature {
  sub: {
    id: number;
    name: string;
  };
  is_support: boolean;
  allowed_actions: AllowedAction[];
}

export interface Feature {
  main: {
    id: number;
    name: string;
  };
  is_support: boolean;
  sub_list: SubFeature[];
}

export interface RenewalInfo {
  title: string;
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}

export interface Subscription {
  id: number;
  plan: string;
  period: number;
  status: number;
  payment_method: number;
  created_at: string;
  renewal_in: RenewalInfo;
  features: Feature[];
  code: string;
}

export interface ApprovalRequestsData {
  subscription: Subscription;
  list_items: ApprovalRequestItem[];
  total_items: number;
  page: string;
  total_pages: number;
}

export interface ApprovalRequestsResponse {
  details: string;
  data: ApprovalRequestsData;
}

export interface ApprovalRequestFilters {
  search?: string;
  employee_id?: number;
  leave_type?: string;
  from_date?: string;
  to_date?: string;
  created_from?: string;
  created_to?: string;
  status?: string;

  request_status?: string;
  request_type?: string;
  request_from_date?: string;
  request_to_date?: string;
  request_from_range?: string;
  request_to_range?: string;
}
// Detailed single approval request response
export interface ApprovalRequestDetailData {
  subscription: Subscription;
  object_info: ApprovalRequestItem;
}

export interface ApprovalRequestDetailResponse {
  details: string;
  data: ApprovalRequestDetailData;
}
