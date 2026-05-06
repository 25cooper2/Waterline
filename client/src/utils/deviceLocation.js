/**
 * Cached device location — persists across React navigation within a session.
 * Backed by localStorage so it survives page reloads too (with a 10-min TTL).
 */

const KEY = 'wl_device_loc';
const TTL_MS = 10 * 60 * 1000; // 10 minutes

// Module-level cache — survives component unmount/remount without touching localStorage
let _cache = null;

function _load() {
  if (_cache) return _cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > TTL_MS) { localStorage.removeItem(KEY); return null; }
    _cache = { lat: parsed.lat, lng: parsed.lng };
    return _cache;
  } catch { return null; }
}

function _save(lat, lng) {
  _cache = { lat, lng };
  try { localStorage.setItem(KEY, JSON.stringify({ lat, lng, ts: Date.now() })); } catch {}
}

/**
 * Returns the last-known location immediately (from cache), then kicks off a
 * fresh GPS read in the background. Call `onUpdate` if you want to react to
 * the fresher reading.
 *
 * @param {(loc: {lat:number, lng:number}) => void} onUpdate - called when fresh GPS arrives
 * @returns {{lat:number, lng:number}|null} cached location (may be null on first use)
 */
export function getDeviceLocation(onUpdate) {
  const cached = _load();

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        _save(loc.lat, loc.lng);
        if (onUpdate) onUpdate(loc);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  return cached;
}

/** Just returns the cache synchronously — no GPS request. */
export function getCachedLocation() {
  return _load();
}

/** Manually update cache (e.g. when MapScreen already has a fresh reading). */
export function saveDeviceLocation(lat, lng) {
  _save(lat, lng);
}
