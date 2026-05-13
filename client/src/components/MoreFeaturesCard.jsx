import { useState } from 'react';
import Icon from './Icon';
import MoreFeaturesModal from './MoreFeaturesModal';

const DISMISS_KEY = 'wl_more_features_dismissed';

export default function MoreFeaturesCard() {
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1'
  );
  const [open, setOpen] = useState(false);

  if (dismissed) return null;

  const dismiss = (e) => {
    e.stopPropagation();
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <>
      <button className="wl-d-floatcard" onClick={() => setOpen(true)} aria-label="See all features">
        <span className="wl-d-floatcard-x" onClick={dismiss} role="button" aria-label="Dismiss">
          <Icon name="close" size={14} color="var(--silt)" />
        </span>

        <div className="wl-d-floatcard-phone">
          <img src="/onboarding/card-3-hails.png" alt="" />
        </div>

        <div className="wl-d-floatcard-body">
          <div className="wl-d-floatcard-title">Looking for more?</div>
          <div className="wl-d-floatcard-sub">
            Hazard map, messaging, logbook & more
          </div>
          <div className="wl-d-floatcard-cta">
            See the full app <Icon name="chevron" size={14} color="var(--moss)" />
          </div>
        </div>
      </button>

      {open && <MoreFeaturesModal onClose={() => setOpen(false)} />}
    </>
  );
}
