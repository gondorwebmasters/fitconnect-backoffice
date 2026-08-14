import { gql } from "@apollo/client";

export interface MonthCount {
  month: string;
  count: number;
}

export interface AgeRangeCount {
  range: string;
  count: number;
}

export interface MonthAmount {
  month: string;
  amount: number;
}

export interface ReportMetricsData {
  totalUsers: number;
  churnedUsers: number;
  newUsersByMonth: MonthCount[];
  churnedUsersByMonth: MonthCount[];
  usersByAgeRange: AgeRangeCount[];
  totalRevenue: number;
  revenueByMonth: MonthAmount[];
  productsSold: number;
  promotionsApplied: number;
  promotionsAppliedByMonth: MonthCount[];
  subscriptionsByMonth: MonthCount[];
  schedulesByMonth: MonthCount[];
  transactionsByMonth: MonthCount[];
}

export const GET_REPORT_METRICS = gql`
  query GetReportMetrics {
    getReportMetrics {
      success
      message
      metrics {
        totalUsers
        churnedUsers
        newUsersByMonth {
          month
          count
        }
        churnedUsersByMonth {
          month
          count
        }
        usersByAgeRange {
          range
          count
        }
        totalRevenue
        revenueByMonth {
          month
          amount
        }
        productsSold
        promotionsApplied
        promotionsAppliedByMonth {
          month
          count
        }
        subscriptionsByMonth {
          month
          count
        }
        schedulesByMonth {
          month
          count
        }
        transactionsByMonth {
          month
          count
        }
      }
    }
  }
`;
