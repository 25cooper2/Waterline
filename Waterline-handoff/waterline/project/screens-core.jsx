// Logbook, marketplace, inbox/messaging.

// =================== LOGBOOK ===================
const LogbookScreen = ({ goto, onTab }) => {
  const entries = [
    { id: 1, date: 'Today', loc: 'Mile End, Regent\'s Canal', dur: '2 nights', miles: '4.2 mi', locks: 0, photos: 2, status: 'current' },
    { id: 2, date: '20 Mar', loc: 'Victoria Park', dur: '3 nights', miles: '6.8 mi', locks: 2, photos: 4 },
    { id: 3, date: '17 Mar', loc: 'Limehouse Basin', dur: '5 nights', miles: '2.1 mi', locks: 3, photos: 1 },
    { id: 4, date: '12 Mar', loc: 'King\'s Cross', dur: '4 nights', miles: '5.4 mi', locks: 4, photos: 3 },
    { id: 5, date: '8 Mar', loc: 'Camden Lock', dur: '2 nights', miles: '3.0 mi', locks: 2, photos: 2 },
  ];
  return (
    <div className="wl-screen">
      <StatusBar/>
      <AppBar title="Logbook" large subtitle="156 nights aboard · 287 miles cruised"
        trailing={<button style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }}><Icon name="search" size={18}/></button>}/>
      <div className="wl-scroll">
        {/* Year stats — distance + locks (no nights) */}
        <div style={{ padding: '12px 20px 16px', display: 'flex', gap: 8 }}>
          {[
            { label: 'This year', value: '124', sub: 'miles cruised' },
            { label: 'Locks', value: '38', sub: 'worked' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, padding: '14px 14px', background: 'var(--linen)', borderRadius: 12 }}>
              <div className="wl-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silt)' }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--silt)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <SectionHeader>Recent stays</SectionHeader>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 36, top: 0, bottom: 30, width: 1.5, background: 'var(--reed)' }}/>
          {entries.map((e, i) => (
            <div key={e.id} style={{ padding: '14px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer' }}
              onClick={() => goto('logbookEntry')}>
              <div style={{ width: 32, display: 'flex', justifyContent: 'center', paddingTop: 6, position: 'relative', zIndex: 1 }}>
                {e.status === 'current' ? (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--moss)', border: '3px solid var(--paper)', boxShadow: '0 0 0 2px var(--moss)' }}/>
                ) : (
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--paper)', border: '2px solid var(--reed)' }}/>
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: i < entries.length - 1 ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div className="wl-mono" style={{ fontSize: 11.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: e.status === 'current' ? 'var(--moss)' : 'var(--silt)', fontWeight: 600 }}>{e.date}{e.status === 'current' && ' · MOORED HERE'}</div>
                    <div style={{ fontWeight: 600, marginTop: 3, fontSize: 16 }}>{e.loc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 13, color: 'var(--silt)' }}>
                  <span>{e.dur}</span>
                  <span>·</span>
                  <span>{e.miles}</span>
                  <span>·</span>
                  <span>{e.locks} locks</span>
                  {e.photos && <><span>·</span><span>{e.photos} photos</span></>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating "new entry" button */}
      <button onClick={() => goto('logbookNew')} style={{
        position: 'absolute', right: 18, bottom: 96, zIndex: 4,
        height: 54, padding: '0 22px 0 18px', borderRadius: 27,
        background: 'var(--ink)', color: 'var(--paper)', border: 0,
        boxShadow: 'var(--sh-3)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14.5,
      }}>
        <Icon name="plus" size={18} color="var(--paper)" stroke={2.2}/> New entry
      </button>
      <TabBar active="logbook" onChange={onTab}/>
      <GestureBar/>
    </div>
  );
};

// Editable composer — full-screen
const LogbookNew = ({ goto }) => {
  const [text, setText] = React.useState('Met Tom & Jess on @OTR889 — they shared a tip about the fresh-water tap at the south gate. Quiet weekday mornings. ');
  const [showMention, setShowMention] = React.useState(false);
  // Tokenise text into spans, treating @PLATE as a mention chip
  const renderText = (t) => t.split(/(@[A-Z0-9]{3,7})/g).map((p, i) =>
    /^@[A-Z0-9]{3,7}$/.test(p)
      ? <span key={i} style={{ background: 'var(--moss-soft)', color: 'var(--moss-dark)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.92em' }}>{p}</span>
      : <span key={i}>{p}</span>
  );
  return (
    <div className="wl-screen">
      <StatusBar/>
      <div className="wl-appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => goto('logbook')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}><Icon name="close"/></button>
          <div style={{ fontWeight: 600, fontSize: 16 }}>New stay</div>
        </div>
        <button onClick={() => goto('logbook')} className="wl-btn is-primary" style={{ height: 36, padding: '0 16px', fontSize: 14 }}>Save</button>
      </div>
      <div className="wl-scroll" style={{ padding: '16px 20px 0' }}>
        <div className="wl-stack" style={{ '--gap': '16px' }}>
          <div>
            <label className="wl-label">Where</label>
            <div className="wl-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="pin" size={16} color="var(--moss)"/>
              <span style={{ flex: 1 }}>Mile End, Regent's Canal</span>
              <a style={{ fontSize: 13, color: 'var(--moss)', fontWeight: 600 }}>Adjust</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="wl-label">Arrived</label>
              <input className="wl-field" type="date" defaultValue="2025-04-04"/>
            </div>
            <div style={{ flex: 1 }}>
              <label className="wl-label">Left</label>
              <input className="wl-field" type="date" defaultValue="2025-04-06" placeholder="Still here"/>
            </div>
          </div>

          <div>
            <label className="wl-label">Notes</label>
            {/* Visible "rendered" preview line under the textarea so mentions read well */}
            <textarea
              className="wl-field"
              rows="6"
              value={text}
              onFocus={() => setShowMention(true)}
              onChange={e => setText(e.target.value)}
              style={{ resize: 'none', fontSize: 14.5, lineHeight: 1.5 }}
            />
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--linen)', borderRadius: 8, fontSize: 13.5, lineHeight: 1.55, color: 'var(--silt)' }}>
              <div className="wl-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--pebble)', marginBottom: 6 }}>Preview</div>
              {renderText(text)}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>Mention boats by index using @ABC123 — they&rsquo;ll get a notification.</div>

            {showMention && (
              <div style={{ marginTop: 8, background: 'var(--paper)', border: '1px solid var(--reed)', borderRadius: 10, boxShadow: 'var(--sh-2)', overflow: 'hidden' }}>
                <div className="wl-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silt)', padding: '8px 12px 4px' }}>Suggested — recently nearby</div>
                {[
                  { name: 'Jess M.', plate: 'KIT241', boat: 'NB Skylark', hue: 140 },
                  { name: 'Tom Reed', plate: 'OTR889', boat: 'NB Otter', hue: 200 },
                ].map(m => (
                  <div key={m.plate} onClick={() => { setText(t => t + '@' + m.plate + ' '); setShowMention(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderTop: '1px solid var(--reed)' }}>
                    <Avatar name={m.name} size={32} hue={m.hue}/>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{m.name} <Plate>{m.plate}</Plate></div>
                      <div style={{ fontSize: 12, color: 'var(--silt)' }}>{m.boat}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="wl-label">Photos</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 78, height: 78, border: '1.5px dashed var(--reed)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--silt)', cursor: 'pointer' }}>
                <Icon name="camera" size={18}/>
                <span style={{ fontSize: 10.5, fontWeight: 600 }}>Add</span>
              </div>
              <ImgPH label="01" h={78} hue={150}/>
              <ImgPH label="02" h={78} hue={170}/>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="wl-label">Locks</label>
              <input className="wl-field" defaultValue="2"/>
            </div>
            <div style={{ flex: 1 }}>
              <label className="wl-label">Miles</label>
              <input className="wl-field" defaultValue="4.2"/>
            </div>
          </div>
        </div>
        <div style={{ height: 30 }}/>
      </div>
      <GestureBar/>
    </div>
  );
};

const LogbookEntry = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <AppBar title="Victoria Park" onBack={() => goto('logbook')}
      trailing={<button onClick={() => goto('logbookNew')} style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)', fontSize: 13.5, fontWeight: 600, fontFamily: 'var(--font-sans)' }}>Edit</button>}/>
    <div className="wl-scroll">
      <ImgPH label="Mooring photo · 4 in album" h={220} hue={150}/>
      <div style={{ padding: '16px 20px' }}>
        <div className="wl-mono" style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silt)' }}>20 — 23 March · 3 nights</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.018em', margin: '6px 0 4px' }}>Victoria Park</h2>
        <div style={{ fontSize: 14, color: 'var(--silt)' }}>Regent's Canal · East London</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, margin: '20px 0' }}>
          {[['Distance', '6.8 mi'], ['Locks', '2'], ['Bridges', '7']].map(([k,v]) => (
            <div key={k} style={{ padding: 12, background: 'var(--linen)', borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 19, fontWeight: 700 }}>{v}</div>
              <div className="wl-mono" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--silt)' }}>{k}</div>
            </div>
          ))}
        </div>

        <div className="wl-label">Notes</div>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', margin: '4px 0 20px' }}>
          Lovely spot opposite the People's Park Tavern. Quiet weekday mornings, busy weekends. CRT tap working at the south gate. Met Tom &amp; Jess on <Plate>OTR889</Plate> moored two boats down.
        </p>

        <div className="wl-label">Photos</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginTop: 6 }}>
          {[160, 180, 145, 170].map((h, i) => <ImgPH key={i} label={`PHOTO 0${i+1}`} h={88} hue={140 + i*10}/>)}
        </div>
      </div>
    </div>
    <GestureBar/>
  </div>
);

// =================== MARKETPLACE ===================
const MarketScreen = ({ goto, onTab, isGuest = false }) => {
  const [mode, setMode] = React.useState('products');
  const productCats = [
    { id: 'all', label: 'All', count: 412 },
    { id: 'engines', label: 'Engines & parts' },
    { id: 'electrical', label: 'Electrical' },
    { id: 'heating', label: 'Heating & fuel' },
    { id: 'fittings', label: 'Fittings' },
    { id: 'moorings', label: 'Moorings' },
  ];
  const serviceCats = [
    { id: 'all', label: 'All services', count: 86 },
    { id: 'electrical', label: 'Electrical' },
    { id: 'engineering', label: 'Engineering' },
    { id: 'paint', label: 'Paint & sign' },
    { id: 'survey', label: 'Survey' },
    { id: 'cleaning', label: 'Cleaning' },
    { id: 'tuition', label: 'Tuition' },
  ];
  const items = [
    { title: 'Lister SR2 Engine Manual', price: '£45', cond: 'Good', dist: '1.2 mi', cat: 'ENGINE', hue: 80 },
    { title: '15hp Mercury outboard', price: '£450', cond: 'Working', dist: '0.4 mi', cat: 'ENGINE', hue: 200 },
    { title: 'Solar charge controller', price: '£45', cond: 'New', dist: '3.1 mi', cat: 'ELECTRICAL', hue: 50 },
    { title: 'Morso Squirrel stove', price: '£280', cond: 'Used', dist: '5.7 mi', cat: 'HEATING', hue: 30 },
    { title: 'Brass mushroom vents (×4)', price: '£28', cond: 'New', dist: '2.0 mi', cat: 'FITTINGS', hue: 70 },
    { title: '2 weeks at Aldermaston Wharf', price: '£140', cond: 'Apr', dist: '64 mi', cat: 'MOORING', hue: 145 },
  ];
  const services = [
    { title: 'Lithium battery swap & install', who: 'Mike Holloway', plate: 'BRG402', tags: ['Electrical', 'Mobile'], price: 'From £640', dist: '12 mi', hue: 30, cat: 'ELECTRICAL' },
    { title: 'Hand-painted name & roses', who: 'Sarah Bellweather', plate: 'CHN118', tags: ['Paint & sign'], price: 'POA', dist: '34 mi', hue: 320, cat: 'PAINT' },
    { title: 'Pre-purchase boat survey', who: 'Hugh Pemberton', plate: 'SVY441', tags: ['Survey', 'Insurance-grade'], price: 'From £450', dist: '8 mi', hue: 200, cat: 'SURVEY' },
    { title: 'Engine service — Lister, Beta, Vetus', who: 'Pat & Sons', plate: 'PAT001', tags: ['Engineering', 'Mobile'], price: 'From £180', dist: '6 mi', hue: 70, cat: 'ENGINEERING' },
    { title: 'Helmsman tuition (RYA)', who: 'River Runner', plate: 'FLT009', tags: ['Tuition'], price: '£110/day', dist: '22 mi', hue: 145, cat: 'TUITION' },
  ];

  return (
    <div className="wl-screen">
      <StatusBar/>
      <AppBar title="Market" large
        subtitle={isGuest ? "Browsing as a guest · log in to message" : "Buying, selling & trading along the cut"}
        leading={isGuest ? <button onClick={() => goto('splash')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}><Icon name="back"/></button> : null}
        trailing={!isGuest && <button style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }} onClick={() => goto('createListing')}><Icon name="plus"/></button>}/>

      <div className="wl-scroll">
        {/* Products / Services slider toggle */}
        <div style={{ padding: '6px 20px 0' }}>
          <div style={{ display: 'flex', padding: 4, background: 'var(--linen)', borderRadius: 12, gap: 4 }}>
            {[{ id: 'products', label: 'Products' }, { id: 'services', label: 'Services' }].map(t => (
              <button key={t.id} onClick={() => setMode(t.id)} style={{
                flex: 1, height: 40, border: 0, borderRadius: 9, cursor: 'pointer',
                background: mode === t.id ? 'var(--paper)' : 'transparent',
                color: mode === t.id ? 'var(--ink)' : 'var(--silt)',
                fontWeight: 600, fontSize: 14.5, fontFamily: 'var(--font-sans)',
                boxShadow: mode === t.id ? 'var(--sh-1)' : 'none',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--linen)', borderRadius: 10 }}>
            <Icon name="search" size={18} color="var(--silt)"/>
            <input placeholder={mode === 'products' ? 'Search 412 listings near you' : 'Search electricians, painters, surveyors…'} style={{ border: 0, outline: 0, fontSize: 14.5, flex: 1, background: 'transparent', fontFamily: 'var(--font-sans)' }}/>
            <Icon name="filter" size={18} color="var(--silt)"/>
          </div>
        </div>

        {/* Categories */}
        <div style={{ padding: '14px 20px 4px', display: 'flex', gap: 6, overflow: 'auto' }}>
          {(mode === 'products' ? productCats : serviceCats).map((c, i) => (
            <Chip key={c.id} active={i === 0} outline={i !== 0}>{c.label}{c.count && ` · ${c.count}`}</Chip>
          ))}
        </div>

        {mode === 'products' ? (
          <>
            <SectionHeader action={<a style={{ fontSize: 12, color: 'var(--moss)', fontWeight: 600 }}>See all</a>}>Near you</SectionHeader>
            <div style={{ padding: '0 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {items.slice(0, 4).map((it, i) => (
                  <div key={i} onClick={() => goto('product')} style={{ cursor: 'pointer' }}>
                    <ImgPH label={it.cat} h={140} hue={it.hue}/>
                    <div style={{ padding: '10px 0 4px' }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.25, marginBottom: 4 }}>{it.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{it.price}</div>
                        <div style={{ fontSize: 12, color: 'var(--silt)' }}>{it.dist}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <SectionHeader>More to browse</SectionHeader>
            <div style={{ padding: '0 20px 24px' }}>
              {items.slice(4).map((it, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--reed)', display: 'flex', gap: 12, cursor: 'pointer' }} onClick={() => goto('product')}>
                  <ImgPH label={it.cat} h={66} hue={it.hue}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{it.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 2 }}>{it.cond} · {it.dist}</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{it.price}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <SectionHeader action={<a style={{ fontSize: 12, color: 'var(--moss)', fontWeight: 600 }}>Sort</a>}>Available services</SectionHeader>
            <div style={{ padding: '0 20px 24px' }}>
              {services.map((s, i) => (
                <div key={i} className="wl-card" style={{ padding: 14, marginBottom: 10, cursor: 'pointer' }} onClick={() => goto('serviceDetail')}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <ImgPH label={s.cat} h={68} hue={s.hue}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{s.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--silt)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar name={s.who} size={18} hue={s.hue}/>
                        <span>{s.who}</span>
                        <Plate>{s.plate}</Plate>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, gap: 8 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {s.tags.map(t => <Chip key={t} outline>{t}</Chip>)}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' }}>{s.price}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {!isGuest && <TabBar active="market" onChange={onTab}/>}
      {isGuest && (
        <div style={{ padding: 14, borderTop: '1px solid var(--reed)', background: 'var(--paper)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon name="lock" size={18} color="var(--moss)"/>
          <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.4 }}>Log in to message sellers and buy</div>
          <button onClick={() => goto('auth')} className="wl-btn is-primary" style={{ height: 40, padding: '0 16px' }}>Log in</button>
        </div>
      )}
      <GestureBar/>
    </div>
  );
};

const ProductScreen = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <div style={{ position: 'absolute', top: 28, left: 12, right: 12, zIndex: 5, display: 'flex', justifyContent: 'space-between' }}>
      <button onClick={() => goto('market')} style={{ width: 40, height: 40, borderRadius: '50%', background: 'oklch(0.985 0.004 100 / 0.92)', backdropFilter: 'blur(8px)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)' }}><Icon name="back"/></button>
      <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'oklch(0.985 0.004 100 / 0.92)', backdropFilter: 'blur(8px)', border: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)' }}><Icon name="heart"/></button>
    </div>
    <div className="wl-scroll" style={{ paddingTop: 0 }}>
      <ImgPH label="LISTER SR2 ENGINE MANUAL" h={320} hue={80}/>
      <div style={{ padding: 20 }}>
        <div className="wl-mono" style={{ fontSize: 11.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silt)' }}>Engines &amp; parts</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 10px', lineHeight: 1.15 }}>Lister SR2 Engine Manual — original 1967 print</h1>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em' }}>£45</div>
          <Chip outline>Good condition</Chip>
          <Chip outline>1.2 mi</Chip>
        </div>

        <div className="wl-label">Description</div>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', margin: '4px 0 20px' }}>
          Genuine Lister SR2 engine maintenance manual, 1967 print. All pages intact. Includes wiring diagrams and original grease markings — proves authenticity. Perfect reference for restoration projects on the Lister SR range.
        </p>

        <div className="wl-card" style={{ padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name="Sam P" size={48} hue={210}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>Sam · <Plate>ABC123</Plate></div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--silt)', display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="verified" size={12} color="var(--moss)" stroke={2}/> Verified boat</span>
                <span>·</span>
                <span>Joined Mar 2022</span>
              </div>
            </div>
            <Icon name="chevron" size={16} color="var(--pebble)"/>
          </div>
        </div>

        <div style={{ padding: 14, background: 'oklch(0.97 0.018 165)', borderRadius: 12, fontSize: 13, color: 'var(--silt)', display: 'flex', gap: 10, lineHeight: 1.55 }}>
          <Icon name="shield" size={18} color="var(--moss)" stroke={1.7}/>
          <div>Keep messages and payments inside Waterline to stay covered by the <strong style={{ color: 'var(--ink)' }}>Boater's Guarantee</strong>.</div>
        </div>
      </div>
    </div>
    <div style={{ padding: 16, borderTop: '1px solid var(--reed)', display: 'flex', gap: 8 }}>
      <button className="wl-btn is-ghost" style={{ flex: 0, padding: '0 16px' }}><Icon name="heart" size={18}/></button>
      <button onClick={() => goto('messageSeller')} className="wl-btn is-primary" style={{ flex: 1 }}>Message seller</button>
    </div>
    <GestureBar/>
  </div>
);

const MessageSellerModal = ({ goto }) => (
  <div className="wl-screen" style={{ background: 'oklch(0.22 0.012 200 / 0.5)' }}>
    <StatusBar/>
    <div style={{ flex: 1 }} onClick={() => goto('product')}/>
    <div className="wl-sheet">
      <div className="wl-sheet-handle"/>
      <div style={{ padding: '6px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.018em', margin: 0 }}>Message Sam</h2>
          <button onClick={() => goto('product')} style={{ background: 'none', border: 0, padding: 4, cursor: 'pointer', color: 'var(--silt)' }}><Icon name="close"/></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--linen)', borderRadius: 10, marginBottom: 16 }}>
          <ImgPH label="MAN" h={44} hue={80}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Lister SR2 Engine Manual</div>
            <div style={{ fontSize: 12.5, color: 'var(--silt)' }}>£45 · <Plate>ABC123</Plate></div>
          </div>
        </div>
        <div className="wl-stack" style={{ '--gap': '14px' }}>
          <div>
            <label className="wl-label">Subject</label>
            <input className="wl-field" defaultValue="Interested in Lister SR2 manual"/>
          </div>
          <div>
            <label className="wl-label">Your message</label>
            <textarea className="wl-field" rows="4" defaultValue="Hi Sam, is this still available? I'm restoring an SR2 in my boat at the moment and would love to take a look. I'm moored near Victoria Park if you're around this weekend." style={{ resize: 'none' }}/>
            <div style={{ fontSize: 11.5, color: 'var(--silt)', textAlign: 'right', marginTop: 4 }}>148 / 1000</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => goto('product')} className="wl-btn is-ghost" style={{ flex: 1 }}>Cancel</button>
          <button onClick={() => goto('messageThread')} className="wl-btn is-primary" style={{ flex: 2 }}><Icon name="send" size={16} color="var(--paper)"/> Send</button>
        </div>
      </div>
    </div>
    <GestureBar/>
  </div>
);

// =================== INBOX ===================
const InboxScreen = ({ goto, onTab }) => {
  const [filter, setFilter] = React.useState('all');
  const threads = [
    { name: 'Sam', plate: 'ABC123', subject: 'Lister SR2 manual', preview: "Yeah, still about — Saturday morning works great…", time: '14m', unread: true, kind: 'market', hue: 210 },
    { name: 'Jess', plate: 'KIT241', subject: 'Sharing the Mile End mooring?', preview: "Hey, I'm heading down on Friday — happy to share…", time: '2h', unread: true, kind: 'friend', hue: 140 },
    { name: 'New hail', plate: 'XYZ990', subject: 'Just pulled up against you', preview: "No rush — leaving in four days. Let me know…", time: '5h', kind: 'hail', hue: 260 },
    { name: 'CRT Updates', plate: 'CRT001', subject: 'Stoppage: Camden Lock 39', preview: 'Planned closure 6—8 April for gate replacement…', time: 'Yesterday', kind: 'system', hue: 50 },
    { name: 'River Runner', plate: 'FLT009', subject: 'Diesel prices', preview: "Just filled up at Dock 4 — diesel's £1.20/litre…", time: 'Mon', kind: 'market', hue: 90 },
    { name: 'Mike Holloway', plate: 'BRG402', subject: 'Quote: 12V to lithium swap', preview: 'Happy to do this. Two days, parts at cost. £640…', time: '21 Mar', kind: 'service', hue: 30 },
  ];
  const filtered = filter === 'all' ? threads : threads.filter(t => filter === 'unread' ? t.unread : t.kind === filter);
  return (
    <div className="wl-screen">
      <StatusBar/>
      <AppBar title="Inbox" large subtitle="2 unread · 6 conversations"
        trailing={<button style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid var(--reed)', background: 'var(--paper)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)' }} onClick={() => goto('hailBoat')}><Icon name="plus"/></button>}/>
      <div style={{ padding: '0 20px 12px', display: 'flex', gap: 6, overflow: 'auto', borderBottom: '1px solid var(--reed)' }}>
        {[
          { id: 'all', label: 'All' },
          { id: 'unread', label: 'Unread' },
          { id: 'market', label: 'Market' },
          { id: 'hail', label: 'Hails' },
          { id: 'system', label: 'CRT' },
        ].map(f => <Chip key={f.id} active={filter === f.id} outline={filter !== f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>)}
      </div>
      <div className="wl-scroll">
        {filtered.map((t, i) => (
          <div key={i} className="wl-row" style={{ padding: '14px 20px', cursor: 'pointer', alignItems: 'flex-start' }} onClick={() => goto(t.kind === 'hail' ? 'hailThread' : 'messageThread')}>
            <Avatar name={t.name} size={44} hue={t.hue}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{t.name}</div>
                  <Plate>{t.plate}</Plate>
                  {t.kind === 'system' && <Chip tone="moss"><Icon name="verified" size={11} stroke={2}/>Official</Chip>}
                  {t.kind === 'hail' && <Chip tone="amber">Hail</Chip>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--silt)', flexShrink: 0 }}>{t.time}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: 'var(--ink)' }}>{t.subject}</div>
              <div className="wl-truncate" style={{ fontSize: 13.5, color: 'var(--silt)', marginTop: 2 }}>{t.preview}</div>
            </div>
            {t.unread && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--moss)', alignSelf: 'center', flexShrink: 0 }}/>}
          </div>
        ))}
      </div>
      <TabBar active="inbox" onChange={onTab}/>
      <GestureBar/>
    </div>
  );
};

const Bubble = ({ side = 'them', children }) => (
  <div style={{ display: 'flex', justifyContent: side === 'me' ? 'flex-end' : 'flex-start', marginBottom: 4 }}>
    <div style={{
      maxWidth: '78%',
      padding: '10px 14px',
      borderRadius: side === 'me' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      background: side === 'me' ? 'var(--moss)' : 'var(--paper)',
      color: side === 'me' ? 'var(--paper)' : 'var(--ink)',
      fontSize: 14.5, lineHeight: 1.45,
      border: side === 'me' ? 0 : '1px solid var(--reed)',
    }}>{children}</div>
  </div>
);
const BubbleTime = ({ children, me }) => (
  <div style={{ fontSize: 11, color: 'var(--silt)', textAlign: me ? 'right' : 'left', margin: '0 4px 10px' }}>{children}</div>
);

const MessageThread = ({ goto }) => (
  <div className="wl-screen">
    <StatusBar/>
    <div className="wl-appbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => goto('inbox')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}><Icon name="back"/></button>
        <Avatar name="Sam" size={34} hue={210}/>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.1 }}>Sam</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
            <Plate>ABC123</Plate>
            <span style={{ fontSize: 11.5, color: 'var(--silt)' }}>· moored 1.2 mi</span>
          </div>
        </div>
      </div>
      <button style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)' }}><Icon name="more"/></button>
    </div>

    <div style={{ padding: '10px 16px', background: 'var(--linen)', borderBottom: '1px solid var(--reed)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', background: 'var(--paper)', borderRadius: 10, border: '1px solid var(--reed)', cursor: 'pointer' }}>
        <ImgPH label="MAN" h={36} hue={80}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Lister SR2 Engine Manual</div>
          <div style={{ fontSize: 12, color: 'var(--silt)' }}>£45 · Active listing</div>
        </div>
        <Icon name="chevron" size={14} color="var(--silt)"/>
      </div>
    </div>

    <div className="wl-scroll" style={{ background: 'var(--linen)', padding: '20px 16px' }}>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--silt)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>Today</div>
      <Bubble side="them">Hi Sam, is this still available? I'm restoring an SR2 in my boat and would love to take a look. I'm moored near Victoria Park if you're around this weekend.</Bubble>
      <BubbleTime>11:45</BubbleTime>
      <Bubble side="me">Yeah it's still about. Saturday morning works great — I'm at <Plate>ABC123</Plate> moored at the Mile End end of the canal, just past bridge 38.</Bubble>
      <BubbleTime me>14:02</BubbleTime>
      <Bubble side="me">£40 is fine. I'll throw in the original parts catalogue too.</Bubble>
      <BubbleTime me>14:02</BubbleTime>
      <Bubble side="them">Brilliant — see you Saturday around 10. 👍</Bubble>
      <BubbleTime>14:08</BubbleTime>
    </div>

    <div style={{ padding: 12, background: 'var(--paper)', borderTop: '1px solid var(--reed)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
      <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--linen)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--silt)' }}><Icon name="plus"/></button>
      <textarea placeholder="Message" rows="1" style={{ flex: 1, border: '1px solid var(--reed)', borderRadius: 20, padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 14.5, resize: 'none', outline: 0, background: 'var(--paper)' }}/>
      <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--moss)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="send" size={18} color="var(--paper)"/></button>
    </div>
    <GestureBar/>
  </div>
);

// Hail thread — note "Hide user" instead of block, profile not boat
const HailThread = ({ goto }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  return (
    <div className="wl-screen">
      <StatusBar/>
      <div className="wl-appbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => goto('inbox')} style={{ background: 'none', border: 0, padding: 6, marginLeft: -6, cursor: 'pointer', color: 'var(--ink)' }}><Icon name="back"/></button>
          <Avatar name="JK" size={34} hue={260}/>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 6 }}>jamie_k <Chip tone="amber">Hail</Chip></div>
            <div style={{ fontSize: 11.5, color: 'var(--silt)', marginTop: 2 }}>You haven't messaged before</div>
          </div>
        </div>
        <button onClick={() => setShowMenu(s => !s)} style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink)', position: 'relative' }}>
          <Icon name="more"/>
        </button>
        {showMenu && (
          <div style={{ position: 'absolute', right: 16, top: 60, background: 'var(--paper)', borderRadius: 12, boxShadow: 'var(--sh-3)', padding: '6px 0', zIndex: 10, minWidth: 200, border: '1px solid var(--reed)' }}>
            {[
              { icon: 'me', label: 'View profile' },
              { icon: 'flag', label: 'Report message' },
              { icon: 'eye-off', label: 'Hide jamie_k', danger: true },
            ].map(o => (
              <div key={o.label} style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 14, fontWeight: 500, color: o.danger ? 'var(--rust)' : 'var(--ink)' }}>
                <Icon name={o.icon} size={16} color={o.danger ? 'var(--rust)' : 'var(--silt)'}/>
                {o.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', background: 'var(--amber-soft)', borderBottom: '1px solid var(--reed)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Icon name="info" size={16} color="var(--amber-dark)"/>
        <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink)' }}>
          <strong>This is a hail.</strong> jamie_k sent this from a different boat. You can reply, ignore, or hide them.
        </div>
      </div>

      <div className="wl-scroll" style={{ background: 'var(--linen)', padding: '20px 16px' }}>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--silt)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>5 hours ago</div>
        <Bubble side="them">Hey, just pulled up against your boat at Mile End. No rush — leaving in four days. Let me know if you need me to move beforehand.</Bubble>
        <BubbleTime>09:14</BubbleTime>
      </div>

      <div style={{ padding: 12, background: 'var(--paper)', borderTop: '1px solid var(--reed)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--linen)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--silt)' }}><Icon name="plus"/></button>
        <textarea placeholder="Reply…" rows="1" style={{ flex: 1, border: '1px solid var(--reed)', borderRadius: 20, padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 14.5, resize: 'none', outline: 0, background: 'var(--paper)' }}/>
        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--moss)', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="send" size={18} color="var(--paper)"/></button>
      </div>
      <GestureBar/>
    </div>
  );
};

const HailBoatModal = ({ goto }) => (
  <div className="wl-screen" style={{ background: 'oklch(0.22 0.012 200 / 0.5)' }}>
    <StatusBar/>
    <div style={{ flex: 1 }} onClick={() => goto('inbox')}/>
    <div className="wl-sheet">
      <div className="wl-sheet-handle"/>
      <div style={{ padding: '6px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.018em', margin: 0 }}>Hail a boat</h2>
            <div style={{ fontSize: 13.5, color: 'var(--silt)', marginTop: 4, lineHeight: 1.4 }}>Send a message to any boat using its index — even if you've never met.</div>
          </div>
          <button onClick={() => goto('inbox')} style={{ background: 'none', border: 0, padding: 4, cursor: 'pointer', color: 'var(--silt)' }}><Icon name="close"/></button>
        </div>
        <div className="wl-stack" style={{ '--gap': '14px' }}>
          <div>
            <label className="wl-label">Boat index</label>
            <input className="wl-field is-mono" placeholder="ABC123" maxLength={7}/>
          </div>
          <div>
            <label className="wl-label">Reason</label>
            <select className="wl-field" defaultValue="moor">
              <option value="moor">Moored next to you</option>
              <option value="lost">Lost &amp; found</option>
              <option value="hazard">Spotted a hazard near you</option>
              <option value="general">General hello</option>
            </select>
          </div>
          <div>
            <label className="wl-label">Message</label>
            <textarea className="wl-field" rows="4" placeholder="Hi, I've just pulled up against your boat. Planning on leaving in four days — let me know if you need me to move beforehand." style={{ resize: 'none' }}/>
          </div>
        </div>
        <div style={{ padding: 12, background: 'var(--linen)', borderRadius: 10, marginTop: 12, fontSize: 12.5, color: 'var(--silt)', display: 'flex', gap: 8, lineHeight: 1.5 }}>
          <Icon name="shield" size={16} color="var(--moss)" stroke={1.7}/>
          <div>Your username and boat index are shared with the recipient. They can reply, ignore or hide you.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={() => goto('inbox')} className="wl-btn is-ghost" style={{ flex: 1 }}>Cancel</button>
          <button onClick={() => goto('inbox')} className="wl-btn is-primary" style={{ flex: 2 }}>Send hail</button>
        </div>
      </div>
    </div>
    <GestureBar/>
  </div>
);

// Check-in: keep modal but with date pickers (added below as a richer one)
const CheckInModal = ({ goto }) => {
  const today = new Date();
  const fortnight = new Date(); fortnight.setDate(today.getDate() + 14);
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const [arrive, setArrive] = React.useState(today.toISOString().slice(0, 10));
  const [leave, setLeave] = React.useState(fortnight.toISOString().slice(0, 10));
  return (
    <div className="wl-screen" style={{ background: 'oklch(0.22 0.012 200 / 0.45)' }}>
      <StatusBar/>
      <div style={{ flex: 1 }} onClick={() => goto('map')}/>
      <div className="wl-sheet">
        <div className="wl-sheet-handle"/>
        <div style={{ padding: '6px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.018em', margin: 0 }}>Drop a pin here</h2>
            <button onClick={() => goto('map')} style={{ background: 'none', border: 0, padding: 6, cursor: 'pointer', color: 'var(--silt)' }}><Icon name="close"/></button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--linen)', borderRadius: 10, marginBottom: 16 }}>
            <Icon name="pin" size={18} color="var(--moss)"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Mile End, Regent's Canal</div>
              <div style={{ fontSize: 12, color: 'var(--silt)' }}>51.5234, -0.0356</div>
            </div>
            <a style={{ fontSize: 13, color: 'var(--moss)', fontWeight: 600 }}>Adjust</a>
          </div>
          <div className="wl-stack" style={{ '--gap': '14px' }}>
            <div>
              <label className="wl-label">Stay dates</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div className="wl-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silt)', marginBottom: 4 }}>Arrived</div>
                  <input className="wl-field" type="date" value={arrive} onChange={e => setArrive(e.target.value)}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="wl-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--silt)', marginBottom: 4 }}>Leaving</div>
                  <input className="wl-field" type="date" value={leave} onChange={e => setLeave(e.target.value)}/>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--silt)', marginTop: 6 }}>Defaults to 14-day max stay (CRT rule).</div>
            </div>
            <div>
              <label className="wl-label">A note (optional)</label>
              <textarea className="wl-field" rows="2" placeholder="What's it like here? Any tips for the next boater?" style={{ resize: 'none' }}/>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="wl-btn is-ghost" style={{ flex: 1 }}><Icon name="camera" size={16}/> Add photo</button>
              <button className="wl-btn is-primary" style={{ flex: 1 }} onClick={() => goto('map')}>Check in</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 0', fontSize: 12.5, color: 'var(--silt)' }}>
            <Icon name="lock" size={14}/> Visible only to you. Friends-only sharing in Settings.
          </div>
        </div>
      </div>
      <GestureBar/>
    </div>
  );
};

Object.assign(window, { LogbookScreen, LogbookEntry, LogbookNew, CheckInModal, MarketScreen, ProductScreen, MessageSellerModal, InboxScreen, MessageThread, HailThread, HailBoatModal });
