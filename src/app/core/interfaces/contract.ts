export interface Contract {
  id: number;
  contractNumber: string;
  startDate: string;
  endDate: string | null;
  employmentType: {
    id: number;
    name: string; // 'Full Time', 'Part Time', 'Per Hour'
  };
  contractType: {
    id: number;
    name: string; // 'Permanent', 'Fixed Term', 'Probation'
  };
  workMode: {
    id: number;
    name: string; // 'On Site', 'Remote', 'Hybrid'
  };
  salary: number;
  insuranceSalary: number;
  currency: string;
  status: 'Upcoming' | 'Active' | 'Cancelled' | 'Expired';
  createdAt: string;
  updatedAt: string;
  branch: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  };
  jobTitle: {
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
  success: boolean;
  data: {
    contracts: Contract[];
    total_items: number;
    page: number;
    total_pages: number;
  };
}

export interface ContractHistoryResponse {
  success: boolean;
  data: {
    history: ContractHistory[];
    total_items: number;
  };
}
