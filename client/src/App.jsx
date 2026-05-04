import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import TabBar from './components/TabBar';
import SplashScreen from './screens/SplashScreen';
import AuthScreen from './screens/AuthScreen';
import MapScreen from './screens/MapScreen';
import MarketScreen from './screens/MarketScreen';
import InboxScreen from './screens/InboxScreen';
import LogbookScreen from './screens/LogbookScreen';
import ProfileScreen from './screens/ProfileScreen';
import WelcomeScreen from './screens/onboarding/WelcomeScreen';
import OnbProfileScreen from './screens/onboarding/OnbProfileScreen';
import OnbBoatScreen from './screens/onboarding/OnbBoatScreen';
import OnbVerifyScreen from './screens/onboarding/OnbVerifyScreen';
import OnbDoneScreen from './screens/onboarding/OnbDoneScreen';

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

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)' }}>
        <div style={{ color: 'var(--moss)', fontFamily: 'var(--font-serif)', fontSize: 28, fontStyle: 'italic' }}>Waterline</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/auth" element={<AuthScreen />} />
      <Route path="/onboarding/welcome" element={<WelcomeScreen />} />
      <Route path="/onboarding/profile" element={<OnbProfileScreen />} />
      <Route path="/onboarding/boat" element={<OnbBoatScreen />} />
      <Route path="/onboarding/verify" element={<OnbVerifyScreen />} />
      <Route path="/onboarding/done" element={<OnbDoneScreen />} />
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
