export interface Contract {
  id: number;
  contractId: number;
  expired: boolean;
  trial: boolean;
  start_contract: string;
  end_contract: string;
  salary: number;
  insurance_salary: number;
  status: 'Upcoming' | 'Active' | 'Cancelled' | 'Expired' | 'Terminated' | 'Resigned' | 'Probation' | 'Resign' | 'Terminate';
  created_at: string;
  created_by: string;
  noticePeriod?: number;


  // Mapped properties for compatibility with existing UI
  contractNumber?: string;
  startDate?: string;
  endDate?: string;
  employmentType?: {
    id: number;
    name: string;
  };
  contractType?: {
    id: number;
    name: string;
  };
  workMode?: {
    id: number;
    name: string;
  };
  insuranceSalary?: number;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
  branch?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
  jobTitle?: {
    id: number;
    name: string;
  };

  // Additional data for terminated/resigned contracts
  terminationData?: {
    lastDay: string;
    reason: string;
  };
  resignationData?: {
    resignDate: string;
    noticePeriod: number;
    lastDay: string;
    reason: string;
  };
}

export interface ContractHistory {
  id: number;
  contractId: number;
  action: string;
  changedBy: string;
  changeDate: string;
  previousValue?: any;
  newValue?: any;
  reason?: string;
  adjustment_type?: string;
  created_at?: string;
  created_by?: string;
  end_contract?: string;
  start_contract?: string;
  notice_period?: string;
  salary?: string;
}

export interface ContractsResponse {
  details: string;
  data: {
    subscription?: any;
    list_items: Contract[];
  };
}

export interface ContractHistoryResponse {
  success: boolean;
  data: {
    history: ContractHistory[];
    total_items: number;
  };
}
// Interface for contract adjustments
export interface ContractAdjustment {
  id: number;
  adjustment_type: string;
  new_salary: number;
  start_date: string;
  created_at: string;
  created_by: string;
  end_contract: string;
  salary: string;

}

export interface ContractResignation {
  contract_id: number;
  last_date: string;
  resign_date: string;
  reason: string;

}

export interface ContractAdjustmentsResponse {
  details: string;
  data: {
    subscription?: any;
    // List of adjustments for the contract
    list_items: ContractAdjustment[];
    // Optional error handling info
    error_handling?: any[];
  };
}


export interface ContractResignationResponse {
  details: string;
  data: {
    subscription?: any;
    // List of adjustments for the contract
    list_items: ContractResignation[];
    // Optional error handling info
    error_handling?: any[];
  };
}


export interface EmployeeLeaveBalanceResponse {
  details: string;
  data: {
    subscription?: any;
    list_items: EmployeeLeaveBalance[];
    total_items: number;
    page: number;
    total_pages: number;
  };
}

export interface EmployeeLeaveBalance {
  id: number;
  leave: {
    id: number;
    name: string;
  };
  total: number;
  used: number;
  available: number;
  created_at: string;
  updated_at: string;
}

