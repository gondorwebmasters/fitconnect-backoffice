import { gql } from "@apollo/client";

export const PLAN_FIELDS = gql`
  fragment PlanFields on Plan {
    id
    name
    description
    amount
    currency
    interval
    intervalCount
    trialPeriodDays
    sessionCount
    status
    isActive
    features
    metadata
  }
`;

export const LIST_PLANS = gql`
  ${PLAN_FIELDS}
  query ListPlans($onlyActive: Boolean, $showGlobal: Boolean) {
    listPlans(onlyActive: $onlyActive, showGlobal: $showGlobal) {
      success
      message
      plans {
        ...PlanFields
      }
    }
  }
`;

export const GET_PLAN_WITH_SUBSCRIPTIONS = gql`
  ${PLAN_FIELDS}
  query GetPlan($planId: ID!) {
    getPlan(planId: $planId) {
      success
      message
      plan {
        ...PlanFields
        subscriptions {
          id
          created_at
          status
          currentPeriodEnd
          nextBillingDate
          failedPaymentAttempts
          cancelAtPeriodEnd
          user {
            id
            name
            surname
            nickname
          }
        }
      }
    }
  }
`;

export const CREATE_PLAN = gql`
  ${PLAN_FIELDS}
  mutation CreatePlan($plan: CreatePlanInput!) {
    createPlan(plan: $plan) {
      success
      message
      plan {
        ...PlanFields
      }
    }
  }
`;

export const UPDATE_PLAN = gql`
  ${PLAN_FIELDS}
  mutation UpdatePlan($plan: UpdatePlanInput!) {
    updatePlan(plan: $plan) {
      success
      message
      plan {
        ...PlanFields
      }
    }
  }
`;

/**
 * Horarios que exigen el plan, para avisar antes de archivarlo. Va aparte del
 * listado a propósito: solo hace falta al abrir el diálogo de archivado, y
 * pedirlo en `PlanFields` lo cobraría en cada plan de cada pantalla.
 */
export const PLAN_SCHEDULE_REQUIREMENT = gql`
  query PlanScheduleRequirement($planId: ID!) {
    getPlan(planId: $planId) {
      success
      plan {
        id
        requiredBySchedules {
          scheduleCount
          scheduleProgrammedCount
          total
        }
      }
    }
  }
`;

export const ARCHIVE_PLAN = gql`
  mutation ArchivePlan($planId: ID!) {
    archivePlan(planId: $planId) {
      success
      message
    }
  }
`;

export const REMOVE_PLAN = gql`
  mutation RemovePlan($planId: ID!) {
    removePlan(planId: $planId) {
      success
      message
    }
  }
`;
