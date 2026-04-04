// ============================================================
// FitConnect GraphQL TypeScript Types
// Auto-mapped from backend schema definitions
// ============================================================

// ===== ENUMS =====

export enum UserRoleEnum {
  STANDARD = 'standard',
  BOSS = 'boss',
  PREMIUM = 'premium',
  COACH = 'coach',
  SUPER_ADMIN = 'super_admin',
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
}

export enum ScheduleType {
  STANDARD = 'standard',
  SPARRING = 'sparring',
  FREE = 'free',
  CONDITIONING = 'conditioning',
  COMPETITION = 'competition',
}

export enum ScheduleState {
  AVAILABLE = 'available',
  CANCELLED = 'cancelled',
  FULL = 'full',
}

export enum SubscriptionStatus {
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  PAUSED = 'paused',
}

export enum Currency {
  EUR = 'eur',
  USD = 'usd',
}

export enum PlanInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum PlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum TransactionStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum TransactionType {
  CHARGE = 'charge',
  REFUND = 'refund',
  PAYMENT = 'payment',
  SUBSCRIPTION = 'subscription',
}

export enum PaymentMethodType {
  CARD = 'card',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
}

export enum PaymentMethodStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum NotificationType {
  MESSAGE = 'message',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
}

// ===== ENTITY TYPES =====

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
  pictureUrl?: PictureUrl | null;
  nickname: string;
  isActive?: boolean | null;
  isBlocked?: boolean | null;
  phoneNumber?: string | null;
  isVerified?: boolean | null;
  companies?: Company[] | null;
  contextRole?: UserRoleEnum | null;
  activeCompanyId?: string | null;
  isPending?: boolean | null;
  subscription?: unknown;
  permissions?: string[] | null;
  schedules?: Schedule[] | null;
  userWeights?: UserWeight[] | null;
}

export interface UserResumeResponse {
  id: string;
  nickname: string;
  pictureUrl?: PictureUrl | null;
  contextRole?: UserRoleEnum | null;
}

export interface Company {
  id: string;
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  logo?: PictureUrl | null;
  pictures?: PictureUrl[] | null;
  scheduleOptions?: ScheduleOptions | null;
  companyConfig?: CompanyConfig | null;
  amIPending?: boolean | null;
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
}

export interface Schedule {
  id: string;
  description?: string | null;
  title: string;
  age?: number | null;
  users?: User[] | null;
  created_at: string;
  updated_at: string;
  startDate: string;
  endDate: string;
  maxUsers: number;
  admin: User;
  state: ScheduleState;
  type: ScheduleType;
}

export interface ScheduleResume {
  id: string;
  startDate: string;
  maxUsers: number;
  state: ScheduleState;
  ocupancy: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  pictures?: PictureUrl[] | null;
}

export interface Plan {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  description: string;
  amount: number;
  currency: Currency;
  interval: PlanInterval;
  intervalCount?: number | null;
  trialPeriodDays?: number | null;
  status: PlanStatus;
  isActive: boolean;
  features: string[];
  subscriptions?: Subscription[] | null;
}

export interface Subscription {
  id: string;
  created_at: string;
  updated_at: string;
  user: { id: string };
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  transactions?: Transaction[] | null;
}

export interface Transaction {
  id: string;
  stripeChargeId?: string | null;
  stripePaymentId?: string | null;
  user?: User | null;
  paymentMethod?: PaymentMethod | null;
  type?: TransactionType | null;
  status?: TransactionStatus | null;
  formattedAmount?: number | null;
  currency?: Currency | null;
  description?: string | null;
  isSuccessful?: boolean | null;
  metadata?: unknown;
  created_at: string;
}

export interface StripeCustomer {
  id: string;
  created_at: string;
  updated_at: string;
  stripeCustomerId: string;
  user?: User | null;
  isActive?: boolean | null;
  defaultCurrency?: Currency | null;
}

export interface PaymentMethod {
  id: string;
  stripeCustomer: StripeCustomer;
  type?: PaymentMethodType | null;
  status?: PaymentMethodStatus | null;
  brand?: string | null;
  last4?: string | null;
  expiryMonth?: string | null;
  expiryYear?: string | null;
  country?: string | null;
  isDefault?: boolean | null;
  stripePaymentMethodId?: string | null;
}

export interface Poll {
  id: string;
  created_at: string;
  updated_at: string;
  endDate: string;
  title: string;
  options: string[];
  admin: User;
  pollVotes?: PollVote[] | null;
}

export interface PollVote {
  poll: { id: string };
  user: User;
  optionSelected: string;
}

export interface Message {
  id: string;
  created_at: string;
  text: string;
  isFixed?: boolean | null;
  fixedEndDate?: string | null;
  fixedAdmin?: UserResumeResponse | null;
  sender: UserResumeResponse;
  receiver?: UserResumeResponse | null;
  isForumMessage: boolean;
}

export interface Notification {
  id: string;
  created_at: string;
  updated_at: string;
  type: NotificationType;
  message: string;
  link: string;
  user: { id: string };
}

export interface Article {
  id: string;
  publishedAt: string;
  title: string;
  description: string;
  link: string;
  image: string;
}

export interface TrainingTask {
  id: string;
  content: string;
  user?: User | null;
  date?: string | null;
  repeat: boolean;
}

export interface UserWeight {
  id: string;
  weight: number;
  date: string;
  user: UserResumeResponse;
}

export interface AdminStats {
  users: {
    totalUsers: number;
    notActiveUsers: number;
    blockedUsers: number;
    newUsers: number;
    pendingUsers: number;
  };
  schedules: number;
  polls: number;
  plans: number;
  subscriptions: number;
  transactions: number;
  notifications: number;
}

export interface Tokens {
  token?: string | null;
  refreshToken?: string | null;
}

export interface Stats {
  total?: number | null;
  active?: number | null;
  expired?: number | null;
  hasDefault?: boolean | null;
  byBrand?: unknown;
}

// ===== RESPONSE TYPES =====

export interface BasicResponse {
  code: string;
  success: boolean;
  message: string;
}

export interface LoginResponse extends BasicResponse {
  user?: User | null;
  companies?: Company[] | null;
  tokens?: Tokens | null;
}

export interface MeResponse extends BasicResponse {
  user?: User | null;
  companies?: Company[] | null;
}

export interface UserResponse extends BasicResponse {
  user?: User | null;
  users?: User[] | null;
  groupBy?: { standard?: User[] | null; specialRoles?: User[] | null } | null;
}

export interface ProductResponse extends BasicResponse {
  product?: Product | null;
  products?: Product[] | null;
}

export interface CompanyResponse extends BasicResponse {
  company?: Company | null;
  companies?: Company[] | null;
}

export interface ScheduleResponse extends BasicResponse {
  schedule?: Schedule | null;
  schedules?: Schedule[] | null;
}

export interface ScheduleResumeResponse extends BasicResponse {
  schedulesResume?: ScheduleResume[] | null;
  scheduleOptions?: ScheduleOptions | null;
}

export interface ScheduleOptionsResponse extends BasicResponse {
  scheduleOptions?: ScheduleOptions | null;
}

export interface PlanResponse extends BasicResponse {
  plan?: Plan | null;
  plans?: Plan[] | null;
}

export interface SubscriptionResponse extends BasicResponse {
  subscription?: Subscription | null;
  subscriptions?: Subscription[] | null;
}

export interface TransactionResponse extends BasicResponse {
  transactions?: Transaction[] | null;
  transaction?: Transaction | null;
  summary?: unknown;
}

export interface PollResponse extends BasicResponse {
  poll?: Poll | null;
  polls?: Poll[] | null;
}

export interface MessageResponse extends BasicResponse {
  sms?: Message | null;
  conversations?: Message[][] | null;
  conversation?: { messages?: Message[][] | null; hasMore?: boolean | null } | null;
}

export interface AdminStatsResponse {
  code: string;
  success: boolean;
  message: string;
  stats?: AdminStats | null;
}

export interface PresignedUrlResponse extends BasicResponse {
  presignedUrl: string;
  key: string;
}

export interface StripeCustomerResponse extends BasicResponse {
  customers?: StripeCustomer[] | null;
  customer?: StripeCustomer | null;
}

export interface PaymentMethodResponse extends BasicResponse {
  paymentMethods?: PaymentMethod[] | null;
  paymentMethod?: PaymentMethod | null;
}

export interface SetupIntentResponse extends BasicResponse {
  clientSecret?: string | null;
  setupIntentId?: string | null;
}

export interface StatsResponse extends BasicResponse {
  stats?: Stats | null;
}

export interface NotificationResponse extends BasicResponse {
  notification?: Notification | null;
  notifications?: Notification[] | null;
}

// ===== INPUT TYPES =====

export interface CreateUserInput {
  email: string;
  nickname: string;
  password: string;
  role: UserRoleEnum;
}

export interface UpdateUserInput {
  id: string;
  name?: string | null;
  surname?: string | null;
  email: string;
  phoneNumber?: string | null;
  nickname: string;
  isBlocked?: boolean | null;
  role?: UserRoleEnum | null;
  activeCompanyId?: string | null;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
}

export interface CreateCompanyInput {
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
}

export interface CompanyDataInput {
  name?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  companyConfig?: CompanyConfigInput | null;
}

export interface CompanyConfigInput {
  pollsEnabled?: boolean | null;
  productsEnabled?: boolean | null;
  chatEnabled?: boolean | null;
  trainingEnabled?: boolean | null;
}

export interface ScheduleOptionsInput {
  maxActiveReservations?: number | null;
  maxAdvanceBookingDays?: number | null;
  sameDayBookingAllowed?: boolean | null;
  fullOpenHours?: number | null;
  bookingCutoffMinutes?: number | null;
  minBookingsRequired?: number | null;
}

export interface CreateScheduleInput {
  title: string;
  description: string;
  age?: number | null;
  type: ScheduleType;
  startHour: string;
  endHour: string;
  days: number[];
  repeat?: boolean | null;
  maxUsers: number;
  admin: string;
}

export interface CreatePlanInput {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  amount?: number | null;
  currency?: Currency | null;
  interval?: PlanInterval | null;
  intervalCount?: number | null;
  trialPeriodDays?: number | null;
  features?: string[] | null;
  status?: PlanStatus | null;
  metadata?: unknown;
}

export interface CreateSubscriptionInput {
  planId: string;
  userId: string;
  paymentMethodId?: string | null;
  trialPeriodDays?: number | null;
  quantity?: number | null;
  metadata?: unknown;
}

export interface UpdateSubscriptionInput {
  subscriptionId: string;
  planId: string;
  paymentMethodId?: string | null;
  quantity?: number | null;
  metadata?: unknown;
}

export interface CancelSubscriptionInput {
  subscriptionId?: string | null;
  cancelAtPeriodEnd?: boolean | null;
  cancellationReason?: string | null;
}

export interface CreatePollInput {
  title: string;
  options: string[];
  endDate: string;
}
export interface CreatePollVoteInput {
  pollId: string;
  option: number;
}
export interface PollFilter {
  since: string;
}

export interface CreateMessageInput {
  text: string;
  receiverId?: string | null;
  isFixed?: boolean | null;
  fixedDuration?: boolean | null;
  isForumMessage?: boolean | null;
}

export interface SendNotificationInput {
  title: string;
  body: string;
  forAll: boolean;
}

export interface CreateCustomerInput {
  userId: string;
  email?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
}

export interface UpdateCustomerInput {
  stripeCustomerId: string;
  email?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
}

export interface AttachPaymentMethodInput {
  paymentMethodId: string;
  stripeCustomerId: string;
  setAsDefault?: boolean | null;
}

export interface CreateChargeInput {
  userId: string;
  amount?: number | null;
  currency?: Currency | null;
  paymentMethodId?: string | null;
  description?: string | null;
  metadata?: unknown;
}

export interface RefundTransactionInput {
  transactionId: string;
  amount?: number | null;
  reason?: string | null;
  metadata?: unknown;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
