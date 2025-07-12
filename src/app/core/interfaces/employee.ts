export interface CreateEmployeeRequest {
  request_data: {
    main_information: {
      code?: string;
      full_name: string;
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
