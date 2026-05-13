import { useNavigate } from 'react-router-dom';
import { useIsDesktop } from '../utils/useIsDesktop';

const VISIT_KEY = 'wl_visit_choice';

export function hasMadeFirstVisitChoice() {
  // Honour the older welcomed flag too so returning visitors don't see this again
  return !!(localStorage.getItem(VISIT_KEY) || localStorage.getItem('wl_welcomed'));
}

export function markFirstVisitChoice(choice) {
  localStorage.setItem(VISIT_KEY, choice);
  localStorage.setItem('wl_welcomed', '1');
}

export default function FirstVisitChoiceScreen({ onChoose }) {
  const nav = useNavigate();
  const isDesktop = useIsDesktop();

  const pick = (choice) => {
    markFirstVisitChoice(choice);
    if (onChoose) onChoose(choice);
    if (choice === 'marketplace') {
      // Desktop lands on the website home; phone goes straight to the market tab
      nav(isDesktop ? '/' : '/market', { replace: true });
    } else {
      // Full app — desktop shows the features page; phone goes to onboarding
      nav(isDesktop ? '/features' : '/onboarding/welcome', { replace: true });
    }
  };

  return (
    <div className="wl-choice-root">
      <div className="wl-choice-card">
        <img src="/logo.png" alt="Waterline" className="wl-choice-logo" />
        <div className="wl-choice-wordmark">Waterline</div>
        <div className="wl-choice-tag">The community built for life on the cut</div>

        <div className="wl-choice-buttons">
          <button
            type="button"
            className="wl-choice-btn primary"
            onClick={() => pick('marketplace')}
          >
            <span className="wl-choice-btn-title">Show me the marketplace</span>
            <span className="wl-choice-btn-sub">Browse boats, parts, and skilled tradespeople</span>
          </button>

          <button
            type="button"
            className="wl-choice-btn secondary"
            onClick={() => pick('features')}
          >
            <span className="wl-choice-btn-title">Show me all the features</span>
            <span className="wl-choice-btn-sub">Hazard map, messaging, logbook & more — full app</span>
          </button>
        </div>

        <div className="wl-choice-foot">Free to use. Built by boaters, for boaters.</div>
      </div>
    </div>
  );
}
