export interface AllowedAction {
  name: string;
  status: boolean;
  infinity: boolean;
  count: number;
}
export interface SubItem {
  sub: { id: number; name: string };
  is_support: boolean;
  allowed_actions: AllowedAction[];
}
export interface Feature {
  main: { id: number; name: string };
  is_support: boolean;
  sub_list: SubItem[];
}
export interface SubscriptionModel {
  id: number;
  plan: string;
  period: number;
  status: number;
  payment_method: number;
  created_at: string;
  renewal_in?: any;
  features?: Feature[];
  code?: string;
}