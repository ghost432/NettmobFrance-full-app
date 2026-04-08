import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from './components/ui/toast';
import { NavigationProgress } from './components/NavigationProgress';
import { NotificationPrompt } from './components/NotificationPrompt';
import { InstallPWAPrompt } from './components/InstallPWAPrompt';
import AIAssistantWidget from './components/AIAssistantWidget';
import ExpertNotificationBanner from './components/ExpertNotificationBanner';
import { LoadingScreen, PageLoader } from './components/LoadingScreen';
import { useToastEvents } from './hooks/useToastEvents';
import { useForegroundNotifications } from './hooks/useForegroundNotifications';
// import { registerServiceWorker } from './services/pushNotification'; // DÉSACTIVÉ - Firebase FCM gère les notifications
import './utils/testNotifications'; // Utilitaires de debug pour la console
import ScrollToTop from './components/ScrollToTop';

// Pages publiques - chargement immédiat
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import AccountType from './pages/AccountType';
import RegisterAutomob from './pages/automob/RegisterAutomob';
import RegisterClient from './pages/client/RegisterClient';
import VerifyEmail from './pages/VerifyEmail';
import VerifyLogin from './pages/VerifyLogin';
import Dashboard from './pages/Dashboard';
import LandingAutoEntrepreneur from './pages/Public/LandingAutoEntrepreneur';
import LandingEnterprise from './pages/Public/LandingEnterprise';
import Contact from './pages/Public/Contact';
import ContactEntreprise from './pages/Public/ContactEntreprise';
import DevisEntreprise from './pages/Public/DevisEntreprise';
import About from './pages/Public/About';
import CGU from './pages/Public/CGU';
import MandatFacturation from './pages/Public/MandatFacturation';
import RGPD from './pages/Public/RGPD';
import ConformiteSecurite from './pages/Public/ConformiteSecurite';
import Secteurs from './pages/Public/Secteurs';
import SecteursEntreprise from './pages/Public/SecteursEntreprise';
import Fonctionnement from './pages/Public/Fonctionnement';
import FonctionnementEntreprise from './pages/Public/FonctionnementEntreprise';
import Tutoriels from './pages/Public/Tutoriels';
import TutorielsEntreprise from './pages/Public/TutorielsEntreprise';

import FAQ from './pages/Public/FAQ';
import FAQEntreprise from './pages/Public/FAQEntreprise';
import BlogList from './pages/Public/BlogList';
import BlogPost from './pages/Public/BlogPost';
import PWAWelcome from './pages/Public/PWAWelcome';
import NotFound from './pages/NotFound';


// Pages admin - lazy loading
const BlogManagement = lazy(() => import('./pages/admin/BlogManagement'));
const DashboardAdmin = lazy(() => import('./pages/admin/DashboardAdmin'));
const SecteursCompetences = lazy(() => import('./pages/admin/SecteursCompetences'));
const UsersList = lazy(() => import('./pages/admin/UsersList'));
const UserDetail = lazy(() => import('./pages/admin/UserDetail'));
const UserCreate = lazy(() => import('./pages/admin/UserCreate'));
const ProfileAdmin = lazy(() => import('./pages/admin/ProfileAdmin'));
const SettingsAdmin = lazy(() => import('./pages/admin/SettingsAdmin'));
// Pages client - lazy loading
const DashboardClient = lazy(() => import('./pages/client/DashboardClient'));
const ProfileClient = lazy(() => import('./pages/client/ProfileClient'));
const PublicProfileClient = lazy(() => import('./pages/client/PublicProfileClient'));
const SettingsClient = lazy(() => import('./pages/client/SettingsClient'));
const PublishMission = lazy(() => import('./pages/client/PublishMission'));
const MissionsList = lazy(() => import('./pages/client/MissionsList'));
const MissionDetails = lazy(() => import('./pages/client/MissionDetails'));
const EditMission = lazy(() => import('./pages/client/EditMission'));
const ApplicationsReceived = lazy(() => import('./pages/client/ApplicationsReceived'));
const ClientMissionTimesheets = lazy(() => import('./pages/client/MissionTimesheets'));
const TimesheetReview = lazy(() => import('./pages/client/TimesheetReview'));
const TimesheetsList = lazy(() => import('./pages/client/TimesheetsList'));
const MissionCompleteAutomobs = lazy(() => import('./pages/client/MissionCompleteAutomobs'));
// Pages automob - lazy loading
const DashboardAutomob = lazy(() => import('./pages/automob/DashboardAutomob'));
const AvailableMissions = lazy(() => import('./pages/automob/AvailableMissions'));
const MissionDetailsAutomob = lazy(() => import('./pages/automob/MissionDetails'));
const MyApplications = lazy(() => import('./pages/automob/MyApplications'));
const MyMissions = lazy(() => import('./pages/automob/MyMissions'));
const CompletedMissions = lazy(() => import('./pages/automob/CompletedMissions'));
const CreateTimesheet = lazy(() => import('./pages/automob/CreateTimesheet'));
const MissionTimesheets = lazy(() => import('./pages/automob/MissionTimesheets'));
const ProfileAutomob = lazy(() => import('./pages/automob/ProfileAutomob'));
const PublicProfileAutomob = lazy(() => import('./pages/automob/PublicProfileAutomob'));
const SettingsAutomob = lazy(() => import('./pages/automob/SettingsAutomob'));
const VerifyIdentityAutomob = lazy(() => import('./pages/automob/VerifyIdentityNew'));
const VerifyIdentityClient = lazy(() => import('./pages/client/VerifyIdentityNew'));
// Pages supplémentaires - lazy loading
const VerificationManagement = lazy(() => import('./pages/admin/VerificationManagement'));
const VerificationManagementNew = lazy(() => import('./pages/admin/VerificationManagementNew'));
const BroadcastNotification = lazy(() => import('./pages/admin/BroadcastNotification'));
const MissionsManagement = lazy(() => import('./pages/admin/MissionsManagement'));
const AutomobInvoices = lazy(() => import('./pages/automob/Invoices'));
const ClientInvoices = lazy(() => import('./pages/client/Invoices'));
const AdminInvoices = lazy(() => import('./pages/admin/Invoices'));
const AutomobWallet = lazy(() => import('./pages/automob/Wallet'));
const AutomobReviews = lazy(() => import('./pages/automob/Reviews'));
const AdminWalletManagement = lazy(() => import('./pages/admin/WalletManagement'));
const NotificationsPageAdmin = lazy(() => import('./pages/admin/NotificationsPage'));
const NotificationsPageAutomob = lazy(() => import('./pages/automob/NotificationsPage'));
const NotificationsPageClient = lazy(() => import('./pages/client/NotificationsPage'));
const SendNotifications = lazy(() => import('./pages/admin/SendNotifications'));
const SendSMS = lazy(() => import('./pages/admin/SendSMS'));
const Support = lazy(() => import('./pages/Support'));
const SupportAdmin = lazy(() => import('./pages/admin/SupportAdmin'));
const AutomobDisputes = lazy(() => import('./pages/automob/Disputes'));
const ClientDisputes = lazy(() => import('./pages/client/Disputes'));
const AdminDisputes = lazy(() => import('./pages/admin/DisputeManagement'));
const DisputeDetails = lazy(() => import('./pages/DisputeDetails'));
const Missions = lazy(() => import('./pages/Missions'));
const Chat = lazy(() => import('./pages/Chat'));
const TestConnection = lazy(() => import('./pages/TestConnection'));
const ArchivedMissions = lazy(() => import('./pages/admin/ArchivedMissions'));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const PWAStats = lazy(() => import('./pages/admin/PWAStats'));
const InstallPWA = lazy(() => import('./pages/admin/InstallPWA'));
const SystemSettings = lazy(() => import('./pages/admin/SystemSettings'));
const MissionTypes = lazy(() => import('./pages/admin/MissionTypes'));
const ApplicationsReceivedAdmin = lazy(() => import('./pages/admin/ApplicationsReceived'));
const BillingFrequencyManagement = lazy(() => import('./pages/admin/BillingFrequencyManagement'));
const MissionLocationsManagement = lazy(() => import('./pages/admin/MissionLocationsManagement'));
const HourlyRatesManagement = lazy(() => import('./pages/admin/HourlyRatesManagement'));
const FeedbackManagement = lazy(() => import('./pages/admin/FeedbackManagement'));
const AdminContact = lazy(() => import('./pages/admin/AdminContact'));
const AdminDevis = lazy(() => import('./pages/admin/AdminDevis'));
const AdminTutoriels = lazy(() => import('./pages/admin/AdminTutoriels'));
const AdminRoles = lazy(() => import('./pages/admin/AdminRoles'));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen message="Vérification des droits d'accès..." />;

  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardPath = `/${user.role}/dashboard`;
    return <Navigate to={dashboardPath} />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen message="Vérification de la session..." />;
  if (user) return <Navigate to="/dashboard" />;
  return children;
};

const PWARedirector = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.search.includes('mode=pwa')) {
      const hasLaunched = localStorage.getItem('pwa_launched');
      if (!hasLaunched) {
        navigate('/pwa-welcome', { replace: true });
      } else {
        // L'utilisateur a déjà vu le welcome, on le redirige vers login ou l'état par défaut
        navigate('/login', { replace: true });
      }
    }
  }, [location, navigate]);

  return null;
};

const AppContent = () => {
  const { initialLoad } = useAuth();
  useToastEvents();

  if (initialLoad) {
    return <LoadingScreen message="Initialisation de l'application..." />;
  }

  return (
    <>
      <PWARedirector />
      <NavigationProgress />
      <ScrollToTop />
      <NotificationPrompt />
      <ExpertNotificationBanner />
      <InstallPWAPrompt />
      <SocketProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Landing Pages - Placed at the top for priority */}
            <Route path="/" element={<LandingAutoEntrepreneur />} />
            <Route path="/entreprise" element={<LandingEnterprise />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/entreprise/contact" element={<ContactEntreprise />} />
            <Route path="/entreprise/devis" element={<DevisEntreprise />} />
            <Route path="/a-propos" element={<About />} />
            <Route path="/cgu-cgv" element={<CGU />} />
            <Route path="/mandat-facturation" element={<MandatFacturation />} />
            <Route path="/rgpd" element={<RGPD />} />
            <Route path="/conformite-securite" element={<ConformiteSecurite />} />
            <Route path="/secteurs" element={<Secteurs />} />
            <Route path="/entreprise/secteurs" element={<SecteursEntreprise />} />
            <Route path="/fonctionnement" element={<Fonctionnement />} />
            <Route path="/entreprise/fonctionnement" element={<FonctionnementEntreprise />} />
            <Route path="/tutoriels" element={<Tutoriels />} />
            <Route path="/entreprise/tutoriels" element={<TutorielsEntreprise />} />
            <Route path="/pwa-welcome" element={<PWAWelcome />} />

            <Route path="/faq" element={<FAQ />} />
            <Route path="/entreprise/faq" element={<FAQEntreprise />} />
            <Route path="/blog" element={<BlogList type="auto-entrepreneur" />} />
            <Route path="/blog/:slug" element={<BlogPost type="auto-entrepreneur" />} />
            <Route path="/entreprise/blog" element={<BlogList type="enterprise" />} />
            <Route path="/entreprise/blog/:slug" element={<BlogPost type="enterprise" />} />

            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/account-type" element={<PublicRoute><AccountType /></PublicRoute>} />
            <Route path="/register/automob" element={<PublicRoute><RegisterAutomob /></PublicRoute>} />
            <Route path="/register/client" element={<PublicRoute><RegisterClient /></PublicRoute>} />
            <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
            <Route path="/verify-login" element={<PublicRoute><VerifyLogin /></PublicRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><DashboardAdmin /></ProtectedRoute>} />
            <Route path="/admin/secteurs-competences" element={<ProtectedRoute allowedRoles={['admin']}><SecteursCompetences /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UsersList /></ProtectedRoute>} />
            <Route path="/admin/users/new" element={<ProtectedRoute allowedRoles={['admin']}><UserCreate /></ProtectedRoute>} />
            <Route path="/admin/users/:id" element={<ProtectedRoute allowedRoles={['admin']}><UserDetail /></ProtectedRoute>} />
            <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['admin']}><ProfileAdmin /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><SettingsAdmin /></ProtectedRoute>} />
            <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={['admin']}><AdminInvoices /></ProtectedRoute>} />
            <Route path="/admin/wallets" element={<ProtectedRoute allowedRoles={['admin']}><AdminWalletManagement /></ProtectedRoute>} />
            <Route path="/admin/disputes" element={<ProtectedRoute allowedRoles={['admin']}><AdminDisputes /></ProtectedRoute>} />
            <Route path="/admin/verifications" element={<ProtectedRoute allowedRoles={['admin']}><VerificationManagement /></ProtectedRoute>} />
            <Route path="/admin/verifications-new" element={<ProtectedRoute allowedRoles={['admin']}><VerificationManagementNew /></ProtectedRoute>} />
            <Route path="/admin/broadcast" element={<ProtectedRoute allowedRoles={['admin']}><BroadcastNotification /></ProtectedRoute>} />
            <Route path="/admin/send-notifications" element={<ProtectedRoute allowedRoles={['admin']}><SendNotifications /></ProtectedRoute>} />
            <Route path="/admin/send-sms" element={<ProtectedRoute allowedRoles={['admin']}><SendSMS /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><NotificationsPageAdmin /></ProtectedRoute>} />
            <Route path="/admin/missions" element={<ProtectedRoute allowedRoles={['admin']}><MissionsManagement /></ProtectedRoute>} />
            <Route path="/admin/missions/archived" element={<ProtectedRoute allowedRoles={['admin']}><ArchivedMissions /></ProtectedRoute>} />
            <Route path="/admin/activity-logs" element={<ProtectedRoute allowedRoles={['admin']}><ActivityLogs /></ProtectedRoute>} />
            <Route path="/admin/pwa-stats" element={<ProtectedRoute allowedRoles={['admin']}><PWAStats /></ProtectedRoute>} />
            <Route path="/admin/install-pwa" element={<ProtectedRoute allowedRoles={['admin']}><InstallPWA /></ProtectedRoute>} />
            <Route path="/admin/system-settings" element={<ProtectedRoute allowedRoles={['admin']}><SystemSettings /></ProtectedRoute>} />
            <Route path="/admin/missions/publish" element={<ProtectedRoute allowedRoles={['admin']}><PublishMission /></ProtectedRoute>} />
            <Route path="/admin/applications" element={<ProtectedRoute allowedRoles={['admin']}><ApplicationsReceivedAdmin /></ProtectedRoute>} />
            <Route path="/admin/missions/billing-frequency" element={<ProtectedRoute allowedRoles={['admin']}><BillingFrequencyManagement /></ProtectedRoute>} />
            <Route path="/admin/missions/locations" element={<ProtectedRoute allowedRoles={['admin']}><MissionLocationsManagement /></ProtectedRoute>} />
            <Route path="/admin/missions/hourly-rates" element={<ProtectedRoute allowedRoles={['admin']}><HourlyRatesManagement /></ProtectedRoute>} />
            <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['admin']}><FeedbackManagement /></ProtectedRoute>} />
            <Route path="/admin/blog" element={<ProtectedRoute allowedRoles={['admin']}><BlogManagement /></ProtectedRoute>} />
            <Route path="/admin/support" element={<ProtectedRoute allowedRoles={['admin']}><SupportAdmin /></ProtectedRoute>} />
            <Route path="/admin/support/:ticketId" element={<ProtectedRoute allowedRoles={['admin']}><SupportAdmin /></ProtectedRoute>} />
            <Route path="/admin/contact" element={<ProtectedRoute allowedRoles={['admin']}><AdminContact /></ProtectedRoute>} />
            <Route path="/admin/devis" element={<ProtectedRoute allowedRoles={['admin']}><AdminDevis /></ProtectedRoute>} />
            <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['admin']}><AdminRoles /></ProtectedRoute>} />
            <Route path="/admin/tutoriels" element={<ProtectedRoute allowedRoles={['admin']}><AdminTutoriels /></ProtectedRoute>} />
            <Route path="/client/dashboard" element={<ProtectedRoute allowedRoles={['client']}><DashboardClient /></ProtectedRoute>} />
            <Route path="/client/publish-mission" element={<ProtectedRoute allowedRoles={['client']}><PublishMission /></ProtectedRoute>} />
            <Route path="/client/missions" element={<ProtectedRoute allowedRoles={['client']}><MissionsList /></ProtectedRoute>} />
            <Route path="/client/missions/:slug" element={<ProtectedRoute allowedRoles={['client']}><MissionDetails /></ProtectedRoute>} />
            <Route path="/client/missions/:slug/edit" element={<ProtectedRoute allowedRoles={['client']}><EditMission /></ProtectedRoute>} />
            <Route path="/client/mission/:missionId" element={<ProtectedRoute allowedRoles={['client']}><MissionDetails /></ProtectedRoute>} />
            <Route path="/client/mission/:missionId/complete-automobs" element={<ProtectedRoute allowedRoles={['client']}><MissionCompleteAutomobs /></ProtectedRoute>} />
            <Route path="/client/applications" element={<ProtectedRoute allowedRoles={['client']}><ApplicationsReceived /></ProtectedRoute>} />
            <Route path="/client/mission/:missionId/timesheets" element={<ProtectedRoute allowedRoles={['client']}><ClientMissionTimesheets /></ProtectedRoute>} />
            <Route path="/client/timesheets" element={<ProtectedRoute allowedRoles={['client']}><TimesheetsList /></ProtectedRoute>} />
            <Route path="/client/timesheet/" element={<Navigate to="/client/timesheets" replace />} />
            <Route path="/client/timesheet/:timesheetId" element={<ProtectedRoute allowedRoles={['client']}><TimesheetReview /></ProtectedRoute>} />
            <Route path="/client/profile" element={<ProtectedRoute allowedRoles={['client']}><ProfileClient /></ProtectedRoute>} />
            <Route path="/client/profile/public/:name" element={<ProtectedRoute allowedRoles={['client']}><PublicProfileClient /></ProtectedRoute>} />
            <Route path="/client/settings" element={<ProtectedRoute allowedRoles={['client']}><SettingsClient /></ProtectedRoute>} />
            <Route path="/client/invoices" element={<ProtectedRoute allowedRoles={['client']}><ClientInvoices /></ProtectedRoute>} />
            <Route path="/client/verify-identity" element={<ProtectedRoute allowedRoles={['client']}><VerifyIdentityClient /></ProtectedRoute>} />
            <Route path="/client/notifications" element={<ProtectedRoute allowedRoles={['client']}><NotificationsPageClient /></ProtectedRoute>} />
            <Route path="/client/disputes" element={<ProtectedRoute allowedRoles={['client']}><ClientDisputes /></ProtectedRoute>} />
            <Route path="/client/disputes/:id" element={<ProtectedRoute allowedRoles={['client']}><DisputeDetails /></ProtectedRoute>} />
            <Route path="/client/support" element={<ProtectedRoute allowedRoles={['client']}><Support /></ProtectedRoute>} />
            <Route path="/client/support/:ticketId" element={<ProtectedRoute allowedRoles={['client']}><Support /></ProtectedRoute>} />
            <Route path="/automob/dashboard" element={<ProtectedRoute allowedRoles={['automob']}><DashboardAutomob /></ProtectedRoute>} />
            <Route path="/automob/missions" element={<ProtectedRoute allowedRoles={['automob']}><AvailableMissions /></ProtectedRoute>} />
            <Route path="/automob/missions/:slug" element={<ProtectedRoute allowedRoles={['automob']}><MissionDetailsAutomob /></ProtectedRoute>} />
            <Route path="/automob/my-applications" element={<ProtectedRoute allowedRoles={['automob']}><MyApplications /></ProtectedRoute>} />
            <Route path="/automob/my-missions" element={<ProtectedRoute allowedRoles={['automob']}><MyMissions /></ProtectedRoute>} />
            <Route path="/automob/completed-missions" element={<ProtectedRoute allowedRoles={['automob']}><CompletedMissions /></ProtectedRoute>} />
            <Route path="/automob/timesheet/create/:missionId" element={<ProtectedRoute allowedRoles={['automob']}><CreateTimesheet /></ProtectedRoute>} />
            <Route path="/automob/timesheet/:timesheetId" element={<ProtectedRoute allowedRoles={['automob']}><CreateTimesheet /></ProtectedRoute>} />
            <Route path="/automob/mission/:missionId/timesheets" element={<ProtectedRoute allowedRoles={['automob']}><MissionTimesheets /></ProtectedRoute>} />
            <Route path="/automob/profile" element={<ProtectedRoute allowedRoles={['automob']}><ProfileAutomob /></ProtectedRoute>} />
            <Route path="/automob/profile/public/:name" element={<ProtectedRoute allowedRoles={['automob']}><PublicProfileAutomob /></ProtectedRoute>} />
            <Route path="/automob/settings" element={<ProtectedRoute allowedRoles={['automob']}><SettingsAutomob /></ProtectedRoute>} />
            <Route path="/automob/invoices" element={<ProtectedRoute allowedRoles={['automob']}><AutomobInvoices /></ProtectedRoute>} />
            <Route path="/automob/wallet" element={<ProtectedRoute allowedRoles={['automob']}><AutomobWallet /></ProtectedRoute>} />
            <Route path="/automob/reviews" element={<ProtectedRoute allowedRoles={['automob']}><AutomobReviews /></ProtectedRoute>} />
            <Route path="/automob/verify-identity" element={<ProtectedRoute allowedRoles={['automob']}><VerifyIdentityAutomob /></ProtectedRoute>} />
            <Route path="/automob/notifications" element={<ProtectedRoute allowedRoles={['automob']}><NotificationsPageAutomob /></ProtectedRoute>} />
            <Route path="/automob/disputes" element={<ProtectedRoute allowedRoles={['automob']}><AutomobDisputes /></ProtectedRoute>} />
            <Route path="/automob/disputes/:id" element={<ProtectedRoute allowedRoles={['automob']}><DisputeDetails /></ProtectedRoute>} />
            <Route path="/automob/support" element={<ProtectedRoute allowedRoles={['automob']}><Support /></ProtectedRoute>} />
            <Route path="/automob/support/:ticketId" element={<ProtectedRoute allowedRoles={['automob']}><Support /></ProtectedRoute>} />

            {/* Routes publiques de profils - accessibles par tous les rôles authentifiés */}
            <Route path="/public/automob/:name" element={<ProtectedRoute><PublicProfileAutomob /></ProtectedRoute>} />
            <Route path="/public/client/:name" element={<ProtectedRoute><PublicProfileClient /></ProtectedRoute>} />

            <Route path="/missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />

            {/* Route 404 - doit être la dernière */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <AIAssistantWidget />
      </SocketProvider>
    </>
  );
};

function App() {
  // Activer l'écoute des notifications en premier plan
  useForegroundNotifications();

  // Service Worker géré automatiquement par Firebase FCM
  // Voir public/firebase-messaging-sw.js
  useEffect(() => {
    // Firebase enregistre automatiquement son service worker
    console.log('[App] Notifications gérées par Firebase FCM');
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="app-theme">
      <ToastContainer />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
