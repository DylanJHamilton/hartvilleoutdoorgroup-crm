export interface NavItem {
  label: string;
  link:  Array<string | number>;
  icon?: string;
  route?: string;
  children?: NavItem[];
  roles?: Array<'OWNER'|'ADMIN'|'MANAGER'|'SALES'|'SERVICE'|'DELIVERY'|'INVENTORY'|'CS'>;
  exact?: boolean;
  external?: boolean;
}
