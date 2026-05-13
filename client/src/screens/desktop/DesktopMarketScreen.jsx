import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import Plate from '../../components/Plate';
import DesktopHeader from './DesktopHeader';
import MoreFeaturesCard from '../../components/MoreFeaturesCard';

const THING_CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'engines', label: 'Engines & parts' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'heating', label: 'Heating' },
  { id: 'fittings', label: 'Fittings' },
  { id: 'moorings', label: 'Moorings' },
];
const BOAT_CATEGORIES = [
  { id: '', label: 'All boats' },
  { id: 'narrowboat', label: 'Narrowboat' },
  { id: 'widebeam', label: 'Widebeam' },
  { id: 'cruiser', label: 'Cruiser' },
  { id: 'other', label: 'Other' },
];
const SERVICE_CATEGORIES = [
  { id: '', label: 'All services' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'paint', label: 'Paint & sign' },
  { id: 'survey', label: 'Survey' },
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'tuition', label: 'Tuition' },
];

export default function DesktopMarketScreen() {
  const nav = useNavigate();
  const [tab, setTab] = useState('things');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories =
    tab === 'things' ? THING_CATEGORIES : tab === 'boats' ? BOAT_CATEGORIES : SERVICE_CATEGORIES;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = { sortBy: 'newest' };
        if (category) params.category = category;
        if (tab === 'things') params.type = 'thing';
        else if (tab === 'boats') params.type = 'boat';
        else if (tab === 'services') params.type = 'service';
        const data = await api.listProducts(params);
        if (!cancelled) setProducts(data);
      } catch {
        if (!cancelled) setProducts([]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tab, category]);

  const filtered = products.filter(p =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="wl-d-page">
      <DesktopHeader active="market" />

      {/* Hero */}
      <section className="wl-d-hero">
        <div className="wl-d-hero-inner">
          <h1 className="wl-d-hero-title">
            The marketplace built for life on the cut
          </h1>
          <p className="wl-d-hero-sub">
            Buy and sell boats, spare parts, and find skilled tradespeople — all from
            verified UK boaters. Free to browse. No middleman, no fees.
          </p>
          <div className="wl-d-hero-search">
            <Icon name="search" size={20} color="var(--silt)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search engines, paint, mooring, surveyors..."
            />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="wl-d-tabs">
        <div className="wl-d-tabs-inner">
          {[
            { id: 'things', label: 'Things' },
            { id: 'boats', label: 'Boats' },
            { id: 'services', label: 'Services' },
          ].map(t => (
            <button
              key={t.id}
              className={`wl-d-tab ${tab === t.id ? 'on' : ''}`}
              onClick={() => { setTab(t.id); setCategory(''); }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category strip */}
      <div className="wl-d-cats">
        <div className="wl-d-cats-inner">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`wl-d-chip ${category === c.id ? 'on' : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <main className="wl-d-grid-wrap">
        {loading ? (
          <div className="wl-d-empty">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="wl-d-empty">
            <Icon name="market" size={42} color="var(--pebble)" />
            <p>No listings match yet — try another category.</p>
          </div>
        ) : tab === 'services' ? (
          <div className="wl-d-services">
            {filtered.map(s => (
              <DesktopServiceCard key={s._id} service={s} onClick={() => nav(`/market/product/${s._id}`)} />
            ))}
          </div>
        ) : (
          <div className="wl-d-grid">
            {filtered.map(p => (
              <DesktopProductCard key={p._id} product={p} onClick={() => nav(`/market/product/${p._id}`)} />
            ))}
          </div>
        )}
      </main>

      <footer className="wl-d-footer">
        <div className="wl-d-footer-inner">
          <div>
            <div className="wl-d-footer-brand">
              <img src="/logo.png" alt="" />
              <span>Waterline</span>
            </div>
            <p>Built by boaters, for boaters. Free forever to browse and list.</p>
          </div>
          <div className="wl-d-footer-links">
            <a href="/features">All features</a>
            <a href="/features">Get the app</a>
          </div>
        </div>
      </footer>

      <MoreFeaturesCard />
    </div>
  );
}

function DesktopProductCard({ product, onClick }) {
  const img = (product.images || [])[0];
  return (
    <div className="wl-d-card" onClick={onClick}>
      <div
        className="wl-d-card-img"
        style={{
          background: img ? `url(${img}) center/cover no-repeat` : 'var(--linen)',
        }}
      >
        {!img && <Icon name="market" size={38} color="var(--pebble)" />}
      </div>
      <div className="wl-d-card-body">
        <div className="wl-d-card-title">{product.title}</div>
        <div className="wl-d-card-price">
          {product.price === 0 ? 'Free' : `£${product.price?.toLocaleString()}`}
        </div>
        {product.sellerId?.displayName && (
          <div className="wl-d-card-seller">
            <Avatar name={product.sellerId.displayName} src={product.sellerId.profilePhotoUrl} size={20} />
            <span>{product.sellerId.displayName}</span>
            {product.sellerId.boatName && <Plate>{product.sellerId.boatName}</Plate>}
          </div>
        )}
      </div>
    </div>
  );
}

function DesktopServiceCard({ service, onClick }) {
  return (
    <div className="wl-d-service" onClick={onClick}>
      <div className="wl-d-service-icon">
        <Icon name="service" size={32} color="var(--moss)" />
      </div>
      <div className="wl-d-service-body">
        <div className="wl-d-service-title">{service.title}</div>
        <div className="wl-d-service-seller">
          <Avatar name={service.sellerId?.displayName} src={service.sellerId?.profilePhotoUrl} size={22} />
          <span>{service.sellerId?.displayName || 'Boater'}</span>
          {service.sellerId?.boatName && <Plate>{service.sellerId.boatName}</Plate>}
        </div>
        <div className="wl-d-service-tags">
          {service.category && <span className="wl-d-chip-static">{service.category}</span>}
          {service.condition && <span className="wl-d-chip-static">{service.condition}</span>}
        </div>
      </div>
      <div className="wl-d-service-price">
        {service.price === 0 ? 'Quote' : `£${service.price?.toLocaleString()}`}
      </div>
    </div>
  );
}
