import {
  Armchair, Banknote, BellRing, Cake, CalendarCheck, ChartLine, ClipboardList, Coffee, CreditCard, FileText,
  HandCoins, IndianRupee, LayoutDashboard, ListChecks, Lock, type LucideIcon, Package, Plus, ReceiptText, Scissors,
  Settings, ShieldCheck, CalendarClock, Percent, FileSpreadsheet, KeyRound, Lightbulb, Globe, Smartphone, Sparkles, Store, Tag, TriangleAlert, User, UserCog, Users, Wallet, Clock,
} from "lucide-react";

/** Name → icon. Names are plain strings so server components can pass them to client components. */
export const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, bill: Plus, bills: ReceiptText, customers: Users, attendance: CalendarCheck,
  expenses: Wallet, purchases: Package, salary: HandCoins, reports: ChartLine, staff: UserCog, services: Scissors,
  seats: Armchair, settings: Settings, me: User, terms: FileText, privacy: Lock, consent: ShieldCheck,
  rupee: IndianRupee, cake: Cake, bell: BellRing, alert: TriangleAlert, list: ListChecks, store: Store, tag: Tag,
  calendar: CalendarClock, commission: Percent, slip: FileSpreadsheet, key: KeyRound, insight: Lightbulb, globe: Globe,
  clock: Clock, tea: Coffee, clipboard: ClipboardList, sparkles: Sparkles,
  Cash: Banknote, UPI: Smartphone, Card: CreditCard, Credit: ClipboardList,
};

export function Icon({ name, size = 16, className = "" }: { name: string; size?: number; className?: string }) {
  const C = ICONS[name] ?? Tag;
  return <C size={size} className={className} strokeWidth={1.9} aria-hidden />;
}

/** Picks an icon for a service category by its name. */
export function categoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (/hair|cut|colou?r|kera|smooth/.test(n)) return "services";
  if (/beard|shave/.test(n)) return "services";
  if (/face|skin|facial|tan|spa|massage/.test(n)) return "sparkles";
  if (/combo|package|bridal|groom/.test(n)) return "tag";
  return "tag";
}
