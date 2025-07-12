export interface JobTitle {
  id: number;
  code?: string;
  name: string;
  management_level?: number;
  job_level?: number;
  department?: {
    id: number;
    code?: string;
    name: string;
  } | null;
  section?: {
    id: number;
    code?: string;
    name: string;
  } | null;
  salary_ranges?: {
    per_hour?: {
      status: boolean;
      maximum: string | number;
      minimum: string | number;
      currency: string;
    };
    full_time?: {
      status: boolean;
      maximum: string | number;
      minimum: string | number;
      currency: string;
    };
    part_time?: {
      status: boolean;
      maximum: string | number;
      minimum: string | number;
      currency: string;
    };
  };
  assigns?: Array<{
    id: number;
    code?: string;
    name: string;
  }>;
  description?: string;
  requirements?: string[];
  analysis?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
