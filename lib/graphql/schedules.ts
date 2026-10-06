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

/**
 * Todos los campos editables de una plantilla semanal. El listado y la respuesta
 * de `updateScheduleProgrammed` piden el mismo fragmento para que lo que vuelve
 * de la mutación tenga la forma exacta que la lista ya tiene cacheada por `id`,
 * en vez de dejar la entrada a medias hasta el siguiente refetch.
 */
export const SCHEDULE_PROGRAMMED_FIELDS = gql`
  fragment ScheduleProgrammedFields on ScheduleProgrammed {
    id
    title
    description
    daysOfWeek
    startHour
    endHour
    maxUsers
    type
    age
    admin {
      id
      name
      surname
      nickname
    }
    # Restricted Schedule sobre la plantilla: lista vacía = sin restricción. La
    # plantilla la siembra en cada schedule que engendra (#12).
    allowedPlans {
      id
      name
    }
  }
`;

export const GET_SCHEDULES_PROGRAMMED = gql`
  ${SCHEDULE_PROGRAMMED_FIELDS}
  query GetSchedulesProgrammed {
    getSchedulesProgrammed {
      success
      message
      schedulesProgrammed {
        ...ScheduleProgrammedFields
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
  ${SCHEDULE_PROGRAMMED_FIELDS}
  mutation UpdateScheduleProgrammed($scheduleProgrammed: UpdateScheduleProgrammedInput!) {
    updateScheduleProgrammed(scheduleProgrammed: $scheduleProgrammed) {
      success
      message
      scheduleProgrammed {
        ...ScheduleProgrammedFields
      }
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
