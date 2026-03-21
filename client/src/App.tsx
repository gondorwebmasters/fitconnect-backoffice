import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/graphql/apollo-client";
import { FitConnectAuthProvider, useFitConnectAuth } from "@/contexts/FitConnectAuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { Route, Switch, Redirect } from "wouter";
import { Loader2, Dumbbell } from "lucide-react";

// Pages
import LoginPage from "./pages/Login";
import SelectCompanyPage from "./pages/SelectCompany";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/Users";
import UserDetailPage from "./pages/UserDetail";
import ProductsPage from "./pages/Products";
import CompaniesPage from "./pages/Companies";
import CompanyDetailPage from "./pages/CompanyDetail";
import SchedulesPage from "./pages/Schedules";
import PlansPage from "./pages/Plans";
import SubscriptionsPage from "./pages/Subscriptions";
import TransactionsPage from "./pages/Transactions";
import PaymentMethodsPage from "./pages/PaymentMethods";
import NotificationsPage from "./pages/Notifications";
import NotFound from "./pages/NotFound";

/**
 * Branded loading screen shown while the auth state is being resolved.
 */
function AuthLoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
        <Dumbbell className="h-7 w-7 text-primary-foreground" />
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-primary mt-2" />
      <p className="text-sm text-slate-400 mt-3">Loading your session...</p>
    </div>
  );
}

/**
 * AuthGate: protects routes that require authentication + active company.
 * Shows a branded loading screen while auth state is being resolved,
 * then redirects unauthenticated users to /login and users without
 * an active company to /select-company.
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, activeCompanyId } = useFitConnectAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (!activeCompanyId) {
    return <Redirect to="/select-company" />;
  }

  return <>{children}</>;
}

/**
 * Wraps a page inside AuthGate + DashboardLayout.
 */
function ProtectedDashboard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGate>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes — Login and SelectCompany handle their own
          redirect logic if the user is already authenticated */}
      <Route path="/login" component={LoginPage} />
      <Route path="/select-company" component={SelectCompanyPage} />

      {/* Protected dashboard routes */}
      <Route path="/">
        <ProtectedDashboard><Dashboard /></ProtectedDashboard>
      </Route>
      <Route path="/users">
        <ProtectedDashboard><UsersPage /></ProtectedDashboard>
      </Route>
      <Route path="/users/:id">
        <ProtectedDashboard><UserDetailPage /></ProtectedDashboard>
      </Route>
      <Route path="/products">
        <ProtectedDashboard><ProductsPage /></ProtectedDashboard>
      </Route>
      <Route path="/companies">
        <ProtectedDashboard><CompaniesPage /></ProtectedDashboard>
      </Route>
      <Route path="/companies/:id">
        <ProtectedDashboard><CompanyDetailPage /></ProtectedDashboard>
      </Route>
      <Route path="/schedules">
        <ProtectedDashboard><SchedulesPage /></ProtectedDashboard>
      </Route>
      <Route path="/plans">
        <ProtectedDashboard><PlansPage /></ProtectedDashboard>
      </Route>
      <Route path="/subscriptions">
        <ProtectedDashboard><SubscriptionsPage /></ProtectedDashboard>
      </Route>
      <Route path="/transactions">
        <ProtectedDashboard><TransactionsPage /></ProtectedDashboard>
      </Route>
      <Route path="/payment-methods">
        <ProtectedDashboard><PaymentMethodsPage /></ProtectedDashboard>
      </Route>
      <Route path="/notifications">
        <ProtectedDashboard><NotificationsPage /></ProtectedDashboard>
      </Route>

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ApolloProvider client={apolloClient}>
          <FitConnectAuthProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </FitConnectAuthProvider>
        </ApolloProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
