export interface CreateEmployeeRequest {
  request_data: {
    main_information: {
      code?: string;
      name: string;
      gender: number; // 1 - Male, 2 - Female
      mobile: {
        country_id: number;
        number: number;
      };
      personal_email: string;
      marital_status: number;
      date_of_birth: string;
      address: string;
    };
    job_details: {
      branch_id: number;
      department_id: number;
      section_id?: number;
      job_title_id: number;
      work_schedule_id: number;
    };
    contract_details: {
      start_contract: string;
      contract_type: number; // 1 With End Date, 2 Without End Date
      contract_end_date?: string;
      employment_type: number; // 1 Full Time, 2 Part Time, 3 Per Hour
      work_mode: number; // 1 On Site, 2 Remote, 3 Hybrid
      days_on_site?: number;
      salary: number;
    };
  };
}

export interface CreateEmployeeResponse {
  success: boolean;
  message: string;
  data?: any;
}

// API Response Interfaces
export interface Employee {
  id: number;
  contact_info: {
    name: string;
    mobile: {
      country: {
        id: number;
        name: string;
        phone_prefix: string;
      };
      number: number;
    };
    email: string;
    date_of_birth: string;
    address: string;
    marital_status: {
      id: number;
      name: string;
    };
  };
  job_info: {
    branch: {
      id: number;
      name: string;
    };
    department: {
      id: number;
      name: string;
    };
    section: {
      id: number;
      name: string;
    } | null;
    job_title: {
      id: number;
      name: string;
      salary_ranges?: {
        per_hour: {
          status: boolean;
          maximum: string;
          minimum: string;
          currency: string;
        };
        full_time: {
          status: boolean;
          maximum: string;
          minimum: string;
          currency: string;
        };
        part_time: {
          status: boolean;
          maximum: string;
          minimum: string;
          currency: string;
        };
      };
    };
    work_schedule: {
      id: number;
      name: string;
    };
    start_contract: string;
    contract_type: {
      id: number;
      name: string;
    };
    end_contract: string | null;
    employment_type: {
      id: number;
      name: string;
    };
    work_mode: {
      id: number;
      name: string;
    };
    days_on_site: number;
    salary: number;
  };
  employee_active: string; // "Active" | "Inactive" | "Pending" | "Disabled"
  employee_status: string; // "New Employee" | "Employed" | etc.
  created_at: string;
  updated_at: string;
}

// Subscription related interfaces
export interface AllowedAction {
  name: string;
  count: number;
  status: boolean;
  infinity: boolean;
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

export interface EmployeesResponse {
  details: string;
  data: {
    subscription: Subscription;
    list_items: Employee[];
    total_items: number;
    page: string;
    total_pages: number;
  };
}

export interface EmployeeDetailResponse {
  details: string;
  data: {
    subscription: Subscription;
    object_info: Employee;
  };
}
