export interface Contract {
  id: number;
  expired: boolean;
  trial: boolean;
  start_contract: string;
  end_contract: string;
  salary: number;
  insurance_salary: number;
  status: 'Upcoming' | 'Active' | 'Cancelled' | 'Expired';
  created_at: string;
  created_by: string;
  
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
