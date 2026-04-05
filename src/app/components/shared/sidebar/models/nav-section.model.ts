import { NavItem } from './nav-item.model';

export interface NavSection {
  /** Bootstrap collapse id, e.g. 'collapseOne' */
  collapseId: string;
  /** ARIA heading id, e.g. 'headingOne' */
  headingId: string;
  /** i18n lookup key – matches a key in sidebar.*.json under "sections" */
  labelKey: string;
  /** English fallback label */
  label: string;
  /** Section is shown when ANY of these feature keys is truthy */
  featureKeys: string[];
  /** Active-accordion detection: accordion opens if current route contains any of these */
  routePatterns: string[];
  /** Full SVG markup imported from icons/ */
  icon: string;
  items: NavItem[];
}
