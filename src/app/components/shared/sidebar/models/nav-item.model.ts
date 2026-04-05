export interface NavItem {
  id: string;
  /** i18n lookup key – matches a key in sidebar.*.json under "items" */
  labelKey: string;
  /** English fallback label */
  label: string;
  route: string;
  /** Feature flag key in the features object – null means always visible */
  featureKey: string | null;
  /** URL fragment used for active-route matching; defaults to route when omitted */
  routePattern?: string;
  /** Full SVG markup string imported from icons/ */
  icon: string;
}
