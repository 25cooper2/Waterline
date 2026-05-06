import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import Icon from '../components/Icon';
import Avatar from '../components/Avatar';
import Plate from '../components/Plate';

function distanceMi(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 0.621371;
}

export default function ProductDetailScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState('');
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getProduct(id);
        setProduct(data);
        if (user && data.favorites?.includes(user._id)) setLiked(true);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}, { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const toggleFav = async () => {
    if (!user) return;
    try {
      if (liked) {
        await api.unfavoriteProduct(id);
      } else {
        await api.favoriteProduct(id);
      }
      setLiked(!liked);
    } catch { }
  };

  if (loading) {
    return (
      <div className="screen">
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--silt)' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="screen">
        <div className="appbar">
          <button onClick={() => nav('/market')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
            <Icon name="back" size={24} />
          </button>
          <h1>Product</h1>
          <div style={{ width: 24 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--silt)', padding: 40, textAlign: 'center' }}>
          {error || 'Product not found'}
        </div>
      </div>
    );
  }

  const seller = product.sellerId || {};
  const condition = product.condition?.replace('_', ' ') || 'Good';

  return (
    <div className="screen">
      <div className="scroll">
        {/* Full-bleed image area */}
        <div style={{
          position: 'relative', height: 320, background: 'var(--linen)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="market" size={56} color="var(--pebble)" />

          {/* Floating back button */}
          <button
            onClick={() => nav('/market')}
            style={{
              position: 'absolute', top: 16, left: 16,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--sh-1)',
            }}
          >
            <Icon name="back" size={22} color="var(--ink)" />
          </button>

          {/* Floating heart button */}
          <button
            onClick={toggleFav}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--sh-1)',
            }}
          >
            <Icon name="heart" size={20} color={liked ? 'var(--rust)' : 'var(--silt)'} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 120px' }}>
          {/* Category */}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--silt)',
            marginBottom: 8,
          }}>
            {product.category || 'General'}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.2 }}>
            {product.title}
          </h1>

          {/* Price + condition + distance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--moss)' }}>
              {product.price === 0 ? 'Free' : `£${product.price?.toLocaleString()}`}
            </span>
            <span className="chip" style={{ height: 26, fontSize: 12, padding: '0 10px', textTransform: 'capitalize' }}>
              {condition}
            </span>
            {(() => {
              if (user && product.sellerId?._id === user._id) {
                return <span className="chip" style={{ height: 26, fontSize: 12, padding: '0 10px' }}>Your listing</span>;
              }
              if (userLoc && product.lat && product.lng) {
                const mi = distanceMi(userLoc.lat, userLoc.lng, product.lat, product.lng);
                return <span className="chip" style={{ height: 26, fontSize: 12, padding: '0 10px' }}>
                  {mi < 0.1 ? 'Here' : `${mi.toFixed(1)} mi away`}
                </span>;
              }
              if (!userLoc) {
                return <span className="chip" style={{ height: 26, fontSize: 12, padding: '0 10px', color: 'var(--silt)' }}>Enable location for distance</span>;
              }
              return <span className="chip" style={{ height: 26, fontSize: 12, padding: '0 10px', color: 'var(--silt)' }}>No pickup location set</span>;
            })()}
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <div className="label">Description</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink)', margin: 0 }}>
              {product.description || 'No description provided.'}
            </p>
          </div>

          {/* Seller card */}
          <div
            className="card"
            style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 16 }}
          >
            <Avatar name={seller.displayName} size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{seller.displayName || 'Boater'}</span>
                <Icon name="verified" size={16} color="var(--moss)" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {seller.boatName && <Plate>{seller.boatName}</Plate>}
                <span style={{ fontSize: 12, color: 'var(--pebble)' }}>Joined 2024</span>
              </div>
            </div>
            <Icon name="chevron" size={20} color="var(--pebble)" />
          </div>

          {/* Boater's Guarantee */}
          <div style={{
            background: 'var(--moss-soft)', borderRadius: 'var(--r-md)',
            padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{ flexShrink: 0, marginTop: 2 }}>
              <Icon name="shield" size={22} color="var(--moss)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--moss-dark)', marginBottom: 4 }}>
                Boater's Guarantee
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--moss-2)', margin: 0 }}>
                All listings on Waterline are from verified boaters. Report any issues and we'll help resolve them.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
        background: 'var(--paper)', borderTop: '1px solid var(--reed)',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <button
          onClick={toggleFav}
          style={{
            width: 52, height: 52, borderRadius: 'var(--r-md)',
            border: '1px solid var(--reed)', background: 'var(--paper-2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="heart" size={22} color={liked ? 'var(--rust)' : 'var(--silt)'} />
        </button>
        <button
          className="btn primary block"
          onClick={() => {
            if (seller._id) nav(`/inbox?to=${seller._id}`);
          }}
        >
          Message seller
        </button>
      </div>
    </div>
  );
}
