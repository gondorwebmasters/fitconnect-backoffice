// Tipos espejo de server/src/graphql/schema (entities.ts, enums.ts, responses.ts)

export type UserRole = "standard" | "admin" | "coach";
export type ScheduleType = "standard" | "sparring" | "free" | "conditioning" | "competition";
export type ScheduleState = "available" | "cancelled";
export type Currency = "eur" | "usd" | "gbp";
export type PlanInterval = "day" | "week" | "month" | "year";
export type PlanStatus = "active" | "inactive" | "archived";
export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";
export type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void";
export type TransactionStatus =
  | "pending"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "partially_refunded";
export type TransactionType = "charge" | "refund" | "payment" | "subscription";

export interface BasicResponse {
  code: string;
  success: boolean;
  message: string;
}

export interface PictureUrl {
  id: string;
  name: string;
  url: string;
}

export interface User {
  id: string;
  name?: string | null;
  surname?: string | null;
  email: string;
  nickname: string;
  phoneNumber?: string | null;
  pictureUrl?: PictureUrl | null;
  isActive?: boolean | null;
  isBlocked?: boolean | null;
  isVerified?: boolean | null;
  isPending?: boolean | null;
  contextRole?: UserRole | null;
  isSuperAdmin?: boolean | null;
  activeCompanyId?: string | null;
  subscription?: unknown;
}

export interface Company {
  id: string;
  name: string;
  code?: string | null;
  phoneNumber?: string;
  email?: string;
  address?: string;
  logo?: PictureUrl | null;
  scheduleOptions?: ScheduleOptions | null;
  companyConfig?: CompanyConfig | null;
}

export interface CompanyConfig {
  pollsEnabled: boolean;
  productsEnabled: boolean;
  chatEnabled: boolean;
  trainingEnabled: boolean;
}

export interface ScheduleOptions {
  id: string;
  maxActiveReservations: number;
  maxAdvanceBookingDays: number;
  sameDayBookingAllowed: boolean;
  fullOpenHours: number;
  bookingCutoffMinutes: number;
  minBookingsRequired: number;
  quotaWarningThresholds: number[];
}

export interface Schedule {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  maxUsers: number;
  state: ScheduleState;
  type: ScheduleType;
  age?: number | null;
  users?: User[] | null;
  waitListUsers?: User[] | null;
  admin?: User | null;
  /**
   * Restricted Schedule: planes que admite la clase. Lista vacía = sin restricción
   * (abierta a todo el mundo). El back expone además `planAccess`, derivado por
   * llamante, que el backoffice no pide: aquí nadie se inscribe, solo se configura.
   */
  allowedPlans?: Plan[] | null;
}

export interface ScheduleProgrammed {
  id: string;
  title: string;
  description?: string | null;
  daysOfWeek?: number[] | null;
  startHour: string;
  endHour: string;
  maxUsers: number;
  type?: ScheduleType | null;
  admin?: User | null;
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  amount: number; // céntimos
  currency: Currency;
  interval: PlanInterval;
  intervalCount: number;
  trialPeriodDays?: number | null;
  /** Session Pack (Bono): nº de sesiones. null = ilimitado (plan temporal clásico). */
  sessionCount?: number | null;
  status: PlanStatus;
  isActive: boolean;
  features?: string[] | null;
  subscriptions?: Subscription[] | null;
  metadata?: { price?: number | string | null } & Record<string, unknown> | null;
}

export interface Subscription {
  id: string;
  created_at: string;
  user?: { id: string; name?: string | null; surname?: string | null; nickname?: string } | null;
  plan: Plan;
  status: SubscriptionStatus;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  canceledAt?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  nextBillingDate?: string | null;
  failedPaymentAttempts: number;
  isActive?: boolean | null;
  isInTrial?: boolean | null;
  isPastDue?: boolean | null;
  daysUntilRenewal?: number | null;
}

export interface SubscriptionHistoryEntry {
  event: string;
  actor: string;
  detail: string;
  timestamp: string;
}

export interface Invoice {
  id: string;
  created_at: string;
  invoiceNumber?: string | null;
  user: User;
  status: InvoiceStatus;
  total: number;
  amountPaid: number;
  amountRemaining: number;
  currency: Currency;
  dueDate?: string | null;
  paidAt?: string | null;
  description?: string | null;
  isPaid: boolean;
  isOverdue: boolean;
  formattedTotal: string;
}

export interface Transaction {
  id: string;
  created_at: string;
  externalTransactionId?: string | null;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  amountRefunded: number;
  currency: Currency;
  description?: string | null;
  failureReason?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  pictures?: PictureUrl[] | null;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountTag: string;
  originalPrice: number;
  newPrice: number;
  expiresAt: string;
  accentColor?: string | null;
  isHero: boolean;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

export interface Poll {
  id: string;
  created_at: string;
  endDate: string;
  title: string;
  options: string[];
  pollVotes?: { optionSelected: string; user: User }[] | null;
}

export interface UserStats {
  totalUsers: number;
  notActiveUsers: number;
  blockedUsers: number;
  newUsers: number;
  pendingUsers: number;
}

export interface AdminStats {
  users: UserStats;
  schedules: number;
  polls: number;
  plans: number;
  subscriptions: number;
  transactions: number;
  notifications: number;
}

export interface SchedulesStat {
  dayAndTime: string;
  ratio: number;
}

export interface SubscriptionsStat {
  planId: string;
  planName: string;
  count: number;
}
