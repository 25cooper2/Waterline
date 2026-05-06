// Profile, settings, friends, hazard, report hazard, create listing, service detail, trade setup, my services.

const ProfileScreen = ({ goto, onTab }) => (
  <div className="wl-screen">
    <StatusBar/>
    <AppBar title="Me" large
      trailing={<button onClick={() => goto('settings')} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}><Icon name="settings" size={18}/></button>}/>
    <div className="wl-scroll">
      <div style={{ padding: '4px 20px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <Avatar name="Hannah Whitaker" size={72} hue={150}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em' }}>Hannah W.</div>
          <div style={{ fontSize: 13, color: 'var(--silt)' }}>@hannah_w</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Plate large>LST557</Plate>
            <span style={{ fontSize: 13.5, color: 'var(--silt)' }}>NB Tilly Mint</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <Chip tone="moss"><Icon name="verified" size={11} stroke={2}/>Verified boat</Chip>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--reed)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
        {[
          { label: 'Listings', value: '3', screen: 'myListings' },
          { label: 'Logbook', value: '47', screen: 'logbook' },
          { label: 'Friends', value: '12', screen: 'friends' },
        ].map(s => (
          <button key={s.label} onClick={() => goto(s.screen)} style={{ background: 'var(--paper)', border: 0, padding: '16px 8px', textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div className="wl-mono" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--silt)', marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Trade upgrade card */}
      <div style={{ margin: 20, padding: 16, background: 'oklch(0.97 0.018 165)', borderRadius: 14, border: '1px solid oklch(0.88 0.04 165)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="wrench" size={18} color="var(--paper)"/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Offer your services</div>
            <div style={{ fontSize: 13, color: 'var(--silt)' }}>Become a Waterline Trade and get hired by boaters</div>
          </div>
        </div>
        <button onClick={() => goto('tradeSetup')} className="wl-btn is-ghost is-block" style={{ background: 'var(--paper)' }}>Set up trade profile</button>
      </div>

      <SectionHeader>My listings</SectionHeader>
      <div style={{ padding: '0 20px 8px' }}>
        {[
          { title: 'Outboard Engine 15hp', price: '£450', cat: 'ENGINE', inq: 3, hue: 200 },
          { title: 'Solar Controller', price: '£45', cat: 'ELECTRICAL', inq: 1, hue: 50 },
          { title: 'Brass mushroom vents', price: '£28', cat: 'FITTINGS', inq: 0, hue: 70 },
        ].map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--reed)' : 0 }}>
            <ImgPH label={it.cat} h={64} hue={it.hue}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5 }}>{it.title}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{it.price}</span>
                <span style={{ fontSize: 12.5, color: 'var(--silt)' }}>· {it.inq} {it.inq === 1 ? 'inquiry' : 'inquiries'}</span>
              </div>
            </div>
            <Icon name="chevron" size={16} color="var(--pebble)"/>
          </div>
        ))}
      </div>

      <SectionHeader action={<a style={{ fontSize: 12.5, color: 'var(--moss)', fontWeight: 600 }}>Manage</a>}>Friends &amp; following</SectionHeader>
      <div style={{ padding: '0 20px 24px', display: 'flex', gap: 14, overflow: 'auto' }}>
        {[
          { name: 'Jess Marlowe', plate: 'KIT241', online: true, hue: 140 },
          { name: 'Tom Reed', plate: 'OTR889', online: true, hue: 200 },
          { name: 'Bea Carter', plate: 'WND322', online: false, hue: 30 },
          { name: 'Will F.', plate: 'GLT104', online: false, hue: 60 },
          { name: 'Suki', plate: 'SKK557', online: true, hue: 280 },
        ].map(f => (
          <div key={f.plate} style={{ textAlign: 'center', flexShrink: 0, width: 64 }}>
            <Avatar name={f.name} size={56} hue={f.hue} online={f.online}/>
            <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 6, lineHeight: 1.2 }} className="wl-truncate">{f.name.split(' ')[0]}</div>
            <Plate>{f.plate}</Plate>
          </div>
        ))}
      </div>
    </div>
    <TabBar active="me" onChange={onTab}/>
    <GestureBar/>
  </div>
);

const SettingsScreen = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <AppBar title="Settings" onBack={() => goto('me')}/>
    <div className="wl-scroll">
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name="Hannah Whitaker" size={50} hue={150}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5 }}>Hannah Whitaker</div>
          <div style={{ fontSize: 13, color: 'var(--silt)' }}>Member since July 2019</div>
        </div>
      </div>

      <SectionHeader>Account</SectionHeader>
      <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
        {[
          { icon: 'me', label: 'Profile & identity', screen: null },
          { icon: 'boat', label: 'Boats & verification', meta: '1 boat', screen: 'settingsBoats' },
          { icon: 'wrench', label: 'My services', meta: 'Trade off', screen: 'myServices' },
          { icon: 'shield', label: 'Privacy & visibility', screen: 'settingsPrivacy' },
          { icon: 'bell', label: 'Notifications' },
        ].map(r => (
          <div key={r.label} className="wl-row" style={{ cursor: 'pointer' }} onClick={() => r.screen && goto(r.screen)}>
            <Icon name={r.icon} size={20} color="var(--silt)"/>
            <div style={{ flex: 1, fontSize: 15 }}>{r.label}</div>
            {r.meta && <span style={{ fontSize: 13, color: 'var(--silt)' }}>{r.meta}</span>}
            <Icon name="chevron" size={16} color="var(--pebble)"/>
          </div>
        ))}
      </div>

      <SectionHeader>Hidden &middot; 2 active</SectionHeader>
      <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
        {[
          { name: 'jamie_k', when: 'Hidden 5d ago' },
          { name: 'old_skipper', when: 'Hidden 12d ago' },
        ].map(b => (
          <div key={b.name} className="wl-row">
            <Avatar name={b.name} size={36} hue={300}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>@{b.name}</div>
              <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>{b.when}</div>
            </div>
            <button className="wl-btn is-ghost" style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}>Unhide</button>
          </div>
        ))}
      </div>

      <SectionHeader>Support</SectionHeader>
      <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
        {['Help centre', "Boater's Guarantee", 'Community guidelines', 'Contact support'].map(l => (
          <div key={l} className="wl-row" style={{ cursor: 'pointer' }}>
            <div style={{ flex: 1, fontSize: 15 }}>{l}</div>
            <Icon name="chevron" size={16} color="var(--pebble)"/>
          </div>
        ))}
      </div>

      <div style={{ padding: 20 }}>
        <button className="wl-btn is-ghost is-block" style={{ marginBottom: 8 }}><Icon name="logout" size={18}/> Log out</button>
        <button className="wl-btn is-text" style={{ width: '100%', color: 'var(--rust)' }}>Delete account</button>
      </div>

      <div style={{ textAlign: 'center', padding: '8px 0 24px', fontSize: 11, color: 'var(--pebble)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
        WATERLINE 2.4.0 · BUILT FOR THE WATERWAYS
      </div>
    </div>
    <GestureBar/>
  </div>
);

// ===== Settings: Boats & verification =====
const SettingsBoats = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <AppBar title="Boats &amp; verification" onBack={() => goto('settings')}/>
    <div className="wl-scroll">
      <div style={{ padding: '12px 20px 0', fontSize: 13.5, color: 'var(--silt)', lineHeight: 1.5 }}>
        Add up to 3 boats to your account. Verification builds trust on the marketplace and unlocks the verified badge.
      </div>

      {[
        { name: 'Tilly Mint', plate: 'LST557', type: 'Narrowboat · 57ft', verified: true, primary: true, hue: 150 },
        { name: 'Otterling', plate: 'OTL902', type: 'Cruiser · 28ft', verified: false, primary: false, hue: 200 },
      ].map((b, i) => (
        <div key={b.plate} className="wl-card" style={{ margin: '14px 20px', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <ImgPH label="BOAT" h={56} hue={b.hue} ratio="1"/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>NB {b.name}</span>
                {b.primary && <Chip>Primary</Chip>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <Plate>{b.plate}</Plate>
                <span style={{ fontSize: 12.5, color: 'var(--silt)' }}>{b.type}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: b.verified ? 'var(--moss-soft)' : 'var(--linen)', borderRadius: 10 }}>
            <Icon name={b.verified ? 'verified' : 'clock'} size={18} color={b.verified ? 'var(--moss)' : 'var(--silt)'} stroke={2}/>
            <div style={{ flex: 1, fontSize: 13.5 }}>
              {b.verified ? <strong>Verified boat</strong> : <strong>Verification pending</strong>}
              <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>
                {b.verified ? 'CRT licence confirmed 12 Mar 2024' : 'Upload your CRT licence to verify'}
              </div>
            </div>
            {!b.verified && <button className="wl-btn is-ghost" style={{ height: 32, padding: '0 12px', fontSize: 12.5 }}>Upload</button>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="wl-btn is-ghost" style={{ flex: 1, height: 38, fontSize: 13 }}>Edit details</button>
            {!b.primary && <button className="wl-btn is-ghost" style={{ flex: 1, height: 38, fontSize: 13 }}>Make primary</button>}
            <button className="wl-btn is-ghost" style={{ flex: 0, padding: '0 12px', height: 38, color: 'var(--rust)' }}><Icon name="more"/></button>
          </div>
        </div>
      ))}

      <div style={{ padding: '0 20px 24px' }}>
        <button className="wl-btn is-ghost is-block"><Icon name="plus" size={18}/> Add another boat</button>
      </div>
    </div>
    <GestureBar/>
  </div>
);

// ===== Settings: Privacy =====
const SettingsPrivacy = ({ goto }) => {
  const [loc, setLoc] = React.useState('friends');
  const [hails, setHails] = React.useState(true);
  const [verified, setVerified] = React.useState(true);
  const [logbook, setLogbook] = React.useState(false);
  return (
    <div className="wl-screen">
      <StatusBar/>
      <AppBar title="Privacy &amp; visibility" onBack={() => goto('settings')}/>
      <div className="wl-scroll">
        <SectionHeader>Location sharing</SectionHeader>
        <div style={{ padding: '4px 20px 16px', fontSize: 13, color: 'var(--silt)', lineHeight: 1.5 }}>
          When can other boaters see where you&rsquo;re moored?
        </div>
        <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
          {[
            { id: 'public', label: 'Anyone on Waterline', sub: 'Verified members can see your last check-in' },
            { id: 'friends', label: 'Only friends', sub: 'People you follow back can see your location' },
            { id: 'private', label: 'Off — never share', sub: 'Your location stays private to you' },
          ].map(o => (
            <div key={o.id} onClick={() => setLoc(o.id)} className="wl-row" style={{ cursor: 'pointer', alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid', borderColor: loc === o.id ? 'var(--moss)' : 'var(--reed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                {loc === o.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--moss)' }}/>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{o.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 2 }}>{o.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <SectionHeader>Who can contact you</SectionHeader>
        <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
          {[
            { label: 'Allow hails by boat index', sub: 'Strangers can message you using your plate', val: hails, set: setHails },
            { label: 'Verified boats only', sub: 'Hide hails from unverified accounts', val: verified, set: setVerified },
            { label: 'Show logbook to friends', sub: 'Friends can see where you\'ve been', val: logbook, set: setLogbook },
          ].map(t => (
            <div key={t.label} className="wl-row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{t.label}</div>
                <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 2 }}>{t.sub}</div>
              </div>
              <Toggle on={t.val} onClick={() => t.set(!t.val)}/>
            </div>
          ))}
        </div>

        <SectionHeader>Profile visibility</SectionHeader>
        <div style={{ background: 'var(--paper)', borderTop: '1px solid var(--reed)', borderBottom: '1px solid var(--reed)' }}>
          {[
            'Show real name (full) on profile',
            'Show boat make &amp; length',
            'Allow appearing in nearby search',
          ].map(l => (
            <div key={l} className="wl-row">
              <div style={{ flex: 1, fontSize: 14.5 }} dangerouslySetInnerHTML={{ __html: l }}/>
              <Toggle on={Math.random() > 0.4}/>
            </div>
          ))}
        </div>

        <div style={{ height: 30 }}/>
      </div>
      <GestureBar/>
    </div>
  );
};

// ===== Friends =====
const FriendsScreen = ({ goto }) => {
  const [tab, setTab] = React.useState('following');
  const [following, setFollowing] = React.useState(['KIT241', 'OTR889', 'SKK557', 'WND322', 'GLT104', 'IBS887']);
  const togg = (p) => setFollowing(f => f.includes(p) ? f.filter(x => x !== p) : [...f, p]);
  const items = {
    following: [
      { name: 'Jess Marlowe', plate: 'KIT241', loc: 'Mile End · 0.4 mi', online: true, hue: 140 },
      { name: 'Tom Reed', plate: 'OTR889', loc: 'Mile End · 0.6 mi', online: true, hue: 200 },
      { name: 'Suki Aoki', plate: 'SKK557', loc: 'Camden · 4.2 mi', online: true, hue: 280 },
      { name: 'Bea Carter', plate: 'WND322', loc: 'Last seen Oxford · 64 mi', online: false, hue: 30 },
      { name: 'Will F.', plate: 'GLT104', loc: 'Last seen 3d ago', online: false, hue: 60 },
      { name: 'Marian D.', plate: 'IBS887', loc: 'Sharing off', online: false, hue: 320 },
    ],
    followers: [
      { name: 'Sam P.', plate: 'ABC123', loc: '1.2 mi', online: true, hue: 210 },
      { name: 'Pete H.', plate: 'SLV719', loc: 'Last seen Birmingham', online: false, hue: 80 },
      { name: 'River Runner', plate: 'FLT009', loc: 'Brentford · 8 mi', online: true, hue: 90 },
    ],
    find: [],
  }[tab];
  return (
    <div className="wl-screen">
      <StatusBar/>
      <AppBar title="Friends" onBack={() => goto('me')}
        trailing={<button onClick={() => goto('settingsPrivacy')} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}><Icon name="settings" size={18}/></button>}/>
      <div style={{ padding: '0 20px 12px', display: 'flex', gap: 6, borderBottom: '1px solid var(--reed)', paddingBottom: 12, paddingTop: 4 }}>
        <Chip active={tab === 'following'} outline={tab !== 'following'} onClick={() => setTab('following')}>Following · 12</Chip>
        <Chip active={tab === 'followers'} outline={tab !== 'followers'} onClick={() => setTab('followers')}>Followers · 8</Chip>
        <Chip active={tab === 'find'} outline={tab !== 'find'} onClick={() => setTab('find')}>Find</Chip>
      </div>
      <div className="wl-scroll">
        {tab === 'find' ? (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--linen)', borderRadius: 10, marginBottom: 16 }}>
              <Icon name="search" size={18} color="var(--silt)"/>
              <input placeholder="Search by name, username or plate" style={{ border: 0, outline: 0, fontSize: 14.5, flex: 1, background: 'transparent', fontFamily: 'var(--font-sans)' }}/>
            </div>
            <div className="wl-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silt)', marginBottom: 8 }}>Suggestions — moored nearby</div>
            {[
              { name: 'Pat Stockwell', plate: 'PAT001', loc: 'Mile End · 0.3 mi', hue: 70 },
              { name: 'Ada Lovell', plate: 'ADL122', loc: 'Mile End · 0.5 mi', hue: 320 },
            ].map(f => (
              <div key={f.plate} className="wl-row" style={{ padding: '12px 0' }}>
                <Avatar name={f.name} size={44} hue={f.hue}/>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{f.name}</span>
                    <Plate>{f.plate}</Plate>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 2 }}>{f.loc}</div>
                </div>
                <button onClick={() => togg(f.plate)} className={following.includes(f.plate) ? 'wl-btn is-ghost' : 'wl-btn is-primary'} style={{ height: 34, padding: '0 14px', fontSize: 13 }}>
                  {following.includes(f.plate) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          items.map(f => {
            const isFollowing = following.includes(f.plate);
            return (
              <div key={f.plate} className="wl-row">
                <Avatar name={f.name} size={46} hue={f.hue} online={f.online}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{f.name}</span>
                    <Plate>{f.plate}</Plate>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 2 }}>{f.loc}</div>
                </div>
                <button onClick={() => togg(f.plate)} className={isFollowing ? 'wl-btn is-ghost' : 'wl-btn is-primary'} style={{ height: 34, padding: '0 14px', fontSize: 13 }}>
                  {isFollowing ? 'Following' : 'Follow back'}
                </button>
              </div>
            );
          })
        )}
      </div>
      <GestureBar/>
    </div>
  );
};

// =================== HAZARD ===================
const HazardDetailModal = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <AppBar title="Hazard" onBack={() => goto('map')}
      trailing={<button style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)' }}><Icon name="more"/></button>}/>
    <div className="wl-scroll">
      <ImgPH label="HAZARD PHOTO · 3 OF 5" h={220} hue={30}/>
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <SeverityBadge level="high"/>
          <Chip outline>Obstruction</Chip>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 8px', lineHeight: 1.15 }}>Sunken narrowboat</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--silt)', marginBottom: 16 }}>
          <Icon name="pin" size={14}/>
          <span>Regent's Canal · Bridge 42, near Victoria Park</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'Reported', value: '2 days ago' },
            { label: 'Confirmed', value: '12 boaters' },
            { label: 'Expires', value: '28 days' },
          ].map(s => (
            <div key={s.label} style={{ padding: 12, background: 'var(--linen)', borderRadius: 10 }}>
              <div className="wl-mono" style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--silt)' }}>{s.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="wl-label">Description</div>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: '4px 0 20px' }}>
          A sunken narrowboat is partially obstructing the canal near bridge 42. The hull is submerged just below the water line and may not be immediately visible during high glare. Pass with extreme caution and keep to the towpath side. CRT have been notified.
        </p>

        <div className="wl-label">Reported by</div>
        <div className="wl-card" style={{ padding: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name="Tom Reed" size={42} hue={200}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>Tom Reed <Plate>OTR889</Plate></div>
            <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>Verified boat · 8 hazards reported</div>
          </div>
        </div>

        <div style={{ marginTop: 20, padding: 14, background: 'oklch(0.97 0.018 165)', borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Is this still here?</div>
          <div style={{ fontSize: 13, color: 'var(--silt)' }}>Confirming or clearing helps every boater on this stretch.</div>
        </div>
      </div>
    </div>
    <div style={{ padding: 16, borderTop: '1px solid var(--reed)', display: 'flex', gap: 8 }}>
      <button onClick={() => goto('map')} className="wl-btn is-ghost" style={{ flex: 1 }}><Icon name="close" size={16}/> Not here anymore</button>
      <button onClick={() => goto('map')} className="wl-btn is-primary" style={{ flex: 1 }}><Icon name="check" size={16} color="var(--paper)"/> It's still here</button>
    </div>
    <GestureBar/>
  </div>
);

const ReportHazardModal = ({ goto }) => {
  const [sev, setSev] = React.useState('med');
  const [type, setType] = React.useState('obstruction');
  const types = [
    { id: 'obstruction', label: 'Obstruction', icon: 'warning' },
    { id: 'lock', label: 'Lock closure', icon: 'lock-open' },
    { id: 'water', label: 'Water level', icon: 'water' },
    { id: 'crt', label: 'CRT works', icon: 'wrench' },
    { id: 'theft', label: 'Theft / antisocial', icon: 'shield' },
    { id: 'towpath', label: 'Towpath issue', icon: 'pin' },
    { id: 'wildlife', label: 'Wildlife', icon: 'star' },
    { id: 'other', label: 'Other', icon: 'more' },
  ];
  return (
    <div className="wl-screen">
      <StatusBar/>
      <AppBar title="Report a hazard" onBack={() => goto('map')}/>
      <div className="wl-scroll" style={{ padding: '16px 20px 0' }}>
        <div style={{ padding: 14, background: 'var(--linen)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18 }}>
          <Icon name="pin" size={18} color="var(--moss)"/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Mile End, Regent's Canal</div>
            <div style={{ fontSize: 12, color: 'var(--silt)' }}>Using your current location</div>
          </div>
          <a style={{ fontSize: 13, color: 'var(--moss)', fontWeight: 600 }}>Adjust</a>
        </div>

        <label className="wl-label">Hazard type</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {types.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              padding: '14px', border: '1.5px solid', borderRadius: 10, cursor: 'pointer',
              borderColor: type === t.id ? 'var(--moss)' : 'var(--reed)',
              background: type === t.id ? 'var(--moss-soft)' : 'var(--paper)',
              display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-sans)',
              fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', textAlign: 'left',
            }}>
              <Icon name={t.icon} size={18} color={type === t.id ? 'var(--moss)' : 'var(--silt)'}/>
              {t.label}
            </button>
          ))}
        </div>

        <label className="wl-label">Severity</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {[{ id: 'low', label: 'Low' }, { id: 'med', label: 'Medium' }, { id: 'high', label: 'High' }].map(s => (
            <button key={s.id} onClick={() => setSev(s.id)} style={{
              flex: 1, padding: '12px 0', border: '1.5px solid', borderRadius: 10, cursor: 'pointer',
              borderColor: sev === s.id ? (s.id === 'high' ? 'var(--rust)' : s.id === 'med' ? 'var(--amber-dark)' : 'var(--moss)') : 'var(--reed)',
              background: sev === s.id
                ? (s.id === 'high' ? 'var(--rust-soft)' : s.id === 'med' ? 'var(--amber-soft)' : 'var(--moss-soft)')
                : 'var(--paper)',
              fontWeight: 600, fontSize: 13.5, fontFamily: 'var(--font-sans)',
              color: sev === s.id ? 'var(--ink)' : 'var(--silt)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span className={'wl-sev ' + s.id}/> {s.label}
            </button>
          ))}
        </div>

        <label className="wl-label">What did you see?</label>
        <textarea className="wl-field" rows="4" placeholder="Describe the hazard, location landmarks and any safe-passage advice for other boaters." style={{ resize: 'none' }}/>

        <button className="wl-btn is-ghost is-block" style={{ marginTop: 12 }}><Icon name="camera" size={18}/> Add photo (optional)</button>
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--reed)', display: 'flex', gap: 8 }}>
        <button onClick={() => goto('map')} className="wl-btn is-ghost" style={{ flex: 1 }}>Cancel</button>
        <button onClick={() => goto('map')} className="wl-btn is-primary" style={{ flex: 2 }}>Post alert</button>
      </div>
      <GestureBar/>
    </div>
  );
};

// =================== CREATE LISTING ===================
const CreateListing = ({ goto }) => {
  const [showInfo, setShowInfo] = React.useState(false);
  const [showPin, setShowPin] = React.useState(false);
  return (
    <div className="wl-screen">
      <StatusBar/>
      <AppBar title="New listing" onBack={() => goto('market')}/>
      <div className="wl-scroll" style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 18 }}>
          <div style={{ aspectRatio: '1', border: '1.5px dashed var(--reed)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--silt)', cursor: 'pointer' }}>
            <Icon name="camera" size={20}/>
            <span style={{ fontSize: 10.5, fontWeight: 600 }}>Add</span>
          </div>
          {[80, 70, 60].map((h, i) => <ImgPH key={i} label={`0${i+1}`} ratio="1" hue={140 + i*15}/>)}
        </div>

        <div className="wl-stack" style={{ '--gap': '14px' }}>
          <div>
            <label className="wl-label">Title</label>
            <input className="wl-field" placeholder="e.g. Lister SR2 engine manual"/>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="wl-label">Price</label>
              <input className="wl-field" placeholder="£0 or POA"/>
            </div>
            <div style={{ flex: 1 }}>
              <label className="wl-label">Condition</label>
              <select className="wl-field" defaultValue="good">
                <option>New</option><option value="good">Good</option><option>Used</option><option>For parts</option>
              </select>
            </div>
          </div>
          <div>
            <label className="wl-label">Category</label>
            <select className="wl-field">
              <option>Engines &amp; parts</option><option>Electrical</option><option>Heating &amp; fuel</option>
              <option>Fittings</option><option>Moorings</option>
            </select>
          </div>
          <div>
            <label className="wl-label">Description</label>
            <textarea className="wl-field" rows="4" placeholder="Tell buyers what they're getting, condition details and where they can collect." style={{ resize: 'none' }}/>
          </div>

          {/* Pickup with info icon + pin picker */}
          <div>
            <label className="wl-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Pickup
              <button onClick={() => setShowInfo(s => !s)} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--silt)', display: 'flex', alignItems: 'center' }}>
                <Icon name="info" size={14}/>
              </button>
            </label>
            {showInfo && (
              <div style={{ padding: '10px 12px', background: 'var(--moss-soft)', borderRadius: 8, marginBottom: 10, fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink)' }}>
                <strong>From my boat</strong> means the listing follows your check-in location — buyers see &ldquo;1.2 mi away&rdquo; based on where you&rsquo;re moored. Use <strong>Drop a pin</strong> to fix the listing to a specific bridge, marina or postcode.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="wl-field" style={{ display: 'flex', alignItems: 'center', gap: 8, borderColor: !showPin ? 'var(--moss)' : 'var(--reed)' }}>
                <Icon name="boat" size={16} color="var(--moss)"/>
                <span style={{ flex: 1, fontWeight: 600 }}>From my boat <Plate>LST557</Plate></span>
                <input type="radio" checked={!showPin} onChange={() => setShowPin(false)} style={{ accentColor: 'var(--moss)' }}/>
              </div>
              <div className="wl-field" style={{ display: 'flex', alignItems: 'center', gap: 8, borderColor: showPin ? 'var(--moss)' : 'var(--reed)', flexDirection: 'column', alignItems: 'stretch', padding: showPin ? 0 : '0 14px' }}>
                <div style={{ padding: showPin ? '14px 14px 8px' : 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="pin" size={16} color="var(--silt)"/>
                  <span style={{ flex: 1 }}>Drop a pin</span>
                  <input type="radio" checked={showPin} onChange={() => setShowPin(true)} style={{ accentColor: 'var(--moss)' }}/>
                </div>
                {showPin && (
                  <div style={{ height: 140, position: 'relative', background: 'oklch(0.93 0.025 200)', borderTop: '1px solid var(--reed)', borderRadius: '0 0 9px 9px', overflow: 'hidden' }}>
                    {/* mini map mockup */}
                    <svg viewBox="0 0 320 140" width="100%" height="100%" preserveAspectRatio="none">
                      <path d="M0 80 Q 60 60 130 78 Q 220 100 320 70" stroke="oklch(0.78 0.06 215)" strokeWidth="6" fill="none"/>
                      <path d="M0 80 Q 60 60 130 78 Q 220 100 320 70" stroke="oklch(0.92 0.04 215)" strokeWidth="2" fill="none" strokeDasharray="6 6"/>
                    </svg>
                    <div style={{ position: 'absolute', left: '40%', top: '40%', transform: 'translate(-50%, -100%)' }}>
                      <Icon name="pin" size={32} color="var(--moss)"/>
                    </div>
                    <div style={{ position: 'absolute', left: 8, bottom: 8, padding: '4px 10px', background: 'var(--paper)', borderRadius: 6, fontSize: 11, fontWeight: 600, boxShadow: 'var(--sh-1)' }}>
                      Mile End, E3 4HJ
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div style={{ height: 20 }}/>
      </div>
      <div style={{ padding: 16, borderTop: '1px solid var(--reed)', display: 'flex', gap: 8 }}>
        <button onClick={() => goto('market')} className="wl-btn is-ghost" style={{ flex: 1 }}>Save draft</button>
        <button onClick={() => goto('market')} className="wl-btn is-primary" style={{ flex: 2 }}>Publish listing</button>
      </div>
      <GestureBar/>
    </div>
  );
};

// =================== TRADE PROFILE / SERVICE LISTING DETAIL ===================
const ServiceDetail = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <AppBar title="Service" onBack={() => goto('market')}
      trailing={<button style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)' }}><Icon name="heart" size={20}/></button>}/>
    <div className="wl-scroll">
      <ImgPH label="LITHIUM BATTERY INSTALL" h={220} hue={30}/>
      <div style={{ padding: '16px 20px' }}>
        <div className="wl-mono" style={{ fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silt)' }}>Electrical · Mobile</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 10px', lineHeight: 1.15 }}>Lithium battery swap &amp; install</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>From £640</div>
          <Chip outline>2 days</Chip>
          <Chip outline>12 mi</Chip>
        </div>

        <div className="wl-card" style={{ padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <Avatar name="Mike Holloway" size={48} hue={170}/>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Mike Holloway</span>
              <Plate>BRG402</Plate>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 2 }}>
              <Icon name="verified" size={11} color="var(--moss)" stroke={2}/> Verified boat · Trade · 47 jobs
            </div>
            <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center', fontSize: 12.5 }}>
              <Icon name="star" size={12} color="var(--amber)" stroke={2}/>
              <span style={{ fontWeight: 600 }}>4.9</span>
              <span style={{ color: 'var(--silt)' }}>· 23 reviews</span>
            </div>
          </div>
          <Icon name="chevron" size={16} color="var(--pebble)"/>
        </div>

        <div className="wl-label">What's included</div>
        <p style={{ fontSize: 15, lineHeight: 1.6, margin: '4px 0 16px' }}>
          Full removal of existing lead-acid bank, install of 4× 100Ah LiFePO4 cells with BMS and Victron Cerbo. Includes new busbars, 200A class-T fuse and inverter recommissioning. Two days on your boat. Parts billed at cost.
        </p>

        <div className="wl-label">Service tags</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 16 }}>
          {['Electrical', 'Lithium', 'Solar', 'Mobile', 'Insurance-grade'].map(s => <Chip key={s} outline>{s}</Chip>)}
        </div>

        <div className="wl-label">Recent reviews</div>
        {[
          { name: 'Bea C.', plate: 'WND322', stars: 5, text: 'Mike rewired my entire 12V loom in a day. Tidy work, fair price, no surprises.' },
          { name: 'Pete H.', plate: 'SLV719', stars: 5, text: 'Came out at 7am after my batteries died. Saved my weekend.' },
        ].map((r, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: i === 0 ? '1px solid var(--reed)' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Avatar name={r.name} size={28} hue={120 + i * 60}/>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</span>
              <Plate>{r.plate}</Plate>
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 1 }}>
                {Array.from({ length: r.stars }).map((_, j) => <Icon key={j} name="star" size={12} color="var(--amber)" stroke={2}/>)}
              </span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>{r.text}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ padding: 16, borderTop: '1px solid var(--reed)', display: 'flex', gap: 8 }}>
      <button className="wl-btn is-ghost" style={{ flex: 0, padding: '0 16px' }}><Icon name="heart" size={18}/></button>
      <button onClick={() => goto('messageThread')} className="wl-btn is-primary" style={{ flex: 1 }}>Request a quote</button>
    </div>
    <GestureBar/>
  </div>
);

// =================== TRADE SETUP ===================
const TradeSetup = ({ goto }) => {
  const [step, setStep] = React.useState(0);
  const tags = ['Electrical', 'Engineering', 'Paint & sign', 'Heating', 'Survey', 'Cleaning', 'Tuition', 'Carpentry', 'Welding'];
  const [picked, setPicked] = React.useState(['Electrical', 'Engineering']);
  const togg = (t) => setPicked(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  if (step === 0) {
    return (
      <div className="wl-screen">
        <StatusBar/>
        <AppBar title="Set up trade" onBack={() => goto('me')}/>
        <div className="wl-scroll" style={{ padding: '20px 22px' }}>
          <h1 className="wl-serif" style={{ fontSize: 32, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.018em', margin: '0 0 12px', lineHeight: 1.15 }}>Get hired by boaters.</h1>
          <p style={{ color: 'var(--silt)', fontSize: 15, lineHeight: 1.55, margin: 0 }}>Trade profiles appear in the Services tab of the Marketplace, with reviews, contact and direct quotes. We take 5% of completed jobs to keep the lights on.</p>

          <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
            {[
              { icon: 'check', t: 'Verified status', s: 'A trade-verified badge after we check your insurance and trading history' },
              { icon: 'star', t: 'Real reviews', s: 'Boaters can only review you after a completed job' },
              { icon: 'send', t: 'Quotes &amp; bookings', s: 'Send formal quotes and accept payment inside the app' },
            ].map(b => (
              <div key={b.t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 14, background: 'var(--linen)', borderRadius: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={b.icon} size={18} color="var(--paper)" stroke={2}/>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{b.t}</div>
                  <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }} dangerouslySetInnerHTML={{ __html: b.s }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setStep(1)} className="wl-btn is-primary is-block">Get started</button>
          <button onClick={() => goto('me')} className="wl-btn is-text" style={{ fontSize: 14.5 }}>Maybe later</button>
        </div>
        <GestureBar/>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="wl-screen">
        <StatusBar/>
        <AppBar title="Trade categories" onBack={() => setStep(0)}/>
        <div style={{ display: 'flex', gap: 4, padding: '0 22px' }}>
          {[0, 1, 2].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 0 ? 'var(--moss)' : 'var(--reed)' }}/>)}
        </div>
        <div className="wl-scroll" style={{ padding: '20px 22px' }}>
          <div className="wl-mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>Step 01 / 03</div>
          <h2 className="wl-serif" style={{ fontSize: 28, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.018em', margin: '12px 0 6px' }}>What do you offer?</h2>
          <p style={{ color: 'var(--silt)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>Pick all that apply. You can write specific service listings next.</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map(t => {
              const on = picked.includes(t);
              return (
                <button key={t} onClick={() => togg(t)} style={{
                  padding: '10px 16px', borderRadius: 100, border: '1.5px solid',
                  borderColor: on ? 'var(--moss)' : 'var(--reed)',
                  background: on ? 'var(--moss-soft)' : 'var(--paper)',
                  color: 'var(--ink)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {on && <Icon name="check" size={14} color="var(--moss)" stroke={2.5}/>}
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: 22 }}>
          <button onClick={() => setStep(2)} className="wl-btn is-primary is-block">Continue</button>
        </div>
        <GestureBar/>
      </div>
    );
  }

  return (
    <div className="wl-screen">
      <StatusBar/>
      <AppBar title="Coverage &amp; insurance" onBack={() => setStep(1)}/>
      <div style={{ display: 'flex', gap: 4, padding: '0 22px' }}>
        {[0, 1, 2].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= 2 ? 'var(--moss)' : 'var(--reed)' }}/>)}
      </div>
      <div className="wl-scroll" style={{ padding: '20px 22px' }}>
        <div className="wl-mono" style={{ fontSize: 11.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)', fontWeight: 500 }}>Step 03 / 03</div>
        <h2 className="wl-serif" style={{ fontSize: 28, fontWeight: 500, fontStyle: 'italic', letterSpacing: '-0.018em', margin: '12px 0 6px' }}>Verify your trade</h2>
        <p style={{ color: 'var(--silt)', fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>Upload public liability insurance and any relevant trade certificates. Reviewed in 48 hours.</p>

        <div className="wl-stack" style={{ '--gap': '14px' }}>
          <div>
            <label className="wl-label">Where do you operate?</label>
            <input className="wl-field" defaultValue="Grand Union, Oxford, K&amp;A canals"/>
          </div>
          <div>
            <label className="wl-label">Public liability insurance</label>
            <div style={{ border: '1.5px dashed var(--reed)', borderRadius: 12, padding: '24px 18px', textAlign: 'center', background: 'var(--linen)' }}>
              <Icon name="image" size={22} color="var(--silt)"/>
              <div style={{ fontWeight: 600, marginTop: 8, fontSize: 14 }}>Upload certificate</div>
              <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>PDF or image · up to 10 MB</div>
            </div>
          </div>
          <div>
            <label className="wl-label">Trade certificates (optional)</label>
            <button className="wl-btn is-ghost is-block"><Icon name="plus" size={16}/> Add certificate</button>
          </div>
        </div>
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
        <button onClick={() => goto('myServices')} className="wl-btn is-primary is-block">Submit for review</button>
        <button onClick={() => goto('myServices')} className="wl-btn is-text" style={{ fontSize: 14.5 }}>Skip — set up listings first</button>
      </div>
      <GestureBar/>
    </div>
  );
};

// =================== MY SERVICES (manage) ===================
const MyServices = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <AppBar title="My services" onBack={() => goto('settings')}
      trailing={<button style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}><Icon name="plus"/></button>}/>
    <div className="wl-scroll">
      <div style={{ margin: '12px 20px', padding: 14, background: 'var(--moss-soft)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="clock" size={18} color="var(--paper)" stroke={2}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>Trade verification pending</div>
          <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>Submitted 21 March · usually 48h</div>
        </div>
      </div>

      <SectionHeader>Active services · 3</SectionHeader>
      <div style={{ padding: '0 20px' }}>
        {[
          { title: 'Lithium battery swap & install', price: 'From £640', views: 142, leads: 8, on: true, hue: 30 },
          { title: 'Solar array & MPPT install', price: 'From £380', views: 89, leads: 4, on: true, hue: 50 },
          { title: 'Diagnostic visit', price: '£90 callout', views: 47, leads: 2, on: true, hue: 200 },
        ].map((s, i) => (
          <div key={i} className="wl-card" style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <ImgPH label={s.title.split(' ')[0].toUpperCase()} h={64} hue={s.hue}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>{s.price}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12.5, color: 'var(--silt)' }}>
                  <span><Icon name="eye" size={12}/> {s.views}</span>
                  <span><Icon name="send" size={12}/> {s.leads} leads</span>
                </div>
              </div>
              <Toggle on={s.on}/>
            </div>
          </div>
        ))}
      </div>

      <SectionHeader>Drafts · 1</SectionHeader>
      <div style={{ padding: '0 20px 24px' }}>
        <div className="wl-card" style={{ padding: 14, opacity: 0.7 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <ImgPH label="DRAFT" h={56} hue={70}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Engine winterising package</div>
              <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 2 }}>Last edited 2 days ago</div>
            </div>
            <Icon name="chevron" size={16} color="var(--pebble)"/>
          </div>
        </div>
      </div>
    </div>
    <GestureBar/>
  </div>
);

// Toggle pill
const Toggle = ({ on = true, onClick }) => (
  <button onClick={onClick} style={{
    width: 44, height: 26, borderRadius: 13, border: 0, padding: 2,
    background: on ? 'var(--moss)' : 'var(--reed)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start',
    transition: 'background 0.2s', flexShrink: 0,
  }}>
    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--paper)', boxShadow: 'var(--sh-1)' }}/>
  </button>
);

Object.assign(window, { ProfileScreen, SettingsScreen, SettingsBoats, SettingsPrivacy, FriendsScreen, HazardDetailModal, ReportHazardModal, CreateListing, ServiceDetail, TradeSetup, MyServices, Toggle });
