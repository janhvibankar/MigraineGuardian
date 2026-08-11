import {
  LayoutDashboard,
  CalendarCheck,
  Sparkles,
  BarChart3,
  FileText,
  MessageSquare,
  Bot,
  Activity,
  ClipboardList,
  User,
  Settings,
  LogOut,
  MoreHorizontal,
} from 'lucide-react';
import { ROUTES } from '../utils/constants';

export const PUBLIC_NAV_ITEMS = [
  { label: 'Overview', href: ROUTES.HOME },
  { label: 'How It Works', href: ROUTES.HOW_IT_WORKS },
  { label: 'PSS Assessment', href: ROUTES.PSS_ASSESSMENT },
];

export const PRIMARY_NAV_ITEMS = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: LayoutDashboard,
    badge: null,
  },
  {
    label: 'Daily Check-in',
    path: ROUTES.DAILY_CHECKIN,
    icon: CalendarCheck,
    badge: 'Today',
    badgeColor: 'sage',
  },
  {
    label: 'Insights',
    path: ROUTES.INSIGHTS,
    icon: Sparkles,
    badge: null,
  },
  {
    label: 'Analytics',
    path: ROUTES.ANALYTICS,
    icon: BarChart3,
    badge: null,
  },
  {
    label: 'Reports',
    path: ROUTES.REPORTS,
    icon: FileText,
    badge: null,
  },
  {
    label: 'MigraineGuardian Chat',
    path: ROUTES.CHAT,
    icon: Bot,
    badge: null,
  },
  {
    label: 'Risk Forecast',
    path: ROUTES.RISK_ANALYSIS,
    icon: Activity,
    badge: '18%',
    badgeColor: 'teal',
  },
  {
    label: 'PSS Stress Scale',
    path: ROUTES.PSS_ASSESSMENT,
    icon: ClipboardList,
    badge: null,
  },
];

export const SECONDARY_NAV_ITEMS = [
  {
    label: 'Profile',
    path: ROUTES.PROFILE,
    icon: User,
  },
  {
    label: 'Settings',
    path: ROUTES.SETTINGS,
    icon: Settings,
  },
];

// Mobile prioritized items
export const MOBILE_PRIMARY_NAV = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Check-in', path: ROUTES.DAILY_CHECKIN, icon: CalendarCheck },
  { label: 'Insights', path: ROUTES.INSIGHTS, icon: Sparkles },
  { label: 'Chat', path: ROUTES.CHAT, icon: Bot },
];

// Map paths to clear human-readable page titles for TopBar
export const ROUTE_PAGE_TITLES = {
  [ROUTES.DASHBOARD]: 'Dashboard',
  [ROUTES.DAILY_CHECKIN]: 'Daily Micro Check-in',
  [ROUTES.INSIGHTS]: 'Patterns & Insights',
  [ROUTES.ANALYTICS]: 'Analytics & Trends',
  [ROUTES.REPORTS]: 'Clinical Reports & Summaries',
  [ROUTES.CHAT]: 'MigraineGuardian Companion',
  [ROUTES.RISK_ANALYSIS]: 'Risk Horizon & Factors',
  [ROUTES.PSS_ASSESSMENT]: 'PSS-10 Stress Scale',
  [ROUTES.PROFILE]: 'Personal Health Profile',
  [ROUTES.SETTINGS]: 'Settings & Preferences',
};
