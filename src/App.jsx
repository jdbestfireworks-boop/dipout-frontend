import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import SplashScreen from '@/components/SplashScreen';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import RegisterRider from '@/pages/RegisterRider';
import RegisterDriver from '@/pages/RegisterDriver';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppShell from '@/components/AppShell';
import Home from '@/pages/Home';
import RiderApp from '@/pages/RiderApp';
import DriverApp from '@/pages/DriverApp';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminMonitoring from '@/pages/AdminMonitoring';
import RideHistoryPage from '@/pages/RideHistoryPage';
import DemoMode from '@/pages/DemoMode';
import NotificationSettings from '@/pages/NotificationSettings';
import ClickSimulation from '@/pages/ClickSimulation';
import SimulationGuide from '@/pages/SimulationGuide';
import ProductionTest from '@/pages/ProductionTest';
import PreLaunchTests from '@/pages/PreLaunchTests';
import MigrateData from '@/pages/MigrateData';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Show splash screen first, then loading spinner if needed
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/rider" element={<RegisterRider />} />
      <Route path="/register/driver" element={<RegisterDriver />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/" element={<Home />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppShell />}>
          <Route path="/rider" element={<RiderApp />} />
          <Route path="/driver" element={<DriverApp />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/rides" element={<RideHistoryPage />} />
          <Route path="/demo" element={<DemoMode />} />
          <Route path="/notifications" element={<NotificationSettings />} />
          <Route path="/click-simulation" element={<ClickSimulation />} />
          <Route path="/simulation" element={<SimulationGuide />} />
          <Route path="/admin/monitoring" element={<AdminMonitoring />} />
          <Route path="/admin/test" element={<ProductionTest />} />
          <Route path="/admin/pre-launch" element={<PreLaunchTests />} />
          <Route path="/admin/migrate" element={<MigrateData />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App