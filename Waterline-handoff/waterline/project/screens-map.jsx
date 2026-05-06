// Map screen — the hero. Stylised UK canal network.

const UKMapSvg = ({ pins = [], onPinClick }) => (
  <svg viewBox="0 0 400 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
    style={{ display: 'block', background: 'var(--bank)' }}>
    <defs>
      <pattern id="paper" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#F2EBDD"/>
        <circle cx="3" cy="3" r="0.4" fill="#E0D6BF" opacity="0.5"/>
      </pattern>
    </defs>
    <rect width="400" height="700" fill="url(#paper)"/>

    <path d="M 145 60 L 175 50 L 195 65 L 220 60 L 240 75 L 250 95 L 245 115 L 260 130 L 275 145 L 280 175 L 295 195 L 310 215 L 320 245 L 320 280 L 305 305 L 320 325 L 335 345 L 340 380 L 325 410 L 310 435 L 305 470 L 280 495 L 250 510 L 225 525 L 195 530 L 165 525 L 140 510 L 130 480 L 145 460 L 155 435 L 145 410 L 130 395 L 120 365 L 110 340 L 105 310 L 110 280 L 95 255 L 80 230 L 75 200 L 90 180 L 105 160 L 115 130 L 130 105 L 140 80 Z"
      fill="#FBF6E8" stroke="#D8CFB8" strokeWidth="0.8" opacity="0.95"/>

    <g stroke="var(--depth)" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.75">
      <path d="M 245 470 Q 240 440 230 415 Q 215 385 210 355 Q 205 320 215 295 Q 220 270 215 250"/>
      <path d="M 220 410 Q 210 395 205 375 Q 200 360 205 335"/>
      <path d="M 175 480 Q 195 475 215 478 Q 235 480 245 472"/>
      <path d="M 215 250 Q 225 245 240 250 Q 260 258 275 270 Q 290 280 295 295"/>
      <path d="M 170 245 Q 195 240 220 248 Q 240 252 265 250"/>
      <path d="M 195 280 Q 175 282 160 290"/>
      <path d="M 195 130 Q 200 150 210 165 Q 220 178 215 195"/>
      <path d="M 175 215 Q 168 235 170 250"/>
      <path d="M 245 240 Q 270 235 290 240"/>
    </g>

    <path d="M 235 478 Q 245 472 252 470 Q 260 470 270 472" stroke="var(--depth)" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.6"/>

    <g fontFamily="var(--font-sans)" fontSize="9" fill="var(--silt)" letterSpacing="0.04em">
      <circle cx="245" cy="471" r="2.5" fill="var(--ink)"/>
      <text x="251" y="473" fontWeight="600">London</text>
      <circle cx="215" cy="345" r="2" fill="var(--silt)"/>
      <text x="221" y="347">Birmingham</text>
      <circle cx="195" cy="285" r="1.8" fill="var(--silt)"/>
      <text x="173" y="278" textAnchor="end">Manchester</text>
      <circle cx="225" cy="248" r="1.8" fill="var(--silt)"/>
      <text x="231" y="250">Leeds</text>
      <circle cx="170" cy="290" r="1.8" fill="var(--silt)"/>
      <text x="148" y="292" textAnchor="end">Liverpool</text>
      <circle cx="170" cy="475" r="1.6" fill="var(--silt)"/>
      <text x="148" y="477" textAnchor="end">Bristol</text>
      <circle cx="208" cy="395" r="1.6" fill="var(--silt)"/>
      <text x="214" y="397">Oxford</text>
    </g>

    {pins.map((p, i) => (
      <g key={i} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => onPinClick && onPinClick(p)}>
        {p.kind === 'me' && (<><circle r="14" fill="var(--moss)" opacity="0.18"/><circle r="6" fill="var(--moss)" stroke="var(--paper)" strokeWidth="2"/></>)}
        {p.kind === 'friend' && (<><circle r="8" fill="var(--paper)" stroke="var(--moss)" strokeWidth="1.5"/><text textAnchor="middle" dy="3" fontSize="8" fontWeight="700" fill="var(--moss)">{p.label}</text></>)}
        {p.kind === 'hazard' && (<><path d="M 0,-9 L 9,7 L -9,7 Z" fill={p.severity === 'high' ? 'var(--rust)' : p.severity === 'med' ? 'var(--amber)' : 'var(--moss)'} stroke="var(--paper)" strokeWidth="1.5"/><text textAnchor="middle" dy="4" fontSize="9" fontWeight="700" fill="var(--paper)">!</text></>)}
        {p.kind === 'service' && (<><rect x="-9" y="-9" width="18" height="18" rx="3" fill="var(--depth)" stroke="var(--paper)" strokeWidth="1.5"/><text textAnchor="middle" dy="3" fontSize="10" fontWeight="700" fill="var(--paper)">{p.icon || '⛽'}</text></>)}
      </g>
    ))}
  </svg>
);

const DetailMapSvg = ({ pins = [], onPinClick, focusPin, zoom = 1 }) => (
  <svg viewBox="0 0 400 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
    style={{ display: 'block', background: 'var(--bank)' }}>
    <defs>
      <pattern id="dpaper" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect width="20" height="20" fill="#F2EBDD"/>
        <path d="M 0 10 L 20 10 M 10 0 L 10 20" stroke="#E5DCC4" strokeWidth="0.5"/>
      </pattern>
      <pattern id="park" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="#DCE9D9"/>
        <circle cx="5" cy="5" r="1.5" fill="#B6CFB0" opacity="0.6"/>
      </pattern>
    </defs>
    <g transform={`translate(200 350) scale(${zoom}) translate(-200 -350)`}>
      <rect width="400" height="700" fill="url(#dpaper)"/>
      <path d="M 180 300 L 320 280 L 340 380 L 200 400 Z" fill="url(#park)" opacity="0.7"/>
      <text x="260" y="345" fontSize="11" fill="#5A7A52" fontFamily="var(--font-sans)" letterSpacing="0.05em">Victoria Park</text>
      <path d="M 30 150 L 130 140 L 140 220 L 40 230 Z" fill="url(#park)" opacity="0.7"/>
      <text x="80" y="190" fontSize="10" fill="#5A7A52" fontFamily="var(--font-sans)">Regent's Park</text>

      <g stroke="#D5CDB5" strokeWidth="0.8" fill="none">
        <path d="M 0 100 L 400 90"/><path d="M 0 250 L 400 230"/>
        <path d="M 0 470 L 400 460"/><path d="M 0 580 L 400 580"/>
        <path d="M 80 0 L 70 700"/><path d="M 180 0 L 175 700"/><path d="M 280 0 L 290 700"/>
      </g>

      <path d="M 0 320 Q 60 310 110 305 Q 160 300 200 320 Q 240 340 280 350 Q 330 358 400 350" stroke="var(--depth)" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.4"/>
      <path d="M 0 320 Q 60 310 110 305 Q 160 300 200 320 Q 240 340 280 350 Q 330 358 400 350" stroke="var(--depth)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.85"/>

      <g stroke="var(--ink)" strokeWidth="1" fill="var(--paper)" opacity="0.7">
        <rect x="155" y="310" width="3" height="10" rx="1"/>
        <rect x="245" y="338" width="3" height="10" rx="1"/>
      </g>
      <g fill="var(--silt)" fontSize="8" fontFamily="var(--font-mono)">
        <text x="115" y="298">42</text><text x="265" y="343">38</text>
      </g>
      <text x="20" y="290" fontSize="10" fill="var(--silt)" fontFamily="var(--font-sans)" letterSpacing="0.06em">REGENT'S CANAL</text>

      {pins.map((p, i) => (
        <g key={i} transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => onPinClick && onPinClick(p)}>
          {p.kind === 'me' && (<>
            <circle r="22" fill="var(--moss)" opacity="0.15"><animate attributeName="r" from="14" to="26" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.3" to="0" dur="2.4s" repeatCount="indefinite"/></circle>
            <circle r="9" fill="var(--moss)" stroke="var(--paper)" strokeWidth="2.5"/></>)}
          {p.kind === 'friend' && (<g>
            <circle r="14" fill="var(--paper)" stroke="var(--moss)" strokeWidth="2"/>
            <text textAnchor="middle" dy="4" fontSize="11" fontWeight="700" fill="var(--moss)" fontFamily="var(--font-sans)">{p.label}</text></g>)}
          {p.kind === 'hazard' && (<g>
            <path d="M 0,-14 L 14,10 L -14,10 Z" fill={p.severity === 'high' ? 'var(--rust)' : p.severity === 'med' ? 'var(--amber)' : 'var(--moss)'} stroke="var(--paper)" strokeWidth="2"/>
            <text textAnchor="middle" dy="6" fontSize="13" fontWeight="800" fill="var(--paper)">!</text></g>)}
          {p.kind === 'service' && (<g>
            <rect x="-13" y="-13" width="26" height="26" rx="5" fill="var(--depth)" stroke="var(--paper)" strokeWidth="2"/>
            <text textAnchor="middle" dy="5" fontSize="14" fill="var(--paper)" fontWeight="700">{p.icon || 'F'}</text></g>)}
          {p.kind === 'pin' && (<g>
            <circle r="8" fill="var(--ink)" stroke="var(--paper)" strokeWidth="2"/><circle r="3" fill="var(--paper)"/></g>)}
        </g>
      ))}
    </g>
  </svg>
);

// Search results dropdown — appears under search bar with chips applied as filters
const SearchResults = ({ query, filterTypes, onPick }) => {
  const all = [
    { type: 'service', kind: 'service', label: 'Cuckoo Diesel', sub: 'Fuel boat · 0.4 mi · Open today' },
    { type: 'service', kind: 'service', label: 'The Floating Bean', sub: 'Coffee boat · 0.7 mi · Open' },
    { type: 'service', kind: 'service', label: 'Lock 3 Boatyard', sub: 'Service yard · 2.1 mi' },
    { type: 'friend', kind: 'friend', label: 'Jess Marlowe', plate: 'KIT241', sub: 'Mile End · 0.4 mi · 2h ago' },
    { type: 'friend', kind: 'friend', label: 'Tom Reed', plate: 'OTR889', sub: 'Mile End · 0.6 mi' },
    { type: 'hazard', kind: 'hazard', label: 'Sunken narrowboat · Bridge 42', sub: 'High · 12 confirms' },
    { type: 'location', kind: 'pin', label: 'Mile End', sub: 'Regent\'s Canal' },
    { type: 'location', kind: 'pin', label: 'Camden Lock', sub: 'Regent\'s Canal' },
    { type: 'location', kind: 'pin', label: 'Victoria Park', sub: 'Regent\'s Canal' },
  ];
  const q = query.toLowerCase().trim();
  const results = all.filter(r => {
    if (filterTypes.size && !filterTypes.has(r.type)) return false;
    if (!q) return false;
    return r.label.toLowerCase().includes(q) || (r.plate && r.plate.toLowerCase().includes(q)) || r.sub.toLowerCase().includes(q);
  }).slice(0, 6);
  if (!q || results.length === 0) return null;
  return (
    <div style={{ position: 'absolute', top: 60, left: 12, right: 12, background: 'var(--paper)',
      borderRadius: 12, boxShadow: 'var(--sh-3)', border: '1px solid var(--reed)',
      maxHeight: 320, overflow: 'auto', zIndex: 5 }}>
      {results.map((r, i) => (
        <div key={i} onClick={() => onPick(r)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderBottom: i < results.length - 1 ? '1px solid var(--reed)' : 0, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--linen)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={r.type === 'service' ? 'fuel' : r.type === 'friend' ? 'friend' : r.type === 'hazard' ? 'warning' : 'pin'} size={16} color="var(--silt)"/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }} className="wl-truncate">{r.label}</div>
              {r.plate && <Plate>{r.plate}</Plate>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--silt)', marginTop: 2 }} className="wl-truncate">{r.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const MapScreen = ({ goto, onTab, guest = false }) => {
  const [view, setView] = React.useState('detail');
  const [layers, setLayers] = React.useState({ hazards: true, friends: true, services: true });
  const [selected, setSelected] = React.useState(null);
  const [zoom, setZoom] = React.useState(1);
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState(new Set());

  const detailPins = [
    { id: 'me', kind: 'me', x: 110, y: 305 },
    { id: 'h1', kind: 'hazard', x: 200, y: 320, severity: 'high', title: 'Sunken narrowboat', desc: 'Bridge 42, near Victoria Park' },
    { id: 'h2', kind: 'hazard', x: 60, y: 312, severity: 'med', title: 'Lock stoppage', desc: 'Camden Lock — CRT works' },
    { id: 'f1', kind: 'friend', x: 280, y: 350, label: 'JM', name: 'Jess Marlowe', plate: 'KIT241' },
    { id: 'f2', kind: 'friend', x: 360, y: 350, label: 'TR', name: 'Tom Reed', plate: 'OTR889' },
    { id: 's1', kind: 'service', x: 160, y: 305, icon: 'F', title: 'Cuckoo Diesel', desc: 'Fuel boat — open today' },
    { id: 's2', kind: 'service', x: 320, y: 354, icon: '☕', title: 'The Floating Bean', desc: 'Coffee boat' },
    { id: 'p1', kind: 'pin', x: 250, y: 343, title: 'My check-in: 4 nights', desc: 'Mile End, 22 Mar' },
  ];
  const overviewPins = [
    { id: 'me', kind: 'me', x: 245, y: 471 },
    { id: 'f1', kind: 'friend', x: 215, y: 345, label: 'JM' },
    { id: 'f2', kind: 'friend', x: 195, y: 285, label: 'TR' },
    { id: 'h1', kind: 'hazard', x: 215, y: 395, severity: 'high', title: 'Lock closure', desc: 'Oxford' },
    { id: 's1', kind: 'service', x: 170, y: 290, icon: 'F' },
  ];
  const pins = (view === 'detail' ? detailPins : overviewPins).filter(p =>
    p.kind === 'me' || p.kind === 'pin' ||
    (p.kind === 'hazard' && layers.hazards) ||
    (p.kind === 'friend' && layers.friends) ||
    (p.kind === 'service' && layers.services)
  );

  const toggleFilter = (t) => setFilter(s => {
    const n = new Set(s);
    if (n.has(t)) n.delete(t); else n.add(t);
    return n;
  });

  return (
    <div className="wl-screen" style={{ position: 'relative' }}>
      <StatusBar/>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {view === 'detail'
          ? <DetailMapSvg pins={pins} onPinClick={setSelected} focusPin={selected} zoom={zoom}/>
          : <UKMapSvg pins={pins} onPinClick={setSelected}/>}

        <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--paper)', borderRadius: 12, padding: '12px 14px', boxShadow: 'var(--sh-2)', border: '1px solid var(--reed)' }}>
            <Icon name="search" size={18}/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search places, friends, services" style={{ border: 0, outline: 0, fontSize: 15, flex: 1, background: 'transparent', fontFamily: 'var(--font-sans)' }}/>
            {!guest && <Plate>LST557</Plate>}
          </div>
        </div>

        <SearchResults query={query} filterTypes={filter} onPick={(r) => { setQuery(''); if (r.kind === 'hazard') goto('hazardDetail'); else setSelected({ ...r }); }}/>

        <div style={{ position: 'absolute', top: 66, left: 12, right: 12, display: 'flex', gap: 6, overflow: 'auto' }}>
          <Chip active={filter.has('hazard')} outline={!filter.has('hazard')} onClick={() => { toggleFilter('hazard'); setLayers(l => ({ ...l, hazards: !l.hazards })); }}><span className="wl-sev high"/> Hazards</Chip>
          <Chip active={filter.has('friend')} outline={!filter.has('friend')} onClick={() => { toggleFilter('friend'); setLayers(l => ({ ...l, friends: !l.friends })); }}><Icon name="friend" size={13} stroke={2}/> Friends</Chip>
          <Chip active={filter.has('service')} outline={!filter.has('service')} onClick={() => { toggleFilter('service'); setLayers(l => ({ ...l, services: !l.services })); }}><Icon name="fuel" size={13} stroke={2}/> Services</Chip>
          <Chip outline>Logbook</Chip>
        </div>

        {/* Zoom + view toggle */}
        <div style={{ position: 'absolute', right: 12, top: 116, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setView(view === 'detail' ? 'overview' : 'detail')} style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', boxShadow: 'var(--sh-1)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--silt)', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>{view === 'detail' ? 'UK' : 'HERE'}</button>
          {view === 'detail' && <>
            <button onClick={() => setZoom(z => Math.min(2.4, z + 0.3))} style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', boxShadow: 'var(--sh-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}><Icon name="plus" size={18}/></button>
            <button onClick={() => setZoom(z => Math.max(0.7, z - 0.3))} style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', boxShadow: 'var(--sh-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', fontSize: 22, fontWeight: 600, lineHeight: 1 }}>−</button>
          </>}
          <button style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', boxShadow: 'var(--sh-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--moss)' }}><Icon name="compass" size={20} stroke={1.8}/></button>
        </div>

        {!guest && <div style={{ position: 'absolute', right: 12, bottom: selected ? 240 : 12, display: 'flex', flexDirection: 'column', gap: 8, transition: 'bottom 220ms' }}>
          <button onClick={() => goto('checkin')} style={{ height: 50, padding: '0 18px', borderRadius: 25, border: '1px solid var(--reed)', background: 'var(--paper)', cursor: 'pointer', boxShadow: 'var(--sh-2)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
            <Icon name="pin" size={18}/> Check in
          </button>
          <button onClick={() => goto('reportHazard')} style={{ height: 50, padding: '0 18px', borderRadius: 25, background: 'var(--ink)', color: 'var(--paper)', border: 0, cursor: 'pointer', boxShadow: 'var(--sh-2)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15, fontFamily: 'var(--font-sans)' }}>
            <Icon name="warning" size={18} color="var(--paper)"/> Report
          </button>
        </div>}

        {selected && <PinSheet pin={selected} onClose={() => setSelected(null)} goto={goto}/>}
      </div>
      <TabBar active="map" onChange={onTab}/>
      <GestureBar/>
    </div>
  );
};

const PinSheet = ({ pin, onClose, goto }) => {
  if (pin.kind === 'hazard') return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} className="wl-sheet">
      <div className="wl-sheet-handle"/>
      <div style={{ padding: '8px 22px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <SeverityBadge level={pin.severity}/>
            <h3 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', margin: '10px 0 4px' }}>{pin.title}</h3>
            <div style={{ fontSize: 14, color: 'var(--silt)' }}>{pin.desc}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 0, padding: 4, cursor: 'pointer', color: 'var(--silt)' }}><Icon name="close" size={20}/></button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={() => goto('hazardDetail')} className="wl-btn is-primary" style={{ flex: 1 }}>View details</button>
          <button className="wl-btn is-ghost"><Icon name="check" size={18}/> Confirm</button>
        </div>
      </div>
    </div>
  );
  if (pin.kind === 'friend') return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} className="wl-sheet">
      <div className="wl-sheet-handle"/>
      <div style={{ padding: '8px 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Avatar name={pin.name || 'Jess Marlowe'} size={50} hue={140}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{pin.name || 'Jess Marlowe'}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
              <Plate>{pin.plate || 'KIT241'}</Plate>
              <span style={{ fontSize: 13, color: 'var(--silt)' }}>· moored 2h ago</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 0, padding: 4, cursor: 'pointer', color: 'var(--silt)' }}><Icon name="close" size={20}/></button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => goto('messageThread')} className="wl-btn is-primary" style={{ flex: 1 }}>Message</button>
          <button className="wl-btn is-ghost">View profile</button>
        </div>
      </div>
    </div>
  );
  if (pin.kind === 'service') return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} className="wl-sheet">
      <div className="wl-sheet-handle"/>
      <div style={{ padding: '8px 22px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 10, background: 'var(--depth)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--paper)', fontSize: 22 }}>
            {pin.icon === '☕' ? '☕' : <Icon name="fuel" size={24} color="var(--paper)"/>}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{pin.title}</div>
            <div style={{ fontSize: 13.5, color: 'var(--silt)', marginTop: 2 }}>{pin.desc}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <Chip tone="moss"><span className="wl-sev low"/>Open now</Chip>
              <Chip outline>0.4 mi away</Chip>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 0, padding: 4, cursor: 'pointer', color: 'var(--silt)' }}><Icon name="close" size={20}/></button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="wl-btn is-primary" style={{ flex: 1 }}>Hail boat</button>
          <button className="wl-btn is-ghost">Directions</button>
        </div>
      </div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} className="wl-sheet">
      <div className="wl-sheet-handle"/>
      <div style={{ padding: '8px 22px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="wl-sect" style={{ padding: 0, marginBottom: 4 }}>Logbook check-in</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px' }}>{pin.title}</h3>
            <div style={{ fontSize: 14, color: 'var(--silt)' }}>{pin.desc}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 0, padding: 4, cursor: 'pointer', color: 'var(--silt)' }}><Icon name="close" size={20}/></button>
        </div>
        <button onClick={() => goto('logbook')} className="wl-btn is-ghost is-block" style={{ marginTop: 14 }}>Open in logbook</button>
      </div>
    </div>
  );
};

Object.assign(window, { MapScreen, UKMapSvg, DetailMapSvg });
