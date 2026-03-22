import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/graphql/apollo-client";
import { FitConnectAuthProvider, useFitConnectAuth } from "@/contexts/FitConnectAuthContext";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import { Route, Switch, Redirect } from "wouter";
import { Loader2 } from "lucide-react";

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
import CompanySettingsPage from "./pages/CompanySettings";
import NotFound from "./pages/NotFound";

function AuthLoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="h-14 w-14 rounded-2xl bg-[#F97316] flex items-center justify-center mb-4 shadow-lg shadow-orange-500/25">
        <span className="text-white font-bold text-lg">FC</span>
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-[#F97316] mt-2" />
      <p className="text-sm text-muted-foreground mt-3">Cargando sesión...</p>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, activeCompanyId } = useFitConnectAuth();

  if (loading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (!activeCompanyId) return <Redirect to="/select-company" />;

  return <>{children}</>;
}

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
      <Route path="/login" component={LoginPage} />
      <Route path="/select-company" component={SelectCompanyPage} />

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
      <Route path="/settings">
        <ProtectedDashboard><CompanySettingsPage /></ProtectedDashboard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
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
