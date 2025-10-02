export interface AttendanceLog {
   employee_id?: number;
   date: string;
   start: string;
   end: string;
   id?: number;
}



export interface IAttendanceFilters {
   day_type?: string;
   offenses?: string;
   from_date?: string;
   to_date?: string;
   department_id?: number;
   per_page?: number;
   page?: number;
   search?: string;
}