export interface Department {
  id: number;
  code?: string;
  name: string;
  objectives?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  sections?: Section[];
}

export interface Section {
  id: number;
  code?: string;
  name: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
