import { gql } from '@apollo/client';

// ============================================================
// FRAGMENTS - Reusable field selections
// ============================================================

export const PICTURE_URL_FIELDS = gql`
  fragment PictureUrlFields on PictureUrl {
    id
    name
    url
  }
`;

export const USER_RESUME_FIELDS = gql`
  fragment UserResumeFields on UserResumeResponse {
    id
    nickname
    pictureUrl { ...PictureUrlFields }
    contextRole
  }
  ${PICTURE_URL_FIELDS}
`;

export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    surname
    email
    nickname
    isActive
    isBlocked
    isVerified
    phoneNumber
    contextRole
    activeCompanyId
    isPending
    permissions
    pictureUrl { ...PictureUrlFields }
  }
  ${PICTURE_URL_FIELDS}
`;

export const COMPANY_FIELDS = gql`
  fragment CompanyFields on Company {
    id
    name
    phoneNumber
    email
    address
    amIPending
    logo { ...PictureUrlFields }
    companyConfig {
      pollsEnabled
      productsEnabled
      chatEnabled
      trainingEnabled
    }
    scheduleOptions {
      id
      maxActiveReservations
      maxAdvanceBookingDays
      sameDayBookingAllowed
      fullOpenHours
      bookingCutoffMinutes
      minBookingsRequired
    }
  }
  ${PICTURE_URL_FIELDS}
`;

export const PRODUCT_FIELDS = gql`
  fragment ProductFields on Product {
    id
    name
    description
    price
    pictures { ...PictureUrlFields }
  }
  ${PICTURE_URL_FIELDS}
`;

export const SCHEDULE_FIELDS = gql`
  fragment ScheduleFields on Schedule {
    id
    title
    description
    age
    startDate
    endDate
    maxUsers
    state
    type
    created_at
    updated_at
    admin { id name surname nickname }
    users { id name surname nickname email pictureUrl { id name url } }
  }
`;

export const PLAN_FIELDS = gql`
  fragment PlanFields on Plan {
    id
    created_at
    updated_at
    name
    description
    amount
    currency
    interval
    intervalCount
    trialPeriodDays
    status
    isActive
    features
  }
`;

export const SUBSCRIPTION_FIELDS = gql`
  fragment SubscriptionFields on Subscription {
    id
    created_at
    updated_at
    user { id }
    status
    startDate
    endDate
  }
`;

export const TRANSACTION_FIELDS = gql`
  fragment TransactionFields on Transaction {
    id
    stripeChargeId
    stripePaymentId
    type
    status
    formattedAmount
    currency
    description
    isSuccessful
    metadata
    created_at
    user { id name surname email }
    paymentMethod { id brand last4 expiryMonth expiryYear }
  }
`;

export const PAYMENT_METHOD_FIELDS = gql`
  fragment PaymentMethodFields on PaymentMethod {
    id
    type
    status
    brand
    last4
    expiryMonth
    expiryYear
    country
    isDefault
    stripePaymentMethodId
    stripeCustomer { id stripeCustomerId }
  }
`;

export const POLL_FIELDS = gql`
  fragment PollFields on Poll {
    id
    created_at
    updated_at
    endDate
    title
    options
    admin { id name surname nickname }
    pollVotes { user { id nickname } optionSelected }
  }
`;

// ============================================================
// AUTH QUERIES & MUTATIONS
// ============================================================

export const LOGIN = gql`
  mutation Login($emailOrNickname: String!, $password: String!) {
    login(emailOrNickname: $emailOrNickname, password: $password) {
      code
      success
      message
      user { ...UserFields companies { ...CompanyFields } }
      companies { ...CompanyFields }
      tokens { token refreshToken }
    }
  }
  ${USER_FIELDS}
  ${COMPANY_FIELDS}
`;

export const ME = gql`
  query Me {
    me {
      code
      success
      message
      user { ...UserFields companies { ...CompanyFields } }
      companies { ...CompanyFields }
    }
  }
  ${USER_FIELDS}
  ${COMPANY_FIELDS}
`;

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export const UPDATE_PASSWORD = gql`
  mutation UpdatePassword($password: UpdatePasswordInput!) {
    updatePassword(password: $password) {
      code success message
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const LOGIN_WITH_GOOGLE = gql`
  mutation LoginWithGoogle($id_token: String!) {
    loginWithGoogle(id_token: $id_token) {
      code success message
      user { ...UserFields }
      companies { ...CompanyFields }
      tokens { token refreshToken }
    }
  }
  ${USER_FIELDS}
  ${COMPANY_FIELDS}
`;

export const REFRESH_ACCESS_TOKEN = gql`
  mutation RefreshAccessToken($inputToken: String!) {
    refreshAccessToken(inputToken: $inputToken) {
      code success message
      tokens { token refreshToken }
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const SELECT_COMPANY = gql`
  mutation SetActiveCompany($companyId: ID!) {
    setActiveCompany(companyId: $companyId) {
      code success message
      user { ...UserFields }
      companies { ...CompanyFields }
    }
  }
  ${USER_FIELDS}
  ${COMPANY_FIELDS}
`;

export const SEND_CHANGE_PASSWORD_EMAIL = gql`
  mutation SendChangePasswordEmail($email: String!) {
    sendChangePasswordEmail(email: $email) {
      code success message
    }
  }
`;

// ============================================================
// USER QUERIES & MUTATIONS
// ============================================================

export const GET_USERS = gql`
  query GetUsers($query: String, $page: Int, $roleFilter: [UserRoleEnum], $stateFilter: String, $filterMe: Boolean) {
    getUsers(query: $query, page: $page, roleFilter: $roleFilter, stateFilter: $stateFilter, filterMe: $filterMe) {
      code success message
      users { ...UserFields }
      groupBy {
        standard { ...UserFields }
        specialRoles { ...UserFields }
      }
    }
  }
  ${USER_FIELDS}
`;

export const FIND_USER = gql`
  query FindUser($id: ID!) {
    findUser(id: $id) {
      code success message
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const CREATE_USER = gql`
  mutation CreateUser($user: CreateUserInput!, $company: CreateCompanyInput) {
    createUser(user: $user, company: $company) {
      code success message
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($user: UpdateUserInput!) {
    updateUser(user: $user) {
      code success message
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const UPDATE_USER_PICTURE = gql`
  mutation UpdateUserPicture($picture: String!, $userId: String!) {
    updateUserPicture(picture: $picture, userId: $userId) {
      code success message
      user { ...UserFields }
    }
  }
  ${USER_FIELDS}
`;

export const GET_ADMIN_STATS = gql`
  query GetAdminStats {
    getAdminStats {
      code success message
      stats {
        users { totalUsers notActiveUsers blockedUsers newUsers pendingUsers }
        schedules
        polls
        plans
        subscriptions
        transactions
        notifications
      }
    }
  }
`;

// ============================================================
// PRODUCT QUERIES & MUTATIONS
// ============================================================

export const GET_PRODUCTS = gql`
  query GetProducts {
    getProducts {
      code success message
      products { ...ProductFields }
    }
  }
  ${PRODUCT_FIELDS}
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($product: CreateProductInput!) {
    createProduct(product: $product) {
      code success message
      product { ...ProductFields }
    }
  }
  ${PRODUCT_FIELDS}
`;

export const UPDATE_PRODUCT_PICTURE = gql`
  mutation UpdateProductPicture($imageName: String!, $productId: String!) {
    updateProductPicture(imageName: $imageName, productId: $productId) {
      code success message
      product { ...ProductFields }
    }
  }
  ${PRODUCT_FIELDS}
`;

export const REMOVE_PRODUCT = gql`
  mutation RemoveProduct($ids: [String]!) {
    removeProduct(ids: $ids) {
      code success message
    }
  }
`;

// ============================================================
// COMPANY QUERIES & MUTATIONS
// ============================================================

export const GET_COMPANIES = gql`
  query GetCompanies($companyId: ID, $page: Int, $query: String) {
    getCompanies(companyId: $companyId, page: $page, query: $query) {
      code success message
      company { ...CompanyFields }
      companies { ...CompanyFields }
    }
  }
  ${COMPANY_FIELDS}
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($company: CreateCompanyInput!) {
    createCompany(company: $company) {
      code success message
      company { ...CompanyFields }
    }
  }
  ${COMPANY_FIELDS}
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($companyId: ID!, $companyData: CompanyDataInput!, $scheduleOptions: ScheduleOptionsInput!) {
    updateCompany(companyId: $companyId, companyData: $companyData, scheduleOptions: $scheduleOptions) {
      code success message
      company { ...CompanyFields }
    }
  }
  ${COMPANY_FIELDS}
`;

export const UPDATE_COMPANY_LOGO = gql`
  mutation UpdateCompanyLogo($companyId: ID!, $picture: String!) {
    updateCompanyLogo(companyId: $companyId, picture: $picture) {
      code success message
      company { ...CompanyFields }
    }
  }
  ${COMPANY_FIELDS}
`;

export const REQUEST_JOIN_COMPANY = gql`
  mutation RequestJoinCompany($companyId: ID!) {
    requestJoinCompany(companyId: $companyId) {
      code success message
    }
  }
`;

export const ADMIT_USER_TO_COMPANY = gql`
  mutation AdmitUserToCompany($companyId: ID!, $userId: ID!) {
    admitUserToCompany(companyId: $companyId, userId: $userId) {
      code success message
    }
  }
`;

// ============================================================
// SCHEDULE QUERIES & MUTATIONS
// ============================================================

export const GET_SCHEDULES = gql`
  query GetSchedules($scheduleId: ID, $schedulesIds: [ID]) {
    getSchedules(scheduleId: $scheduleId, schedulesIds: $schedulesIds) {
      code success message
      schedule { ...ScheduleFields }
      schedules { ...ScheduleFields }
    }
  }
  ${SCHEDULE_FIELDS}
`;

export const GET_SCHEDULES_FROM_TODAY = gql`
  query GetSchedulesFromToday {
    getSchedulesFromToday {
      code success message
      schedules { ...ScheduleFields }
    }
  }
  ${SCHEDULE_FIELDS}
`;

export const GET_SCHEDULES_RANGE = gql`
  query GetSchedulesRange($startDate: String!, $endDate: String!, $mySchedules: Boolean) {
    getSchedulesRange(startDate: $startDate, endDate: $endDate, mySchedules: $mySchedules) {
      code success message
      schedules { ...ScheduleFields }
    }
  }
  ${SCHEDULE_FIELDS}
`;

export const GET_SCHEDULES_RESUME = gql`
  query GetSchedulesResume {
    getSchedulesResume {
      code success message
      schedulesResume { id startDate maxUsers state ocupancy }
      scheduleOptions { id maxActiveReservations maxAdvanceBookingDays sameDayBookingAllowed fullOpenHours bookingCutoffMinutes minBookingsRequired }
    }
  }
`;

export const GET_TODAY_SCHEDULES_RESUME = gql`
  query GetTodaySchedulesResume {
    getTodaySchedulesResume {
      code success message
      schedulesResume { id startDate maxUsers state ocupancy }
    }
  }
`;

export const GET_SCHEDULE_OPTIONS = gql`
  query GetScheduleOptions {
    getScheduleOptions {
      code success message
      scheduleOptions { id maxActiveReservations maxAdvanceBookingDays sameDayBookingAllowed fullOpenHours bookingCutoffMinutes minBookingsRequired }
    }
  }
`;

export const GET_SCHEDULES_STATS = gql`
  query GetSchedulesStats($month: Int!) {
    getSchedulesStats(month: $month) {
      code success message
      stats { dayAndTime ratio }
    }
  }
`;

export const GET_MONTHLY_SCHEDULES = gql`
  query GetMonthlySchedules($month: Int!, $startHour: String!) {
    getMonthlySchedules(month: $month, startHour: $startHour) {
      code success message
      schedules { ...ScheduleFields }
    }
  }
  ${SCHEDULE_FIELDS}
`;

export const GET_USER_SCHEDULES = gql`
  query GetUserSchedules($userId: ID, $past: Boolean) {
    getUserSchedules(userId: $userId, past: $past) {
      code success message
      schedules { ...ScheduleFields }
    }
  }
  ${SCHEDULE_FIELDS}
`;

export const CREATE_SCHEDULE = gql`
  mutation CreateSchedule($schedule: CreateScheduleInput!) {
    createSchedule(schedule: $schedule) {
      code success message
      schedule { ...ScheduleFields }
    }
  }
  ${SCHEDULE_FIELDS}
`;

export const REMOVE_SCHEDULE = gql`
  mutation RemoveSchedule($scheduleId: ID!) {
    removeSchedule(scheduleId: $scheduleId) {
      code success message
    }
  }
`;

export const CHANGE_SCHEDULE_STATUS = gql`
  mutation ChangeScheduleStatus($scheduleId: ID!) {
    changeScheduleStatus(scheduleId: $scheduleId) {
      code success message
      schedule { ...ScheduleFields }
    }
  }
  ${SCHEDULE_FIELDS}
`;

export const ADD_USER_TO_SCHEDULE = gql`
  mutation AddUserToSchedule($scheduleId: ID!) {
    addUserToSchedule(scheduleId: $scheduleId) {
      code success message
      schedule { ...ScheduleFields }
    }
  }
  ${SCHEDULE_FIELDS}
`;

export const REMOVE_USER_FROM_SCHEDULE = gql`
  mutation RemoveUserFromSchedule($scheduleId: ID!, $userId: ID) {
    removeUserFromSchedule(scheduleId: $scheduleId, userId: $userId) {
      code success message
      schedule { ...ScheduleFields }
    }
  }
  ${SCHEDULE_FIELDS}
`;

export const UPDATE_SCHEDULE_OPTIONS = gql`
  mutation UpdateScheduleOptions($scheduleOptions: UpdateScheduleOptionsInput!) {
    updateScheduleOptions(scheduleOptions: $scheduleOptions) {
      code success message
      scheduleOptions { id maxActiveReservations maxAdvanceBookingDays sameDayBookingAllowed fullOpenHours bookingCutoffMinutes minBookingsRequired }
    }
  }
`;

// ============================================================
// PLAN QUERIES & MUTATIONS
// ============================================================

export const LIST_PLANS = gql`
  query ListPlans($onlyActive: Boolean) {
    listPlans(onlyActive: $onlyActive) {
      code success message
      plans { ...PlanFields }
    }
  }
  ${PLAN_FIELDS}
`;

export const GET_PLAN = gql`
  query GetPlan($planId: ID) {
    getPlan(planId: $planId) {
      code success message
      plan { ...PlanFields subscriptions { ...SubscriptionFields } }
    }
  }
  ${PLAN_FIELDS}
  ${SUBSCRIPTION_FIELDS}
`;

export const CREATE_PLAN = gql`
  mutation CreatePlan($plan: CreatePlanInput!) {
    createPlan(plan: $plan) {
      code success message
      plan { ...PlanFields }
    }
  }
  ${PLAN_FIELDS}
`;

export const UPDATE_PLAN = gql`
  mutation UpdatePlan($plan: CreatePlanInput!) {
    updatePlan(plan: $plan) {
      code success message
      plan { ...PlanFields }
    }
  }
  ${PLAN_FIELDS}
`;

export const REMOVE_PLAN = gql`
  mutation RemovePlan($planId: ID!) {
    removePlan(planId: $planId) {
      code success message
    }
  }
`;

// ============================================================
// SUBSCRIPTION QUERIES & MUTATIONS
// ============================================================

export const GET_SUBSCRIPTION = gql`
  query GetSubscription($subscriptionId: ID!) {
    getSubscription(subscriptionId: $subscriptionId) {
      code success message
      subscription { ...SubscriptionFields transactions { ...TransactionFields } }
    }
  }
  ${SUBSCRIPTION_FIELDS}
  ${TRANSACTION_FIELDS}
`;

export const LIST_USER_SUBSCRIPTIONS = gql`
  query ListUserSubscriptions($userId: ID!) {
    listUserSubscriptions(userId: $userId) {
      code success message
      subscriptions { ...SubscriptionFields }
    }
  }
  ${SUBSCRIPTION_FIELDS}
`;

export const GET_ACTIVE_SUBSCRIPTION = gql`
  query GetActiveSubscription($userId: ID!) {
    getActiveSubscription(userId: $userId) {
      code success message
      subscription { ...SubscriptionFields }
    }
  }
  ${SUBSCRIPTION_FIELDS}
`;

export const CREATE_SUBSCRIPTION = gql`
  mutation CreateSubscription($subscription: CreateSubscriptionInput!) {
    createSubscription(subscription: $subscription) {
      code success message
      subscription { ...SubscriptionFields }
    }
  }
  ${SUBSCRIPTION_FIELDS}
`;

export const UPDATE_SUBSCRIPTION = gql`
  mutation UpdateSubscription($subscription: UpdateSubscriptionInput!) {
    updateSubscription(subscription: $subscription) {
      code success message
      subscription { ...SubscriptionFields }
    }
  }
  ${SUBSCRIPTION_FIELDS}
`;

export const CANCEL_SUBSCRIPTION = gql`
  mutation CancelSubscription($input: CancelSubscriptionInput) {
    cancelSubscription(input: $input) {
      code success message
      subscription { ...SubscriptionFields }
    }
  }
  ${SUBSCRIPTION_FIELDS}
`;

export const PAUSE_SUBSCRIPTION = gql`
  mutation PauseSubscription($subscriptionId: ID!) {
    pauseSubscription(subscriptionId: $subscriptionId) {
      code success message
      subscription { ...SubscriptionFields }
    }
  }
  ${SUBSCRIPTION_FIELDS}
`;

export const RESUME_SUBSCRIPTION = gql`
  mutation ResumeSubscription($subscriptionId: ID!) {
    resumeSubscription(subscriptionId: $subscriptionId) {
      code success message
      subscription { ...SubscriptionFields }
    }
  }
  ${SUBSCRIPTION_FIELDS}
`;

export const CHANGE_SUBSCRIPTION_PLAN = gql`
  mutation ChangeSubscriptionPlan($subscriptionId: ID!, $newPlanId: ID!) {
    changeSubscriptionPlan(subscriptionId: $subscriptionId, newPlanId: $newPlanId) {
      code success message
      subscription { ...SubscriptionFields }
    }
  }
  ${SUBSCRIPTION_FIELDS}
`;

// ============================================================
// STRIPE CUSTOMER QUERIES & MUTATIONS
// ============================================================

export const GET_CUSTOMER = gql`
  query GetCustomer($stripeCustomerId: ID!) {
    getCustomer(stripeCustomerId: $stripeCustomerId) {
      code success message
      customer { id created_at updated_at stripeCustomerId user { id name email } isActive defaultCurrency }
    }
  }
`;

export const GET_CUSTOMER_BY_USER_ID = gql`
  query GetCustomerByUserId($userId: ID!) {
    getCustomerByUserId(userId: $userId) {
      code success message
      customer { id created_at updated_at stripeCustomerId user { id name email } isActive defaultCurrency }
    }
  }
`;

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($customer: CreateCustomerInput!) {
    createCustomer(customer: $customer) {
      code success message
      customer { id stripeCustomerId isActive }
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($customer: UpdateCustomerInput!) {
    updateCustomer(customer: $customer) {
      code success message
      customer { id stripeCustomerId isActive }
    }
  }
`;

export const DEACTIVATE_CUSTOMER = gql`
  mutation DeactivateCustomer($stripeCustomerId: ID!) {
    deactivateCustomer(stripeCustomerId: $stripeCustomerId) {
      code success message
    }
  }
`;

// ============================================================
// PAYMENT METHOD QUERIES & MUTATIONS
// ============================================================

export const LIST_USER_PAYMENT_METHODS = gql`
  query ListUserPaymentMethods($userId: ID!) {
    listUserPaymentMethods(userId: $userId) {
      code success message
      paymentMethods { ...PaymentMethodFields }
    }
  }
  ${PAYMENT_METHOD_FIELDS}
`;

export const GET_PAYMENT_METHOD = gql`
  query GetPaymentMethod($stripePaymentMethodId: ID!) {
    getPaymentMethod(stripePaymentMethodId: $stripePaymentMethodId) {
      code success message
      paymentMethod { ...PaymentMethodFields }
    }
  }
  ${PAYMENT_METHOD_FIELDS}
`;

export const GET_DEFAULT_PAYMENT_METHOD = gql`
  query GetDefaultPaymentMethod($stripeCustomerId: ID!) {
    getDefaultPaymentMethod(stripeCustomerId: $stripeCustomerId) {
      code success message
      paymentMethod { ...PaymentMethodFields }
    }
  }
  ${PAYMENT_METHOD_FIELDS}
`;

export const GET_USER_DEFAULT_PAYMENT_METHOD = gql`
  query GetUserDefaultPaymentMethod($userId: ID!) {
    getUserDefaultPaymentMethod(userId: $userId) {
      code success message
      paymentMethod { ...PaymentMethodFields }
    }
  }
  ${PAYMENT_METHOD_FIELDS}
`;

export const GET_PAYMENT_METHODS_STATS = gql`
  query GetPaymentMethodsStats($stripeCustomerId: ID!) {
    getPaymentMethodsStats(stripeCustomerId: $stripeCustomerId) {
      code success message
      stats { total active expired hasDefault byBrand }
    }
  }
`;

export const CREATE_SETUP_INTENT = gql`
  mutation CreateSetupIntent($stripeCustomerId: String!, $usage: String) {
    createSetupIntent(stripeCustomerId: $stripeCustomerId, usage: $usage) {
      code success message
      clientSecret
      setupIntentId
    }
  }
`;

export const CONFIRM_SETUP_INTENT = gql`
  mutation ConfirmSetupIntent($setupIntentId: String!, $setAsDefault: Boolean) {
    confirmSetupIntent(setupIntentId: $setupIntentId, setAsDefault: $setAsDefault) {
      code success message
      paymentMethod { ...PaymentMethodFields }
    }
  }
  ${PAYMENT_METHOD_FIELDS}
`;

export const ATTACH_PAYMENT_METHOD = gql`
  mutation AttachPaymentMethod($input: AttachPaymentMethodInput!) {
    attachPaymentMethod(input: $input) {
      code success message
      paymentMethod { ...PaymentMethodFields }
    }
  }
  ${PAYMENT_METHOD_FIELDS}
`;

export const REMOVE_PAYMENT_METHOD = gql`
  mutation RemovePaymentMethod($paymentId: ID!) {
    removePaymentMethod(paymentId: $paymentId) {
      code success message
    }
  }
`;

export const SET_DEFAULT_PAYMENT_METHOD = gql`
  mutation SetDefaultPaymentMethod($paymentMethodId: ID!) {
    setDefaultPaymentMethod(paymentMethodId: $paymentMethodId) {
      code success message
      paymentMethod { ...PaymentMethodFields }
    }
  }
  ${PAYMENT_METHOD_FIELDS}
`;

// ============================================================
// TRANSACTION QUERIES & MUTATIONS
// ============================================================

export const GET_TRANSACTION = gql`
  query GetTransaction($transactionId: ID!) {
    getTransaction(transactionId: $transactionId) {
      code success message
      transaction { ...TransactionFields }
    }
  }
  ${TRANSACTION_FIELDS}
`;

export const LIST_USER_TRANSACTIONS = gql`
  query ListUserTransactions($userId: ID!, $limit: Int) {
    listUserTransactions(userId: $userId, limit: $limit) {
      code success message
      transactions { ...TransactionFields }
    }
  }
  ${TRANSACTION_FIELDS}
`;

export const GET_TRANSACTIONS_BY_STATUS = gql`
  query GetTransactionsByStatus($userId: ID!, $status: TransactionStatus!, $limit: Int) {
    getTransactionsByStatus(userId: $userId, status: $status, limit: $limit) {
      code success message
      transactions { ...TransactionFields }
    }
  }
  ${TRANSACTION_FIELDS}
`;

export const GET_USER_TRANSACTIONS_SUMMARY = gql`
  query GetUserTransactionsSummary($userId: ID!) {
    getUserTransactionsSummary(userId: $userId) {
      code success message
      summary
    }
  }
`;

export const CREATE_CHARGE = gql`
  mutation CreateCharge($input: CreateChargeInput!) {
    createCharge(input: $input) {
      code success message
      transaction { ...TransactionFields }
    }
  }
  ${TRANSACTION_FIELDS}
`;

export const REFUND_TRANSACTION = gql`
  mutation RefundTransaction($input: RefundTransactionInput!) {
    refundTransaction(input: $input) {
      code success message
      transaction { ...TransactionFields }
    }
  }
  ${TRANSACTION_FIELDS}
`;

export const RETRY_FAILED_TRANSACTION = gql`
  mutation RetryFailedTransaction($transactionId: ID!) {
    retryFailedTransaction(transactionId: $transactionId) {
      code success message
      transaction { ...TransactionFields }
    }
  }
  ${TRANSACTION_FIELDS}
`;

export const MARK_TRANSACTION_AS_RECONCILED = gql`
  mutation MarkTransactionAsReconciled($transactionId: ID!) {
    markTransactionAsReconciled(transactionId: $transactionId) {
      code success message
      transaction { ...TransactionFields }
    }
  }
  ${TRANSACTION_FIELDS}
`;

// ============================================================
// POLL QUERIES & MUTATIONS
// ============================================================

export const GET_POLLS = gql`
  query GetPolls($pollId: ID, $filter: PollFilter) {
    getPolls(pollId: $pollId, filter: $filter) {
      code success message
      poll { ...PollFields }
      polls { ...PollFields }
    }
  }
  ${POLL_FIELDS}
`;

export const GET_ADMIN_POLLS = gql`
  query GetAdminPolls($id: ID) {
    getAdminPolls(id: $id) {
      code success message
      polls { ...PollFields }
    }
  }
  ${POLL_FIELDS}
`;

export const CREATE_POLL = gql`
  mutation CreatePoll($poll: CreatePollInput!) {
    createPoll(poll: $poll) {
      code success message
      poll { ...PollFields }
    }
  }
  ${POLL_FIELDS}
`;

export const REMOVE_POLLS = gql`
  mutation RemovePolls($ids: [String]!) {
    removePolls(ids: $ids) {
      code success message
    }
  }
`;

export const CREATE_OR_CHANGE_POLL_VOTE = gql`
  mutation CreateOrChangePollVote($vote: CreatePollVoteInput!) {
    createOrChangePollVote(vote: $vote) {
      code success message
      poll { ...PollFields }
    }
  }
  ${POLL_FIELDS}
`;

export const DELETE_POLL_VOTE = gql`
  mutation DeletePollVote($pollId: ID!) {
    deletePollVote(pollId: $pollId) {
      code success message
    }
  }
`;

// ============================================================
// MESSAGE QUERIES & MUTATIONS
// ============================================================

export const GET_CONVERSATION = gql`
  query GetConversation($otherUserId: ID, $page: Int, $limit: Int, $isForumMessage: Boolean) {
    getConversation(otherUserId: $otherUserId, page: $page, limit: $limit, isForumMessage: $isForumMessage) {
      code success message
      conversation {
        messages {
          id created_at text isFixed fixedEndDate isForumMessage
          sender { id nickname pictureUrl { id name url } contextRole }
          receiver { id nickname }
        }
        hasMore
      }
    }
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    getNotifications {
      code success message
      notifications { id created_at updated_at type message link }
    }
  }
`;

export const CREATE_MESSAGE = gql`
  mutation CreateMessage($message: CreateMessageInput!) {
    createMessage(message: $message) {
      code success message
    }
  }
`;

export const FIX_MESSAGE = gql`
  mutation FixMessage($messageId: ID!, $fixedEndDate: String!) {
    fixMessage(messageId: $messageId, fixedEndDate: $fixedEndDate) {
      code success message
    }
  }
`;

export const UNFIX_MESSAGE = gql`
  mutation UnfixMessage($messageId: ID!) {
    unfixMessage(messageId: $messageId) {
      code success message
    }
  }
`;

// ============================================================
// NOTIFICATION & PUSH TOKEN MUTATIONS
// ============================================================

export const SEND_NOTIFICATION = gql`
  mutation SendNotification($notification: SendNotificationInput!) {
    sendNotification(notification: $notification) {
      code success message
    }
  }
`;

export const REGISTER_TOKEN = gql`
  mutation RegisterToken($token: String!) {
    registerToken(token: $token) {
      code success message
    }
  }
`;

export const REMOVE_PUSH_TOKEN = gql`
  mutation RemovePushToken($token: String!) {
    removePushToken(token: $token) {
      code success message
    }
  }
`;

// ============================================================
// S3 / PRESIGNED URL
// ============================================================

export const GET_PRESIGNED_URL = gql`
  query GetPresignedUrl($key: String, $command: String) {
    getPresignedUrl(key: $key, command: $command) {
      code success message
      presignedUrl
      key
    }
  }
`;

// ============================================================
// TRAINING TASKS
// ============================================================

export const GET_TRAINING_TASKS = gql`
  query GetTrainingTasks($userId: String, $dateRange: [String]!) {
    getTrainingTasks(userId: $userId, dateRange: $dateRange) {
      code success message
      trainingTasks { id content date repeat user { id name nickname } }
    }
  }
`;

export const CREATE_TRAINING_TASK = gql`
  mutation CreateTrainingTask($trainingTask: CreateTrainingTaskInput!) {
    createTrainingTask(trainingTask: $trainingTask) {
      code success message
      trainingTask { id content date repeat }
    }
  }
`;

export const REMOVE_TRAINING_TASKS = gql`
  mutation RemoveTrainingTasks($ids: [ID]!) {
    removeTrainingTasks(ids: $ids) {
      code success message
    }
  }
`;

// ============================================================
// USER WEIGHTS
// ============================================================

export const GET_USER_WEIGHTS = gql`
  query GetUserWeights($userId: String, $dateRange: [String]) {
    getUserWeights(userId: $userId, dateRange: $dateRange) {
      code success message
      userWeights { id weight date user { id nickname } }
    }
  }
`;

export const ADD_USER_WEIGHT = gql`
  mutation AddUserWeight($userWeight: AddUserWeightInput!) {
    addUserWeight(userWeight: $userWeight) {
      code success message
      userWeight { id weight date }
    }
  }
`;

export const REMOVE_USER_WEIGHTS = gql`
  mutation RemoveUserWeights($ids: [ID]!) {
    removeUserWeights(ids: $ids) {
      code success message
    }
  }
`;

// ============================================================
// ARTICLES
// ============================================================

export const GET_ARTICLES = gql`
  query GetArticles($limit: Int!, $offset: Int!) {
    getArticles(limit: $limit, offset: $offset) {
      code success message
      articles { id publishedAt title description link image }
      hasMore
    }
  }
`;
