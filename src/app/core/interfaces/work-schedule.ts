export interface WorkSchedule {
  id: number;
  code?: string;
  name: string;
  departments?: Array<{
    id: number;
    code?: string;
    name: string;
    is_active: boolean;
  }>;
  system?: {
    days: {
      friday: boolean;
      monday: boolean;
      sunday: boolean;
      tuesday: boolean;
      saturday: boolean;
      thursday: boolean;
      wednesday: boolean;
    };
    shift_hours: number;
    shift_range: {
      to: string;
      from: string;
    };
    employment_type: number;
    terms_and_rules?: string;
    work_schedule_type: number;
  };
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
