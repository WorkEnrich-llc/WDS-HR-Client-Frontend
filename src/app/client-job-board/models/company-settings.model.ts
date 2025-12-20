export interface SocialLinks {
  x?: string;
  website?: string;
  facebook?: string;
  linkedin?: string;
  instagram?: string;
}

export interface ObjectInfo {
  id: number;
  name: string;
  domain: string;
  number_employees: string;
  logo: string;
  title: string;
  description: string;
  social_links: SocialLinks;
  theme_color: string;
}

export interface CompanySettingsData {
  object_info: ObjectInfo;
}

export interface CompanySettingsResponse {
  details: string | null;
  data: CompanySettingsData;
}
