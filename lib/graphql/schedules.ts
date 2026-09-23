import { gql } from "@apollo/client";

export const SCHEDULE_FIELDS = gql`
  fragment ScheduleFields on Schedule {
    id
    title
    description
    startDate
    endDate
    maxUsers
    state
    type
    age
    admin {
      id
      name
      surname
      nickname
    }
    users {
      id
      name
      surname
      nickname
      email
      pictureUrl {
        id
        url
      }
    }
    waitListUsers {
      id
      name
      surname
      nickname
    }
    # Restricted Schedule: lista vacía = sin restricción. No se pide planAccess:
    # es derivado por llamante y el backoffice configura la restricción, no se inscribe.
    allowedPlans {
      id
      name
    }
  }
`;

export const GET_SCHEDULES_RANGE = gql`
  ${SCHEDULE_FIELDS}
  query GetSchedulesRange($startDate: String!, $endDate: String!) {
    getSchedulesRange(startDate: $startDate, endDate: $endDate) {
      success
      message
      schedules {
        ...ScheduleFields
      }
    }
  }
`;

export const GET_SCHEDULE_OPTIONS = gql`
  query GetScheduleOptions {
    getScheduleOptions {
      success
      message
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
  }
`;

export const GET_SCHEDULES_PROGRAMMED = gql`
  query GetSchedulesProgrammed {
    getSchedulesProgrammed {
      success
      message
      schedulesProgrammed {
        id
        title
        description
        daysOfWeek
        startHour
        endHour
        maxUsers
        type
        admin {
          id
          name
          surname
        }
      }
    }
  }
`;

export const GET_USER_SCHEDULES = gql`
  query GetUserSchedules($userId: ID, $past: Boolean) {
    getUserSchedules(userId: $userId, past: $past) {
      success
      message
      schedules {
        id
        title
        startDate
        endDate
        state
        type
      }
    }
  }
`;

export const CREATE_SCHEDULE = gql`
  mutation CreateSchedule($schedule: CreateScheduleInput!) {
    createSchedule(schedule: $schedule) {
      success
      message
    }
  }
`;

export const UPDATE_SCHEDULE = gql`
  ${SCHEDULE_FIELDS}
  mutation UpdateSchedule($schedule: UpdateScheduleInput!) {
    updateSchedule(schedule: $schedule) {
      success
      message
      schedule {
        ...ScheduleFields
      }
    }
  }
`;

export const REMOVE_SCHEDULE = gql`
  mutation RemoveSchedule($scheduleId: ID!) {
    removeSchedule(scheduleId: $scheduleId) {
      success
      message
    }
  }
`;

export const CHANGE_SCHEDULE_STATUS = gql`
  ${SCHEDULE_FIELDS}
  mutation ChangeScheduleStatus($scheduleId: ID!) {
    changeScheduleStatus(scheduleId: $scheduleId) {
      success
      message
      schedule {
        ...ScheduleFields
      }
    }
  }
`;

export const ADD_USER_TO_SCHEDULE = gql`
  ${SCHEDULE_FIELDS}
  mutation AddUserToSchedule($scheduleId: ID!) {
    addUserToSchedule(scheduleId: $scheduleId) {
      success
      message
      schedule {
        ...ScheduleFields
      }
    }
  }
`;

export const REMOVE_USER_FROM_SCHEDULE = gql`
  ${SCHEDULE_FIELDS}
  mutation RemoveUserFromSchedule($scheduleId: ID!, $userId: ID) {
    removeUserFromSchedule(scheduleId: $scheduleId, userId: $userId) {
      success
      message
      schedule {
        ...ScheduleFields
      }
    }
  }
`;

export const UPDATE_SCHEDULE_PROGRAMMED = gql`
  mutation UpdateScheduleProgrammed($scheduleProgrammed: UpdateScheduleProgrammedInput!) {
    updateScheduleProgrammed(scheduleProgrammed: $scheduleProgrammed) {
      success
      message
    }
  }
`;

export const DELETE_SCHEDULE_PROGRAMMED = gql`
  mutation DeleteScheduleProgrammed($ids: [ID]!) {
    deleteScheduleProgrammed(ids: $ids) {
      success
      message
    }
  }
`;

export const UPDATE_SCHEDULE_OPTIONS = gql`
  mutation UpdateScheduleOptions($scheduleOptions: UpdateScheduleOptionsInput!) {
    updateScheduleOptions(scheduleOptions: $scheduleOptions) {
      success
      message
    }
  }
`;
