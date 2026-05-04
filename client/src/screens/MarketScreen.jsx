import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'parts', label: 'Parts' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'services', label: 'Services' },
];

export default function MarketScreen() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'parts', price: '', condition: 'good' });
  const [formError, setFormError] = useState('');

  const load = async (cat = category) => {
    setLoading(true);
    try {
      const params = { sortBy: 'newest' };
      if (cat) params.category = cat;
      const data = await api.listProducts(params);
      setProducts(data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const selectCategory = (cat) => {
    setCategory(cat);
    load(cat);
  };

  const submitListing = async () => {
    setFormError('');
    try {
      const p = await api.createProduct({ ...form, price: parseFloat(form.price) });
      setProducts(prev => [p, ...prev]);
      setShowNew(false);
      setForm({ title: '', description: '', category: 'parts', price: '', condition: 'good' });
    } catch (e) {
      setFormError(e.message);
    }
  };

  return (
    <div className="screen">
      <div className="appbar">
        <h1>Market</h1>
        {user && (
          <button onClick={() => setShowNew(true)} className="btn primary" style={{ height: 38, padding: '0 14px', fontSize: 14 }}>
            <Icon name="plus" size={16} color="white" /> Sell
          </button>
        )}
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => selectCategory(c.id)}
            className={`chip${category === c.id ? ' active' : ''}`}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="scroll" style={{ padding: '0 16px 16px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>Loading…</div>
        ) : products.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--silt)' }}>
            <Icon name="market" size={40} color="var(--pebble)" />
            <p>No listings yet.</p>
            {user && <button onClick={() => setShowNew(true)} className="btn primary">Post the first one</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 4 }}>
            {products.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(31,42,38,0.5)', display: 'flex', alignItems: 'flex-end' }}>
          <div className="sheet" style={{ width: '100%', maxHeight: '90vh', overflow: 'auto', padding: '0 0 40px' }}>
            <div className="sheet-handle" />
            <div style={{ padding: '16px 20px 0' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 19, fontWeight: 600 }}>New listing</h3>
              <div className="stack">
                <div>
                  <label className="label">Title</label>
                  <input className="field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Stove fan, barely used" />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    <option value="parts">Parts</option>
                    <option value="equipment">Equipment</option>
                    <option value="accessories">Accessories</option>
                    <option value="services">Services</option>
                  </select>
                </div>
                <div>
                  <label className="label">Condition</label>
                  <select className="field" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                    <option value="new">New</option>
                    <option value="like_new">Like new</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
                <div>
                  <label className="label">Price (£)</label>
                  <input className="field" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0 for free" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="field" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the item…" style={{ resize: 'none' }} />
                </div>
                {formError && <div className="error-msg">{formError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowNew(false)} className="btn ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={submitListing} disabled={!form.title || !form.description || !form.price} className="btn primary" style={{ flex: 1 }}>List it</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }) {
  return (
    <div className="card" style={{ cursor: 'pointer' }}>
      <div style={{ background: 'var(--linen)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="market" size={36} color="var(--pebble)" />
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, marginBottom: 4 }} className="truncate">{product.title}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--moss)' }}>£{product.price.toLocaleString()}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
          <Avatar name={product.sellerId?.displayName} size={20} />
          <span style={{ fontSize: 12, color: 'var(--silt)' }} className="truncate">{product.sellerId?.displayName || 'Boater'}</span>
        </div>
      </div>
    </div>
  );
}
