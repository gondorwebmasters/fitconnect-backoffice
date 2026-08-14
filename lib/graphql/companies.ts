import { gql } from "@apollo/client";

export const COMPANY_FIELDS = gql`
  fragment CompanyFields on Company {
    id
    name
    code
    phoneNumber
    email
    address
    logo {
      id
      url
    }
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
`;

export const GET_COMPANIES = gql`
  ${COMPANY_FIELDS}
  query GetCompanies($companyId: ID, $page: Int, $query: String) {
    getCompanies(companyId: $companyId, page: $page, query: $query) {
      success
      message
      companies {
        ...CompanyFields
      }
      company {
        ...CompanyFields
      }
    }
  }
`;

export const GET_COMPANY_OPTIONS = gql`
  query GetCompanyOptions($page: Int, $query: String) {
    getCompanies(page: $page, query: $query) {
      success
      companies {
        id
        name
      }
    }
  }
`;

/** Solo id+nombre de la empresa activa — para el company switcher. */
export const GET_ACTIVE_COMPANY_NAME = gql`
  query GetActiveCompanyName($companyId: ID!) {
    getCompanies(companyId: $companyId) {
      success
      company {
        id
        name
      }
    }
  }
`;

/**
 * Logo (+ nombre, para el fallback con inicial) de la empresa activa — para
 * el fondo decorativo del layout y el avatar del remitente en notificaciones.
 */
export const GET_ACTIVE_COMPANY_LOGO = gql`
  query GetActiveCompanyLogo($companyId: ID!) {
    getCompanies(companyId: $companyId) {
      success
      company {
        id
        name
        logo {
          id
          url
        }
      }
    }
  }
`;

export const UPDATE_COMPANY_LOGO = gql`
  mutation UpdateCompanyLogo($companyId: ID!, $picture: String!) {
    updateCompanyLogo(companyId: $companyId, picture: $picture) {
      success
      message
      company {
        id
        logo {
          id
          url
        }
      }
    }
  }
`;

export const CREATE_COMPANY = gql`
  mutation CreateCompany($company: CreateCompanyInput!) {
    createCompany(company: $company) {
      success
      message
    }
  }
`;

export const UPDATE_COMPANY = gql`
  ${COMPANY_FIELDS}
  mutation UpdateCompany($companyId: ID!, $companyData: CompanyDataInput!, $scheduleOptions: ScheduleOptionsInput!) {
    updateCompany(companyId: $companyId, companyData: $companyData, scheduleOptions: $scheduleOptions) {
      success
      message
      company {
        ...CompanyFields
      }
    }
  }
`;
