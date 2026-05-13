import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import Icon from '../../components/Icon';
import Avatar from '../../components/Avatar';
import Plate from '../../components/Plate';
import DesktopHeader from './DesktopHeader';
import MoreFeaturesCard from '../../components/MoreFeaturesCard';
import MoreFeaturesModal from '../../components/MoreFeaturesModal';

export default function DesktopProductDetailScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgIdx, setImgIdx] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getProduct(id);
        setProduct(data);
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="wl-d-page">
        <DesktopHeader active="market" />
        <div className="wl-d-empty">Loading…</div>
      </div>
    );
  }
  if (error || !product) {
    return (
      <div className="wl-d-page">
        <DesktopHeader active="market" />
        <div className="wl-d-empty">{error || 'Listing not found'}</div>
      </div>
    );
  }

  const seller = product.sellerId || {};
  const images = product.images || [];
  const currentImg = images[imgIdx];

  const onContact = () => {
    // No auth = can't message; show the "get the app" modal instead
    setShowFeatures(true);
  };

  return (
    <div className="wl-d-page">
      <DesktopHeader active="market" />

      <div className="wl-d-detail">
        <button className="wl-d-back" onClick={() => nav('/')}>
          <Icon name="back" size={18} /> Back to marketplace
        </button>

        <div className="wl-d-detail-grid">
          {/* Left: image gallery */}
          <div className="wl-d-detail-media">
            <div
              className="wl-d-detail-hero"
              style={{
                background: currentImg ? `url(${currentImg}) center/cover no-repeat` : 'var(--linen)',
              }}
            >
              {!currentImg && <Icon name="market" size={56} color="var(--pebble)" />}
            </div>
            {images.length > 1 && (
              <div className="wl-d-detail-thumbs">
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={`wl-d-thumb ${i === imgIdx ? 'on' : ''}`}
                    onClick={() => setImgIdx(i)}
                    style={{ background: `url(${src}) center/cover no-repeat` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: info */}
          <aside className="wl-d-detail-info">
            <div className="wl-d-detail-cat">{product.category || 'General'}</div>
            <h1 className="wl-d-detail-title">{product.title}</h1>

            <div className="wl-d-detail-pricerow">
              <span className="wl-d-detail-price">
                {product.price === 0 ? 'Free' : `£${product.price?.toLocaleString()}`}
              </span>
              {product.condition && (
                <span className="wl-d-chip-static" style={{ textTransform: 'capitalize' }}>
                  {String(product.condition).replace('_', ' ')}
                </span>
              )}
            </div>

            <div className="wl-d-detail-section">
              <div className="wl-d-detail-label">Description</div>
              <p>{product.description || 'No description provided.'}</p>
            </div>

            <div className="wl-d-detail-seller">
              <Avatar name={seller.displayName} src={seller.profilePhotoUrl} size={42} />
              <div>
                <div className="wl-d-detail-seller-name">
                  {seller.displayName || 'Boater'}
                  {seller.isVerified && <Icon name="verified" size={16} color="var(--moss)" />}
                </div>
                {seller.boatName && <Plate>{seller.boatName}</Plate>}
              </div>
            </div>

            {user ? (
              <button
                className="wl-d-btn primary block"
                onClick={() => { if (seller._id) nav(`/inbox/listing/${product._id}/${seller._id}`); }}
              >
                Message seller
              </button>
            ) : (
              <>
                <button className="wl-d-btn primary block" onClick={onContact}>
                  Message seller
                </button>
                <div className="wl-d-locknote">
                  <Icon name="lock" size={14} color="var(--silt)" />
                  <span>Free account needed to message — takes 30 seconds on your phone.</span>
                </div>
              </>
            )}

            <div className="wl-d-guarantee">
              <Icon name="shield" size={20} color="var(--moss)" />
              <div>
                <div className="wl-d-guarantee-title">Boater's Guarantee</div>
                <p>All listings on Waterline are from verified boaters.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <MoreFeaturesCard />
      {showFeatures && <MoreFeaturesModal onClose={() => setShowFeatures(false)} />}
    </div>
  );
}
