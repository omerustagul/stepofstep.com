import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import PublicLayout from './components/layout/PublicLayout';
import ProductGen from './components/dashboard/ProductGen';
import LogoGen from './components/dashboard/LogoGen';
import AppWrapper from './components/dashboard/AppWrapper';
import Login from './pages/Login';
import Register from './pages/Register';
import Login2FA from './pages/Login2FA';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import StepAI from './pages/StepAI';
import BrandingPage from './pages/services/BrandingPage';
import DevelopmentPage from './pages/services/DevelopmentPage';
import MarketingPage from './pages/services/MarketingPage';
import LegalPage from './pages/legal/LegalPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import SiteSettings from './pages/admin/SiteSettings';
import PortfolioManager from './pages/admin/PortfolioManager';
import UserManager from './pages/admin/UserManager';
import MemberManager from './pages/admin/MemberManager';
import PlanManager from './pages/admin/PlanManager';
import AdminProfile from './pages/admin/AdminProfile';
import AdminPolicies from './pages/admin/AdminPolicies';
import WheelManager from './pages/admin/WheelManager';
import ContactMessages from './pages/admin/ContactMessages';
import WheelGuard from './components/common/WheelGuard';
import NotFound from './pages/NotFound';
import AdminGuard from './components/admin/AdminGuard';
import ConnectionTest from './pages/ConnectionTest';
import { SiteProvider, useSiteSettings } from './context/SiteContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { JobProvider } from './context/JobContext';
import { ActivityProvider } from './context/ActivityContext';
import { LoadingProvider } from './context/LoadingContext';
import { ToastProvider } from './context/ToastContext';
import { RoleProvider, useRoles, type ScreenId } from './context/RoleContext';
import PortfolioDetail from './pages/PortfolioDetail';
import JobApplications from './pages/admin/JobApplications';
import { NotificationProvider } from './context/NotificationContext';
import { GamificationProvider } from './context/GamificationContext';
import AppointmentManager from './pages/admin/AppointmentManager';
import AdminNotifications from './pages/admin/AdminNotifications';
import PortalLayout from './components/portal/PortalLayout';
import ClientDashboard from './pages/portal/ClientDashboard';
import ClientAppointments from './pages/portal/ClientAppointments';
import PortalApps from './pages/portal/PortalApps';
import PortalJobs from './pages/portal/PortalJobs';
import PortalProfile from './pages/portal/PortalProfile';
import PortalRewards from './pages/portal/PortalRewards';
import PortalSupport from './pages/portal/PortalSupport';
import BrandConsultant from './pages/portal/BrandConsultant';
import appsConfig from './config/apps.json';
import SmoothScroll from './components/common/SmoothScroll';
import NoiseOverlay from './components/common/NoiseOverlay';
import AnalyticsInjector from './components/common/AnalyticsInjector';
import { GlobalSonic } from './components/hero/SonicManager';
import AdminLogin from './pages/admin/AdminLogin';
import ScrollToTop from './components/common/ScrollToTop';


// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show nothing while loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
};

// Admin Protected Route Component
const AdminProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Authorized roles for admin panel
  const isStaff = user?.role === 'admin' || user?.role === 'marketing' || user?.role === 'designer' || !!user?.role_id;

    if (!isAuthenticated || !user || !isStaff) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

  return children;
};

// Permission Guard Component
const PermissionGuard = ({ screen, children }: { screen: ScreenId, children: JSX.Element }) => {
  const { user } = useAuth();
  const { canView } = useRoles();

  if (!user) return null;

  let hasAccess = false;

  // Strict check for role_id
  if (user.role_id) {
    hasAccess = canView(user.role_id, screen);
  }
  // Super Admin Bypass
  else if (user.role === 'admin') {
    hasAccess = true;
  }

  if (!hasAccess) {
    // If blocked from dashboard, go home
    if (screen === 'dashboard') return <Navigate to="/" replace />;
    
    // User is logged in but has no admin rights
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};


// Admin Subdomain Logic - Optional now since we have /admin
const isAdminSubdomain = () => {
  const host = window.location.hostname;
  return host.startsWith('admin.');
};

function MainApp() {
  const dynamicApps = appsConfig;

  // If accessing via admin subdomain, direct to admin panel
  if (isAdminSubdomain()) {
    return <Navigate to="/admin" replace />;
  }

  const { getPagePath } = useSiteSettings();

  return (
    <Routes>
      {/* Auth Routes (No Layout) */}
      <Route path="/login" element={<Login />} />
      <Route path="/login/2fa" element={<Login2FA />} />
      <Route path="/register" element={<Register />} />

      <Route element={<PublicLayout />}>
        <Route path={getPagePath('Ana Sayfa', '/')} element={<Home />} />
        <Route path={getPagePath('Hakkımızda', '/about')} element={<About />} />
        <Route path={getPagePath('İletişim', '/contact')} element={<Contact />} />
        <Route path={getPagePath('Kariyer', '/careers')} element={<Careers />} />
        <Route path={getPagePath('Markalama Hizmeti', '/services/branding')} element={<BrandingPage />} />
        <Route path={getPagePath('Yazılım Geliştirme', '/services/development')} element={<DevelopmentPage />} />
        <Route path={getPagePath('Dijital Pazarlama', '/services/marketing')} element={<MarketingPage />} />
        <Route path={getPagePath('Profil', '/profile')} element={<Profile />} />
        <Route path="/legal/:slug" element={<LegalPage />} />
        <Route path="/portfolio/:id" element={<PortfolioDetail />} />
        <Route path="/test-db" element={<ConnectionTest />} />
        <Route path="/ai-assistant" element={<StepAI />} />
      </Route>

      {/* Client Portal Routes */}
      <Route path="/portal" element={
        <ProtectedRoute>
          <PortalLayout />
        </ProtectedRoute>
      }>
        <Route index element={<ClientDashboard />} />
        <Route path="apps" element={<PortalApps />} />
        <Route path="appointments" element={<ClientAppointments />} />
        <Route path="jobs" element={<PortalJobs />} />
        <Route path="support" element={<PortalSupport />} />
        <Route path="rewards" element={<PortalRewards />} />
        <Route path="consultant" element={<BrandConsultant />} />
        <Route path="profile" element={<PortalProfile />} />
      </Route>

      {/* Admin Login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminProtectedRoute>
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        </AdminProtectedRoute>
      }>
        <Route index element={<PermissionGuard screen="dashboard"><AdminDashboard /></PermissionGuard>} />
        <Route path="notifications" element={<PermissionGuard screen="members"><AdminNotifications /></PermissionGuard>} />
        <Route path="messages" element={<PermissionGuard screen="messages"><ContactMessages /></PermissionGuard>} />
        <Route path="jobs" element={<PermissionGuard screen="jobs"><JobApplications /></PermissionGuard>} />
        <Route path="appointments" element={<PermissionGuard screen="appointments"><AppointmentManager /></PermissionGuard>} />
        <Route path="users" element={<PermissionGuard screen="users"><UserManager /></PermissionGuard>} />
        <Route path="members" element={<PermissionGuard screen="members"><MemberManager /></PermissionGuard>} />
        <Route path="plans" element={<PermissionGuard screen="plans"><PlanManager /></PermissionGuard>} />
        <Route path="portfolios" element={<PermissionGuard screen="portfolios"><PortfolioManager /></PermissionGuard>} />
        <Route path="wheel" element={<PermissionGuard screen="wheel"><WheelManager /></PermissionGuard>} />
        <Route path="policies" element={<PermissionGuard screen="policies"><AdminPolicies /></PermissionGuard>} />
        <Route path="settings" element={<PermissionGuard screen="settings"><SiteSettings /></PermissionGuard>} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* App Dashboard Routes - Protected */}
      {/* Standalone Apps (No Dashboard Layout) */}
      <Route path="/app" element={<Navigate to="/portal/apps" replace />} />

      <Route path="/app/profile" element={<Navigate to="/portal/profile" replace />} />
      <Route path="/app/settings" element={<Navigate to="/portal" replace />} />

      <Route path="/app/product-gen" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-zinc-50 p-8 relative">
            <a href="/portal/apps" className="absolute top-8 right-8 text-zinc-400 hover:text-orange-500 font-bold text-sm">✕ Kapat</a>
            <ProductGen />
          </div>
        </ProtectedRoute>
      } />
      <Route path="/app/logo-gen" element={
        <ProtectedRoute>
          <LogoGen />
        </ProtectedRoute>
      } />

      {/* Dynamic Apps from JSON */}
      {dynamicApps.map(app => (
        <Route
          key={app.id}
          path={`/app/${app.id}`}
          element={
            <ProtectedRoute>
              <AppWrapper appUrl={app.path} title={app.name} />
            </ProtectedRoute>
          }
        />
      ))}

      {/* User Preferred Routes (Aliases) */}
      <Route path="/app/brand-architect" element={<ProtectedRoute><AppWrapper appUrl="/apps/sos-brand-architect/" title="Brand Architect" /></ProtectedRoute>} />
      <Route path="/app/foundry" element={<ProtectedRoute><AppWrapper appUrl="/apps/sos-foundry/" title="The Foundry" /></ProtectedRoute>} />
      <Route path="/app/social-mind" element={<ProtectedRoute><AppWrapper appUrl="/apps/sos-social-mind/" title="Social Mind" /></ProtectedRoute>} />

      {/* 404 Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}



function App() {
  return (
    <SiteProvider>
      <AuthProvider>
        <NotificationProvider>
          <GamificationProvider>
            <PortfolioProvider>
              <JobProvider>
                <ActivityProvider>
                  <RoleProvider>
                    <LoadingProvider>
                      <ToastProvider>
                        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                          <ScrollToTop />
                          <SmoothScroll />
                          <AnalyticsInjector />
                          <NoiseOverlay />
                          <GlobalSonic />
                          <WheelGuard />
                          <MainApp />
                        </BrowserRouter>
                      </ToastProvider>
                    </LoadingProvider>
                  </RoleProvider>
                </ActivityProvider>
              </JobProvider>
            </PortfolioProvider>
          </GamificationProvider>
        </NotificationProvider>
      </AuthProvider>
    </SiteProvider>
  );
}

export default App;
