import { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useIsDesktop } from './utils/useIsDesktop';
import TabBar from './components/TabBar';
import SplashScreen from './screens/SplashScreen';
import AuthScreen from './screens/AuthScreen';
import MapScreen from './screens/MapScreen';
import MarketScreen from './screens/MarketScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import ServiceDetailScreen from './screens/ServiceDetailScreen';
import CreateListingScreen from './screens/CreateListingScreen';
import InboxScreen from './screens/InboxScreen';
import MessageThreadScreen from './screens/MessageThreadScreen';
import LogbookScreen from './screens/LogbookScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import SettingsBoatsScreen from './screens/SettingsBoatsScreen';
import ProfileIdentityScreen from './screens/ProfileIdentityScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import SettingsPrivacyScreen from './screens/SettingsPrivacyScreen';
import FriendsScreen from './screens/FriendsScreen';
import TradeSetupScreen from './screens/TradeSetupScreen';
import HazardDetailScreen from './screens/HazardDetailScreen';
import ReportHazardScreen from './screens/ReportHazardScreen';
import AdminScreen from './screens/AdminScreen';
import PublicProfileScreen from './screens/PublicProfileScreen';
import MessagesScreen from './screens/MessagesScreen';
import WelcomeScreen from './screens/onboarding/WelcomeScreen';
import OnbProfileScreen from './screens/onboarding/OnbProfileScreen';
import OnbBoatScreen from './screens/onboarding/OnbBoatScreen';
import OnbVerifyScreen from './screens/onboarding/OnbVerifyScreen';
import OnbDoneScreen from './screens/onboarding/OnbDoneScreen';
import FirstVisitChoiceScreen, { hasMadeFirstVisitChoice } from './screens/FirstVisitChoiceScreen';
import DesktopMarketScreen from './screens/desktop/DesktopMarketScreen';
import DesktopProductDetailScreen from './screens/desktop/DesktopProductDetailScreen';
import DesktopFeaturesScreen from './screens/desktop/DesktopFeaturesScreen';

function Layout() {
  return (
    <div className="app-shell">
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Outlet />
      </div>
      <TabBar />
    </div>
  );
}

// Routes for the desktop website (only used when not logged in on a large screen).
function DesktopRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DesktopMarketScreen />} />
      <Route path="/market" element={<DesktopMarketScreen />} />
      <Route path="/market/product/:id" element={<DesktopProductDetailScreen />} />
      <Route path="/market/service/:id" element={<DesktopProductDetailScreen />} />
      <Route path="/features" element={<DesktopFeaturesScreen />} />
      {/* Onboarding still works on desktop in case someone follows the link directly */}
      <Route path="/onboarding/welcome" element={<WelcomeScreen />} />
      <Route path="/onboarding/profile" element={<OnbProfileScreen />} />
      <Route path="/onboarding/boat" element={<OnbBoatScreen />} />
      <Route path="/onboarding/verify" element={<OnbVerifyScreen />} />
      <Route path="/onboarding/done" element={<OnbDoneScreen />} />
      <Route path="/auth" element={<AuthScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password" element={<ForgotPasswordScreen />} />
      {/* Anything else on desktop redirects to the marketplace home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// The existing mobile-shaped app — unchanged behaviour.
function MobileRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public / auth */}
      <Route path="/" element={user ? <Navigate to="/map" replace /> : <SplashScreen />} />
      <Route path="/auth" element={<AuthScreen />} />

      {/* Onboarding */}
      <Route path="/onboarding/welcome" element={<WelcomeScreen />} />
      <Route path="/onboarding/profile" element={<OnbProfileScreen />} />
      <Route path="/onboarding/boat" element={<OnbBoatScreen />} />
      <Route path="/onboarding/verify" element={<OnbVerifyScreen />} />
      <Route path="/onboarding/done" element={<OnbDoneScreen />} />

      {/* Full-page screens (no tab bar) */}
      <Route path="/market/product/:id" element={<ProductDetailScreen />} />
      <Route path="/market/service/:id" element={<ServiceDetailScreen />} />
      <Route path="/market/new" element={<CreateListingScreen />} />
      <Route path="/market/edit/:id" element={<CreateListingScreen />} />
      <Route path="/inbox/:threadId" element={<MessageThreadScreen />} />
      <Route path="/inbox/listing/:listingId/:threadId" element={<MessageThreadScreen />} />
      <Route path="/hazard/:id" element={<HazardDetailScreen />} />
      <Route path="/report-hazard" element={<ReportHazardScreen />} />
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/settings/boats" element={<SettingsBoatsScreen />} />
      <Route path="/settings/profile" element={<ProfileIdentityScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/reset-password" element={<ForgotPasswordScreen />} />
      <Route path="/settings/privacy" element={<SettingsPrivacyScreen />} />
      <Route path="/friends" element={<FriendsScreen />} />
      <Route path="/trade-setup" element={<TradeSetupScreen />} />
      <Route path="/admin" element={<AdminScreen />} />
      <Route path="/profile/:userId" element={<PublicProfileScreen />} />
      <Route path="/messages" element={<MessagesScreen />} />

      {/* Main tabs with tab bar */}
      <Route element={<Layout />}>
        <Route path="/map" element={<MapScreen />} />
        <Route path="/market" element={<MarketScreen />} />
        <Route path="/inbox" element={<InboxScreen />} />
        <Route path="/logbook" element={<LogbookScreen />} />
        <Route path="/me" element={<ProfileScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { loading, user } = useAuth();
  const isDesktop = useIsDesktop();
  const location = useLocation();

  const [showChoice, setShowChoice] = useState(() => !hasMadeFirstVisitChoice());

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, background: 'var(--paper)' }}>
        <div style={{ color: 'var(--moss)', fontFamily: 'var(--font-serif)', fontSize: 28, fontStyle: 'italic' }}>Waterline</div>
        <span className="wl-spinner lg" />
      </div>
    );
  }

  // First-time visitor (any device, not logged in) sees the choice page first.
  // Logged-in users skip it — they've clearly been here before.
  // Skip it too on the onboarding routes (so the QR-code phone link goes straight to onboarding).
  const isOnboardingRoute = location.pathname.startsWith('/onboarding/');
  if (showChoice && !user && !isOnboardingRoute) {
    return <FirstVisitChoiceScreen onChoose={() => setShowChoice(false)} />;
  }

  // Desktop visitors who aren't logged in get the website.
  if (isDesktop && !user) {
    return <DesktopRoutes />;
  }

  return <MobileRoutes />;
}
