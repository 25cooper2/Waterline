import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCachedLocation, saveDeviceLocation } from '../utils/deviceLocation';
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
  const [userLoc, setUserLoc] = useState(() => getCachedLocation());
  const [imgIndex, setImgIndex] = useState(0);
  const viewRecordedRef = useRef(false); // prevent double-recording on strict mode mount

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
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          saveDeviceLocation(loc.lat, loc.lng);
          setUserLoc(loc);
        },
        () => {}, { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
      );
    }
  }, []);

  // Record a unique view (deduplicated by IP+userAgent server-side)
  useEffect(() => {
    if (product && !viewRecordedRef.current) {
      viewRecordedRef.current = true;
      api.recordProductView(id).catch(() => {});
    }
  }, [product, id]);

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
  const isOwner = user && seller._id === user._id;
  const images = product.images || [];
  const currentImg = images[imgIndex];

  const touchX = useRef(null);
  const handleTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchX.current === null || images.length < 2) return;
    const diff = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setImgIndex(i => (i + (diff > 0 ? 1 : -1) + images.length) % images.length);
    }
    touchX.current = null;
  };

  return (
    <div className="screen">
      <div className="scroll">
        {/* Full-bleed image area */}
        <div
          style={{
            position: 'relative', height: 320,
            background: currentImg ? `url(${currentImg}) center/cover no-repeat` : 'var(--linen)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {!currentImg && <Icon name="market" size={56} color="var(--pebble)" />}

          {/* Floating back button */}
          <button
            onClick={() => nav(-1)}
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
          {!isOwner && (
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
          )}

          {/* Image dots */}
          {images.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 12, left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: 6,
            }}>
              {images.map((_, i) => (
                <div key={i} onClick={() => setImgIndex(i)} style={{
                  width: i === imgIndex ? 18 : 6, height: 6,
                  borderRadius: 3, cursor: 'pointer',
                  background: i === imgIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'width 0.2s',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 28px' }}>
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
            {isOwner && (
              <span className="chip" style={{ height: 26, fontSize: 12, padding: '0 10px' }}>Your listing</span>
            )}
            {!isOwner && userLoc && (() => {
              const sellerLat = seller.mooringLat ?? product.lat;
              const sellerLng = seller.mooringLng ?? product.lng;
              if (!sellerLat || !sellerLng) return null;
              const mi = distanceMi(userLoc.lat, userLoc.lng, sellerLat, sellerLng);
              return <span className="chip" style={{ height: 26, fontSize: 12, padding: '0 10px' }}>
                {mi < 0.1 ? '< 0.1 mi away' : `${mi.toFixed(1)} mi away`}
              </span>;
            })()}
            {product.viewers && product.viewers.length > 0 && (
              <span className="chip pebble" style={{ height: 26, fontSize: 12, padding: '0 10px' }}>
                <Icon name="eye" size={12} color="var(--pebble)" /> {product.viewers.length} viewer{product.viewers.length !== 1 ? 's' : ''}
              </span>
            )}
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

      {/* Bottom bar — sits naturally at the bottom of the flex column */}
      <div style={{
        flexShrink: 0,
        padding: '14px 20px', paddingBottom: 'calc(14px + env(safe-area-inset-bottom))',
        background: 'var(--paper)', borderTop: '1px solid var(--reed)',
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        {isOwner ? (
          <button className="btn primary block" onClick={() => nav(`/market/edit/${id}`)}>
            Edit listing
          </button>
        ) : (
          <>
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
              onClick={() => { if (seller._id) nav(`/inbox?to=${seller._id}`); }}
            >
              Message seller
            </button>
          </>
        )}
      </div>
    </div>
  );
}
