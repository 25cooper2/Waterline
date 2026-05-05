import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';

const PRODUCT_CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'engines', label: 'Engines & parts' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'heating', label: 'Heating' },
  { id: 'fittings', label: 'Fittings' },
  { id: 'moorings', label: 'Moorings' },
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

export default function MarketScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = tab === 'products' ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES;

  const load = async (cat = category) => {
    setLoading(true);
    try {
      const params = { sortBy: 'newest' };
      if (cat) params.category = cat;
      if (tab === 'services') params.type = 'service';
      const data = await api.listProducts(params);
      setProducts(data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const selectCategory = (cat) => {
    setCategory(cat);
    load(cat);
  };

  const switchTab = (t) => {
    setTab(t);
    setCategory('');
  };

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    return p.title?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '20px 18px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>Market</h1>
          <p style={{ fontSize: 14, color: 'var(--silt)', margin: '4px 0 0', fontWeight: 500 }}>Buying, selling & trading along the cut</p>
        </div>
        {user && (
          <button
            onClick={() => nav('/market/new')}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: 'var(--moss)', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 2,
            }}
          >
            <Icon name="plus" size={20} color="white" />
          </button>
        )}
      </div>

      {/* Products / Services toggle */}
      <div style={{ padding: '16px 18px 0', flexShrink: 0 }}>
        <div className="seg" style={{ width: '100%', display: 'flex' }}>
          <button className={tab === 'products' ? 'on' : ''} onClick={() => switchTab('products')} style={{ flex: 1 }}>Products</button>
          <button className={tab === 'services' ? 'on' : ''} onClick={() => switchTab('services')} style={{ flex: 1 }}>Services</button>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: '14px 18px 0', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--paper-2)', border: '1px solid var(--reed)',
          borderRadius: 'var(--r-md)', padding: '0 14px', height: 46,
        }}>
          <Icon name="search" size={18} color="var(--pebble)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'products' ? 'Search products...' : 'Search services...'}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              font: '400 15px var(--font-sans)', color: 'var(--ink)',
            }}
          />
          <div style={{ cursor: 'pointer', display: 'flex' }}>
            <Icon name="filter" size={18} color="var(--silt)" />
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div style={{
        padding: '14px 18px', display: 'flex', gap: 8,
        overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none',
      }}>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => selectCategory(c.id)}
            className={`chip${category === c.id ? ' active' : ''}`}
          >
            {c.label}{c.id === '' && tab === 'products' ? ` · ${products.length}` : ''}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="scroll" style={{ padding: '0 18px 24px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="market" size={40} color="var(--pebble)" />
            <p style={{ margin: '12px 0 0', fontSize: 15 }}>No listings yet.</p>
            {user && (
              <button onClick={() => nav('/market/new')} className="btn primary" style={{ marginTop: 16 }}>
                Post the first one
              </button>
            )}
          </div>
        ) : tab === 'products' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {filteredProducts.map(p => (
              <ProductCard key={p._id} product={p} onClick={() => nav(`/market/product/${p._id}`)} />
            ))}
          </div>
        ) : (
          <div className="stack">
            {filteredProducts.map(p => (
              <ServiceCard key={p._id} service={p} onClick={() => nav(`/market/service/${p._id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, onClick }) {
  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div style={{
        background: 'var(--linen)', height: 130,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="market" size={36} color="var(--pebble)" />
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, marginBottom: 6 }} className="truncate">
          {product.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--moss)' }}>
            {product.price === 0 ? 'Free' : `£${product.price?.toLocaleString()}`}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--pebble)', marginTop: 6 }}>
          2.4 mi away
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service, onClick }) {
  const tags = [service.category, service.condition].filter(Boolean);
  return (
    <div className="card" style={{ cursor: 'pointer', display: 'flex', overflow: 'hidden' }} onClick={onClick}>
      <div style={{
        width: 100, minHeight: 110, background: 'var(--linen)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="service" size={30} color="var(--pebble)" />
      </div>
      <div style={{ padding: '12px 14px', flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3, marginBottom: 6 }} className="truncate">
          {service.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Avatar name={service.sellerId?.displayName} size={22} />
          <span style={{ fontSize: 13, color: 'var(--silt)' }} className="truncate">
            {service.sellerId?.displayName || 'Boater'}
          </span>
          {service.sellerId?.boatName && (
            <Plate>{service.sellerId.boatName}</Plate>
          )}
        </div>
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {tags.map(t => (
              <span key={t} className="chip moss" style={{ height: 24, fontSize: 12, padding: '0 10px' }}>{t}</span>
            ))}
          </div>
        )}
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--moss)' }}>
          {service.price === 0 ? 'Quote' : `£${service.price?.toLocaleString()}`}
        </div>
      </div>
    </div>
  );
}
