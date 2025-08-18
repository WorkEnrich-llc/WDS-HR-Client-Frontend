export interface Feature {
  main: {
    id: number;
    name: string;
  };
  is_support: boolean;
  sub_list: SubFeature[];
}

export interface SubFeature {
  sub: {
    id: number;
    name: string;
  };
  is_support: boolean;
  allowed_actions: AllowedAction[];
}

export interface AllowedAction {
  name: string;
  status: boolean;
  infinity: boolean;
  count: number;
}

export interface RenewalInfo {
  title: string;
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}

export interface Subscription {
  id: number;
  plan: string;
  period: number;
  status: number;
  payment_method: number;
  created_at: string;
  renewal_in: RenewalInfo;
  features: Feature[];
  code: string;
}

export interface PenaltyRule {
  index: number;
  value: number;
}

export interface GracePeriod {
  status: boolean;
  minutes: number;
}

export interface OvertimeValue {
  from_time: string;
  to_time: string;
  rate: number;
}

export interface OvertimeSettings {
  flat_rate: {
    status: boolean;
    value: number;
  };
  custom_hours: {
    status: boolean;
    value: OvertimeValue[];
  };
}

export interface WorkTypeSettings {
  lateness: PenaltyRule[];
  early_leave: PenaltyRule[];
  absence: PenaltyRule[];
  grace_period: GracePeriod;
  overtime?: OvertimeSettings;
}

export interface AttendanceRulesSettings {
  full_time: WorkTypeSettings;
  part_time: WorkTypeSettings;
}

export interface AttendanceRulesObject {
  id: number;
  settings: AttendanceRulesSettings;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRulesData {
  subscription: Subscription;
  object_info: AttendanceRulesObject;
}

export interface AttendanceRulesResponse {
  details: string;
  data: AttendanceRulesData;
}
