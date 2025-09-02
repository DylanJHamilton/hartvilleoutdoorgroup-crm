// Reusable, app-wide user settings shared by Portal & Location dashboards.

export type Theme = 'system' | 'light' | 'dark';
export type Density = 'comfortable' | 'compact';
export type LandingPage =
  | 'portal-dashboard'
  | 'location-dashboard'
  | 'users'
  | 'stores'
  | 'inventory'
  | 'reports'
  | 'scheduling';

export interface UserSettings {
  theme: Theme;
  density: Density;
  defaultLocationId: string | null;
  defaultLanding: LandingPage;
  timeZone?: string | null;
  timeFormat?: 'h:mma' | 'HH:mm';
  dateFormat?: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
  notifyByEmail: boolean;
  notifyBySms: boolean;
  tableStriped: boolean;
  tableShowAvatars: boolean;
  showAdvancedPanels: boolean;
}
