import { gql } from "@apollo/client";

export const SUBSCRIPTION_FIELDS = gql`
  fragment SubscriptionFields on Subscription {
    id
    created_at
    status
    currentPeriodStart
    currentPeriodEnd
    canceledAt
    cancelAtPeriodEnd
    nextBillingDate
    failedPaymentAttempts
    isActive
    isInTrial
    isPastDue
    daysUntilRenewal
    creditsTotal
    creditsUsed
    remainingCredits
    plan {
      id
      name
      amount
      currency
      interval
      sessionCount
      metadata
    }
  }
`;

export const LIST_USER_SUBSCRIPTIONS = gql`
  ${SUBSCRIPTION_FIELDS}
  query ListUserSubscriptions($userId: ID!) {
    listUserSubscriptions(userId: $userId) {
      success
      message
      subscriptions {
        ...SubscriptionFields
      }
    }
  }
`;

export const GET_SUBSCRIPTION_HISTORY = gql`
  query GetSubscriptionHistory($subscriptionId: ID!) {
    getSubscriptionHistory(subscriptionId: $subscriptionId) {
      success
      message
      history {
        event
        actor
        detail
        timestamp
      }
    }
  }
`;

/**
 * El Entitlement del miembro: SOLO sus suscripciones vigentes. El back es la
 * autoridad sobre qué cuenta como vigente (ACTIVE/TRIALING con el periodo en
 * curso), así que el panel no lo deduce del status — una Suscripción Futura se
 * guarda ya como ACTIVE y NO está vigente. Ver ADR 0006.
 *
 * El campo singular `subscription` está deprecado en esta query y no se pide.
 */
export const GET_ACTIVE_SUBSCRIPTION = gql`
  ${SUBSCRIPTION_FIELDS}
  query GetActiveSubscription($userId: ID!) {
    getActiveSubscription(userId: $userId) {
      success
      message
      subscriptions {
        ...SubscriptionFields
      }
    }
  }
`;

export const CREATE_SUBSCRIPTION = gql`
  ${SUBSCRIPTION_FIELDS}
  mutation CreateSubscription($subscription: CreateSubscriptionInput!) {
    createSubscription(subscription: $subscription) {
      success
      message
      subscription {
        ...SubscriptionFields
      }
    }
  }
`;

/**
 * Cambio de plan: explícito y nombrando la suscripción a migrar. Ya no se
 * infiere de un createSubscription "otro plan, inicio hoy" — esa ruta ahora
 * SIEMPRE añade. Ver ADR 0006.
 */
export const CHANGE_PLAN = gql`
  ${SUBSCRIPTION_FIELDS}
  mutation ChangePlan($input: ChangePlanInput!) {
    changePlan(input: $input) {
      success
      message
      subscription {
        ...SubscriptionFields
      }
    }
  }
`;

export const CANCEL_SUBSCRIPTION = gql`
  ${SUBSCRIPTION_FIELDS}
  mutation CancelSubscription($input: CancelSubscriptionInput!) {
    cancelSubscription(input: $input) {
      success
      message
      subscription {
        ...SubscriptionFields
      }
    }
  }
`;

export const PAUSE_SUBSCRIPTION = gql`
  ${SUBSCRIPTION_FIELDS}
  mutation PauseSubscription($subscriptionId: ID!) {
    pauseSubscription(subscriptionId: $subscriptionId) {
      success
      message
      subscription {
        ...SubscriptionFields
      }
    }
  }
`;

export const RESUME_SUBSCRIPTION = gql`
  ${SUBSCRIPTION_FIELDS}
  mutation ResumeSubscription($subscriptionId: ID!) {
    resumeSubscription(subscriptionId: $subscriptionId) {
      success
      message
      subscription {
        ...SubscriptionFields
      }
    }
  }
`;

export const FORCE_RENEWAL = gql`
  ${SUBSCRIPTION_FIELDS}
  mutation ForceRenewal($subscriptionId: ID!) {
    forceRenewal(subscriptionId: $subscriptionId) {
      success
      message
      subscription {
        ...SubscriptionFields
      }
    }
  }
`;

export const EXTEND_SUBSCRIPTION_PERIOD = gql`
  ${SUBSCRIPTION_FIELDS}
  mutation ExtendSubscriptionPeriod($subscriptionId: ID!, $days: Int!, $reason: String!) {
    extendSubscriptionPeriod(subscriptionId: $subscriptionId, days: $days, reason: $reason) {
      success
      message
      subscription {
        ...SubscriptionFields
      }
    }
  }
`;

export const APPLY_SUBSCRIPTION_CREDIT = gql`
  ${SUBSCRIPTION_FIELDS}
  mutation ApplySubscriptionCredit($subscriptionId: ID!, $amountInCents: Int!, $reason: String!) {
    applySubscriptionCredit(subscriptionId: $subscriptionId, amountInCents: $amountInCents, reason: $reason) {
      success
      message
      subscription {
        ...SubscriptionFields
      }
    }
  }
`;

export const ADMIN_OVERRIDE_SUBSCRIPTION = gql`
  ${SUBSCRIPTION_FIELDS}
  mutation AdminOverrideSubscription($input: AdminOverrideSubscriptionInput!) {
    adminOverrideSubscription(input: $input) {
      success
      message
      subscription {
        ...SubscriptionFields
      }
    }
  }
`;
