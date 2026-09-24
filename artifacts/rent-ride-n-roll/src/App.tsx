import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

// Public Pages
import Home from './pages/public/Home';
import Fleet from './pages/public/Fleet';
import VehicleDetails from './pages/public/VehicleDetails';
import Rates from './pages/public/Rates';
import Requirements from './pages/public/Requirements';
import ServiceArea from './pages/public/ServiceArea';
import About from './pages/public/About';
import Contact from './pages/public/Contact';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Calendar from './pages/admin/Calendar';
import FleetManager from './pages/admin/FleetManager';
import Customers from './pages/admin/Customers';
import Rentals from './pages/admin/Rentals';
import NewRental from './pages/admin/NewRental';

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Home} />
        <Route path="/fleet/:id" component={VehicleDetails} />
        <Route path="/fleet" component={Fleet} />
        <Route path="/rates" component={Rates} />
        <Route path="/requirements" component={Requirements} />
        <Route path="/service-area" component={ServiceArea} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />

        {/* Admin Routes */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin"><ProtectedRoute><Dashboard /></ProtectedRoute></Route>
        <Route path="/admin/calendar"><ProtectedRoute><Calendar /></ProtectedRoute></Route>
        <Route path="/admin/cars"><ProtectedRoute><FleetManager /></ProtectedRoute></Route>
        <Route path="/admin/customers"><ProtectedRoute><Customers /></ProtectedRoute></Route>
        <Route path="/admin/rentals"><ProtectedRoute><Rentals /></ProtectedRoute></Route>
        <Route path="/admin/rentals/new"><ProtectedRoute><NewRental /></ProtectedRoute></Route>

        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return <div className="min-h-screen grid place-items-center font-mono text-sm">Checking secure session…</div>;
  }
  if (!session) {
    queueMicrotask(() => setLocation('/admin/login'));
    return null;
  }
  return children;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
