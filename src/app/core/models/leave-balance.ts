
export interface IEmployee {
   id: number;
   name: string;
}

export interface ILeave {
   id: number;
   name: string;
}

export interface ILeaveBalance {
   id: number;
   employee: IEmployee;
   leave: ILeave;
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
      page: number | string;
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

export interface IUpdateLeaveBalance {
   employee_id: number;
   leave_id: number;
   total: number;
}