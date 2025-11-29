export interface CreateEmployeeRequest {
  request_data: {
    id?: number;

    picture: {
      generate_signed_url: string | null;
      image_url: string | null;
    }

    main_information: {
      profile_image?: string | null;
      rm_profile_img: boolean;
      code?: string;
      name_english?: string;
      name_arabic?: string;
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
      years_of_experience?: number | null;
      branch_id?: number | null;
      department_id?: number | null;
      section_id?: number | null;
      management_level?: number | null;
      job_title_id?: number | null;
      work_schedule_id?: number | null;
      activate_attendance_rules?: boolean;
    };
    contract_details?: {
      start_contract: string;
      contract_type: number; // 1 With End Date, 2 Without End Date
      contract_end_date?: string | null;
      employment_type: number; // 1 Full Time, 2 Part Time, 3 Per Hour
      work_mode: number; // 1 On Site, 2 Remote, 3 Hybrid
      days_on_site?: number | null;
      salary: number;
      insurance_salary?: number | null;
      gross_insurance_salary?: number | null;
      gross_insurance?: number | null;
      notice_period?: number | null;
      probation_period: boolean;
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
  code: string;
  profile_image?: string | null;
  rm_profile_img: boolean;
  picture: {
    generate_signed_url: string | null;
    image_url: string | null;
  }
  contact_info: {
    name: string;
    name_arabic: string;
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
    gender: {
      id: number;
      name: string;
    };
  };
  job_info: {
    years_of_experience: number;
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
          restrict: boolean;
          maximum: string;
          minimum: string;
          currency: string;
        };
        full_time: {
          status: boolean;
          restrict: boolean;
          maximum: string;
          minimum: string;
          currency: string;
        };
        part_time: {
          status: boolean;
          restrict: boolean;
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
    probation_period: boolean;
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
    management_level: {
      id: number;
      name: string;
    }
    days_on_site: number;
    salary: number;
    notice_period: number;
    insurance_salary?: number;
    gross_insurance?: number;
    activate_attendance_rules?: boolean;
    direct_manager?: {
      id: number;
      name: string;
    }
  };
  employee_active: string; // "Active" | "Inactive" | "Pending" | "Disabled"
  employee_status: string; // "New Employee" | "Employed" | etc.
  onboarding_list?: Array<{
    title: string;
    status: boolean;
  }>;
  created_at: string;
  updated_at: string;
  end_contract_sort: string;
  device?: {
    id: number;
    last_seen: string;
    is_main: boolean;
    device_ln: string | null;
    device_type: string | null;
    device_family: string | null;
    device_model: string | null;
    os_device: string | null;
    os_version: string | null;
    browser: string | null;
    ip_address: string | null;
    browser_version: string | null;
    fcm_token?: string | null;
    created_at: string;
    updated_at: string;
  };
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
