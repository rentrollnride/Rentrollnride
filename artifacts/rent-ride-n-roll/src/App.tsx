import { lazy, Suspense, type ReactNode } from 'react';
import { Seo } from '@/components/public/Seo';
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

const Home = lazy(() => import('./pages/public/Home'));
const Fleet = lazy(() => import('./pages/public/Fleet'));
const VehicleDetails = lazy(() => import('./pages/public/VehicleDetails'));
const Rates = lazy(() => import('./pages/public/Rates'));
const Requirements = lazy(() => import('./pages/public/Requirements'));
const ServiceArea = lazy(() => import('./pages/public/ServiceArea'));
const About = lazy(() => import('./pages/public/About'));
const Contact = lazy(() => import('./pages/public/Contact'));
const Privacy = lazy(() => import('./pages/public/Privacy'));
const Terms = lazy(() => import('./pages/public/Terms'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Calendar = lazy(() => import('./pages/admin/Calendar'));
const FleetManager = lazy(() => import('./pages/admin/FleetManager'));
const Customers = lazy(() => import('./pages/admin/Customers'));
const Rentals = lazy(() => import('./pages/admin/Rentals'));
const NewRental = lazy(() => import('./pages/admin/NewRental'));

const queryClient = new QueryClient();

function Router() {
  return (
    <RoutedErrorBoundary>
      <RouteSeo />
      <Suspense fallback={<div className="min-h-[50vh] grid place-items-center font-mono text-sm">Loading…</div>}>
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
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />

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
      </Suspense>
    </RoutedErrorBoundary>
  );
}

const PAGE_META: Record<string, [string, string]> = {
  '/': ['Rent Ride Roll LLC | Raleigh-Durham Vehicle Rentals', 'Daily and weekly vehicle rentals in Raleigh-Durham. Call or text to confirm availability and terms.'],
  '/fleet': ['Rental Fleet | Rent Ride Roll LLC', 'Browse available Rent Ride Roll LLC vehicles and call or text to confirm availability.'],
  '/rates': ['Vehicle Rental Rates | Rent Ride Roll LLC', 'Review daily and weekly rental rates, deposits, and important pricing details.'],
  '/requirements': ['Rental Requirements | Rent Ride Roll LLC', 'Review age, license, insurance, card, and deposit requirements before renting.'],
  '/service-area': ['Raleigh-Durham Service Area | Rent Ride Roll LLC', 'Vehicle rentals serving Raleigh, Durham, and nearby communities.'],
  '/about': ['About Rent Ride Roll LLC', 'Learn about Rent Ride Roll LLC and its Raleigh-Durham vehicle rental service.'],
  '/contact': ['Contact Rent Ride Roll LLC', 'Call or text Rent Ride Roll LLC to ask about vehicles, rates, and availability.'],
  '/privacy': ['Privacy Policy | Rent Ride Roll LLC', 'How Rent Ride Roll LLC handles customer information.'],
  '/terms': ['Website Terms | Rent Ride Roll LLC', 'Terms for using the Rent Ride Roll LLC website.'],
}

function RouteSeo() {
  const [location] = useLocation()
  const normalizedPath = location.startsWith('/fleet/') ? '/fleet' : location
  const [title, description] = PAGE_META[normalizedPath] ?? PAGE_META['/']
  return <Seo title={title} description={description} path={location} noIndex={location.startsWith('/admin')} />
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
