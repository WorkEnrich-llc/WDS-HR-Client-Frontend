/**
 * Model for job listing API response
 */

export interface JobField {
  name: string;
  type: string;
  value: string | number | null;
  system: boolean;
  required: boolean;
}

export interface JobFieldSection {
  [key: string]: JobField[];
}

export interface JobFields {
  Attachments?: {
    files?: JobField[];
    links?: JobField[];
  };
  'Personal Details'?: {
    'Basic Info'?: JobField[];
    'Education Details'?: JobField[];
    'Address Information'?: JobField[];
  };
  'Professional Details'?: {
    'Salary Information'?: JobField[];
    'Current Job Information'?: JobField[];
  };
  [key: string]: any; // Allow for future sections
}

export interface NameIdObject {
  id: number;
  name: string;
}

export interface JobItem {
  id: number;
  company: NameIdObject | string;
  job_title: NameIdObject | string;
  job_level?: string;
  job_description?: string;
  job_requirements?: string;
  job_analysis?: string;
  branch: NameIdObject | string;
  employment_type: NameIdObject | string;
  work_schedule: NameIdObject | string;
  work_mode?: NameIdObject | string;
  days_on_site?: number;
  created_at: string;
  status: string;
  job_fields?: JobFields;
  recruiter_dynamic_fields?: JobFields;
}

export interface JobListingData {
  list_items: JobItem[];
  total_items: number;
  page: string;
  total_pages: number;
}

export interface JobListingResponse {
  details: string | null;
  data: JobListingData;
}

export interface JobDetailsData {
  object_info: JobItem;
}

export interface JobDetailsResponse {
  details: string | null;
  data: JobDetailsData;
}
