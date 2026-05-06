// Main app — design canvas + clickable hero flow + tweaks panel.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "headlineFont": "serif",
  "accent": "moss",
  "density": "cozy",
  "navStyle": "labeled"
}/*EDITMODE-END*/;

// Frame wrapper — Android-style bezel for each screen
const Phone = ({ children }) => (
  <div style={{
    width: 412 + 16, height: 828 + 32 + 16, padding: 8,
    background: '#1d1b20', borderRadius: 38, boxShadow: 'var(--sh-3)',
    position: 'relative',
  }}>
    <div style={{
      position: 'absolute', left: '50%', top: 22, transform: 'translateX(-50%)',
      width: 18, height: 18, borderRadius: 9, background: '#0a0a0a', zIndex: 10,
    }}/>
    <div style={{ width: 412, height: 828 + 32, borderRadius: 30, overflow: 'hidden', background: 'var(--paper)' }}>
      {children}
    </div>
  </div>
);

// =========== Hero clickable prototype ===========
const HeroPrototype = ({ initial = 'splash', guest = false }) => {
  const [screen, setScreen] = React.useState(initial);
  const [isGuest, setIsGuest] = React.useState(guest);
  const goto = (s) => {
    // Authenticating clears guest mode
    if (s === 'auth' || s === 'welcome' || s === 'onbDone' || s === 'map') setIsGuest(false);
    setScreen(s);
  };
  const onTab = (id) => {
    if (isGuest && (id === 'logbook' || id === 'inbox' || id === 'me')) {
      setScreen('wall:' + id);
      return;
    }
    const map = { map: 'map', logbook: 'logbook', market: isGuest ? 'marketGuest' : 'market', inbox: 'inbox', me: 'me' };
    if (map[id]) setScreen(map[id]);
  };

  // Login walls
  if (screen.startsWith('wall:')) {
    const t = screen.slice(5);
    return <LoginWall goto={goto} onTab={onTab} tab={t}/>;
  }

  const screens = {
    splash: <SplashScreen goto={goto}/>,
    auth: <AuthScreen goto={goto}/>,
    welcome: <WelcomeScreen goto={goto}/>,
    onbProfile: <OnbProfile goto={goto}/>,
    onbBoat: <OnbBoat goto={goto}/>,
    onbVerify: <OnbVerify goto={goto}/>,
    onbDone: <OnbDone goto={goto}/>,
    home: <MapScreen goto={goto} onTab={onTab}/>,
    map: <MapScreen goto={goto} onTab={onTab} guest={isGuest}/>,
    logbook: <LogbookScreen goto={goto} onTab={onTab}/>,
    logbookEntry: <LogbookEntry goto={goto}/>,
    logbookNew: <LogbookNew goto={goto}/>,
    checkin: <CheckInModal goto={goto}/>,
    market: <MarketScreen goto={goto} onTab={onTab}/>,
    marketGuest: <MarketScreen goto={goto} onTab={onTab} isGuest/>,
    product: <ProductScreen goto={goto}/>,
    messageSeller: <MessageSellerModal goto={goto}/>,
    createListing: <CreateListing goto={goto}/>,
    serviceDetail: <ServiceDetail goto={goto}/>,
    inbox: <InboxScreen goto={goto} onTab={onTab}/>,
    messageThread: <MessageThread goto={goto}/>,
    hailThread: <HailThread goto={goto}/>,
    hailBoat: <HailBoatModal goto={goto}/>,
    me: <ProfileScreen goto={goto} onTab={onTab}/>,
    settings: <SettingsScreen goto={goto}/>,
    settingsBoats: <SettingsBoats goto={goto}/>,
    settingsPrivacy: <SettingsPrivacy goto={goto}/>,
    friends: <FriendsScreen goto={goto}/>,
    hazardDetail: <HazardDetailModal goto={goto}/>,
    reportHazard: <ReportHazardModal goto={goto}/>,
    tradeSetup: <TradeSetup goto={goto}/>,
    myServices: <MyServices goto={goto}/>,
    myListings: <ProfileScreen goto={goto} onTab={onTab}/>,
  };

  return <Phone>{screens[screen] || screens.splash}</Phone>;
};

// =========== App root ===========
const App = () => {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-serif',
      tweaks.headlineFont === 'sans'
        ? "'Plus Jakarta Sans', sans-serif"
        : "'Fraunces', Georgia, serif"
    );
    if (tweaks.accent === 'depth') {
      document.documentElement.style.setProperty('--moss', '#114A52');
      document.documentElement.style.setProperty('--moss-soft', '#DCE7E9');
    } else if (tweaks.accent === 'amber') {
      document.documentElement.style.setProperty('--moss', '#9B6A1F');
      document.documentElement.style.setProperty('--moss-soft', '#F5ECD8');
    } else {
      document.documentElement.style.setProperty('--moss', '#1A6B5A');
      document.documentElement.style.setProperty('--moss-soft', '#E0EDE8');
    }
  }, [tweaks]);

  const ab = (id, label, screen, opts = {}) => (
    <DCArtboard id={id} label={label} width={444} height={876}>
      <HeroPrototype initial={screen} guest={opts.guest}/>
    </DCArtboard>
  );

  return (
    <>
      <DesignCanvas title="Waterline" subtitle="Mobile app · v2 system · clickable prototype · tap any screen to enter the flow">
        <DCSection id="proto" title="↳ Click-through prototype" subtitle="Open any artboard fullscreen — every button works. Start anywhere.">
          {ab('p-map', 'Map · home', 'map')}
          {ab('p-splash', 'Splash', 'splash')}
          {ab('p-guest', 'Guest browse', 'marketGuest', { guest: true })}
        </DCSection>

        <DCSection id="onb" title="Onboarding" subtitle="Splash → Auth → 4-step setup. Boat & verification are skippable upgrades.">
          {ab('o-splash', '01 Splash', 'splash')}
          {ab('o-auth', '02 Auth', 'auth')}
          {ab('o-welcome', '03 Welcome', 'welcome')}
          {ab('o-profile', '04 Profile', 'onbProfile')}
          {ab('o-boat', '05 Add boat', 'onbBoat')}
          {ab('o-verify', '06 Verify boat', 'onbVerify')}
          {ab('o-done', '07 Aboard', 'onbDone')}
        </DCSection>

        <DCSection id="walls" title="Guest mode &amp; gating" subtitle="Guests can browse the map &amp; market; gated tabs prompt login.">
          {ab('g-market', 'Market · guest', 'marketGuest', { guest: true })}
          {ab('g-wall-log', 'Wall · Logbook', 'wall:logbook', { guest: true })}
          {ab('g-wall-inbox', 'Wall · Inbox', 'wall:inbox', { guest: true })}
          {ab('g-wall-me', 'Wall · Me', 'wall:me', { guest: true })}
        </DCSection>

        <DCSection id="map" title="Map · the hero" subtitle="Stylised UK network ↔ focused stretch. Hazard / friend / service layers. Tap pins to open sheets.">
          {ab('m-map', 'Map · detail', 'map')}
          {ab('m-checkin', 'Check-in sheet', 'checkin')}
          {ab('m-haz', 'Hazard detail', 'hazardDetail')}
          {ab('m-rep', 'Report hazard', 'reportHazard')}
        </DCSection>

        <DCSection id="log" title="Logbook" subtitle="Promoted to the centre tab — your journey, your record. New entries support @plate mentions.">
          {ab('l-log', 'Logbook timeline', 'logbook')}
          {ab('l-new', 'New entry', 'logbookNew')}
          {ab('l-entry', 'Stay detail', 'logbookEntry')}
        </DCSection>

        <DCSection id="market" title="Marketplace" subtitle="Products / Services toggle. Service listings come from trade profiles.">
          {ab('mk-home', 'Browse products', 'market')}
          {ab('mk-product', 'Listing detail', 'product')}
          {ab('mk-msg', 'Message seller', 'messageSeller')}
          {ab('mk-new', 'Create listing', 'createListing')}
          {ab('mk-svc', 'Service listing', 'serviceDetail')}
        </DCSection>

        <DCSection id="inbox" title="Inbox &amp; messaging" subtitle="Threads from listings, hails, friends and CRT all in one place. Hails are first-message-from-stranger and can be hidden.">
          {ab('i-inbox', 'Inbox', 'inbox')}
          {ab('i-thread', 'Thread', 'messageThread')}
          {ab('i-hail-thread', 'Hail thread', 'hailThread')}
          {ab('i-hail', 'Hail a boat', 'hailBoat')}
        </DCSection>

        <DCSection id="me" title="Me &amp; settings" subtitle="Layered identity: community member by default; boat &amp; trade are upgrades.">
          {ab('me-prof', 'Profile', 'me')}
          {ab('me-friends', 'Friends', 'friends')}
          {ab('me-set', 'Settings', 'settings')}
          {ab('me-boats', 'Boats &amp; verification', 'settingsBoats')}
          {ab('me-priv', 'Privacy', 'settingsPrivacy')}
        </DCSection>

        <DCSection id="trade" title="Trade profile" subtitle="Boaters who offer services — verification, listings, leads.">
          {ab('t-setup', 'Trade setup', 'tradeSetup')}
          {ab('t-mysvc', 'My services', 'myServices')}
        </DCSection>
      </DesignCanvas>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection title="Type">
          <TweakRadio label="Headline font" value={tweaks.headlineFont} onChange={(v) => setTweak('headlineFont', v)}
            options={[{ value: 'serif', label: 'Fraunces' }, { value: 'sans', label: 'Jakarta' }]}/>
        </TweakSection>
        <TweakSection title="Accent colour">
          <TweakRadio value={tweaks.accent} onChange={(v) => setTweak('accent', v)}
            options={[
              { value: 'moss', label: 'Moss' },
              { value: 'depth', label: 'Depth' },
              { value: 'amber', label: 'Amber' },
            ]}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
