export interface ILeaveBalance {
   id: number;
   name?: string;
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

export interface ILeaveBalanceResponse {
   data: {
      list_items: ILeaveBalance[];
      total_items: number;
      page: number;
      total_pages: number;
   };
   details: string;
}

export interface ILeaveBalanceFilters {
   employee_id?: number;
   leave_id?: number;
   pageNumber?: number;
   page?: number;
   per_page?: number;
   search?: string;
}


