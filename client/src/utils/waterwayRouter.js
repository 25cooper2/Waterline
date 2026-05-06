/**
 * Canal routing along OSM waterway geometry.
 *
 * For each pair of logbook entries:
 *  1. Fetch all waterway ways in the bounding box from Overpass
 *  2. Build a graph of connected nodes (canals meet at shared OSM node IDs)
 *  3. Snap each entry to the nearest graph node
 *  4. Run Dijkstra to find the shortest waterway path
 *  5. Return array of [lat, lng] coordinates following the canal geometry
 *
 * Returns null on failure (caller falls back to straight dashed line).
 */

// In-memory cache: bbox string → graph  (survives React re-renders)
const GRAPH_CACHE = new Map();

/* ── min-heap for efficient Dijkstra ──────────────────────────── */
class MinHeap {
  constructor() { this.h = []; }
  push(item) { this.h.push(item); this._up(this.h.length - 1); }
  pop() {
    const top = this.h[0];
    const last = this.h.pop();
    if (this.h.length) { this.h[0] = last; this._down(0); }
    return top;
  }
  get size() { return this.h.length; }
  _up(i) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.h[p].d <= this.h[i].d) break;
      [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p;
    }
  }
  _down(i) {
    const n = this.h.length;
    for (;;) {
      let m = i, l = 2*i+1, r = 2*i+2;
      if (l < n && this.h[l].d < this.h[m].d) m = l;
      if (r < n && this.h[r].d < this.h[m].d) m = r;
      if (m === i) break;
      [this.h[m], this.h[i]] = [this.h[i], this.h[m]]; i = m;
    }
  }
}

/* ── haversine distance in metres ─────────────────────────────── */
export function hav(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/* ── build adjacency graph from Overpass way elements ─────────── */
function buildGraph(ways) {
  // nodeId (OSM integer) → {lat, lng}
  const nodes = new Map();
  // nodeId → [{id, dist}]
  const adj = new Map();

  for (const way of ways) {
    if (!Array.isArray(way.geometry) || way.geometry.length < 2) continue;
    if (!Array.isArray(way.nodes) || way.nodes.length !== way.geometry.length) continue;

    for (let i = 0; i < way.nodes.length; i++) {
      const id = way.nodes[i];
      const g  = way.geometry[i];
      if (!nodes.has(id)) nodes.set(id, { lat: g.lat, lng: g.lon });
    }

    for (let i = 0; i < way.nodes.length - 1; i++) {
      const a = way.nodes[i], b = way.nodes[i + 1];
      const pa = nodes.get(a), pb = nodes.get(b);
      if (!pa || !pb) continue;
      const d = hav(pa.lat, pa.lng, pb.lat, pb.lng);
      if (!adj.has(a)) adj.set(a, []);
      if (!adj.has(b)) adj.set(b, []);
      adj.get(a).push({ id: b, dist: d });
      adj.get(b).push({ id: a, dist: d });
    }
  }

  return { nodes, adj };
}

/* ── snap a lat/lng to the nearest graph node ─────────────────── */
function nearestNode(lat, lng, nodes) {
  let bestId = null, bestDist = Infinity;
  for (const [id, pos] of nodes) {
    const d = hav(lat, lng, pos.lat, pos.lng);
    if (d < bestDist) { bestDist = d; bestId = id; }
  }
  return { id: bestId, dist: bestDist };
}

/* ── Dijkstra shortest path, returns [[lat,lng], …] or null ───── */
function dijkstra(nodes, adj, startId, endId) {
  if (startId === endId) {
    const p = nodes.get(startId);
    return p ? [[p.lat, p.lng]] : null;
  }

  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  for (const id of nodes.keys()) dist.set(id, Infinity);
  dist.set(startId, 0);

  const pq = new MinHeap();
  pq.push({ id: startId, d: 0 });

  while (pq.size > 0) {
    const { id, d } = pq.pop();
    if (visited.has(id)) continue;
    visited.add(id);
    if (id === endId) break;

    for (const { id: nb, dist: w } of (adj.get(id) || [])) {
      const nd = d + w;
      if (nd < dist.get(nb)) {
        dist.set(nb, nd);
        prev.set(nb, id);
        pq.push({ id: nb, d: nd });
      }
    }
  }

  // Reconstruct
  if (!prev.has(endId) && startId !== endId) return null;
  const path = [];
  let cur = endId;
  while (cur !== undefined) {
    const pos = nodes.get(cur);
    if (pos) path.unshift([pos.lat, pos.lng]);
    cur = prev.get(cur);
  }
  return path.length > 1 ? path : null;
}

/* ── fetch waterway graph for a bbox (cached) ─────────────────── */
async function fetchGraph(s, w, n, e) {
  const key = `${s.toFixed(3)},${w.toFixed(3)},${n.toFixed(3)},${e.toFixed(3)}`;
  if (GRAPH_CACHE.has(key)) return GRAPH_CACHE.get(key);

  const query = `[out:json][timeout:25];way["waterway"~"^(canal|river)$"](${s},${w},${n},${e});out geom;`;
  const url = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
  const data = await res.json();
  const graph = buildGraph(data.elements || []);
  GRAPH_CACHE.set(key, graph);
  return graph;
}

/* ── public API ───────────────────────────────────────────────── */

/**
 * Route along the nearest waterway between two points.
 * @param {number} fromLat
 * @param {number} fromLng
 * @param {number} toLat
 * @param {number} toLng
 * @param {{lat,lng}|null} via  Optional waypoint the route must pass through
 * @returns {Promise<[number,number][]|null>}  Path coords, or null on failure
 */
export async function routeAlongWaterway(fromLat, fromLng, toLat, toLng, via = null) {
  const PAD = 0.04; // ~4 km padding around the bounding box
  const s = Math.min(fromLat, toLat, via?.lat ?? Infinity) - PAD;
  const n = Math.max(fromLat, toLat, via?.lat ?? -Infinity) + PAD;
  const w = Math.min(fromLng, toLng, via?.lng ?? Infinity) - PAD;
  const e = Math.max(fromLng, toLng, via?.lng ?? -Infinity) + PAD;

  // Refuse bbox > ~0.8° (~55 km) — would be too slow / too much data
  if ((n - s) > 0.8 || (e - w) > 1.2) return null;

  const { nodes, adj } = await fetchGraph(s, w, n, e);
  if (nodes.size === 0) return null;

  const snapFrom = nearestNode(fromLat, fromLng, nodes);
  const snapTo   = nearestNode(toLat,   toLng,   nodes);

  // If either point snaps to something more than 1.5 km away, not near a waterway
  if (snapFrom.dist > 1500 || snapTo.dist > 1500) return null;

  if (!via) {
    return dijkstra(nodes, adj, snapFrom.id, snapTo.id);
  }

  // Route via waypoint: from → via → to
  const snapVia = nearestNode(via.lat, via.lng, nodes);
  if (snapVia.dist > 1500) return null;

  const r1 = dijkstra(nodes, adj, snapFrom.id, snapVia.id);
  const r2 = dijkstra(nodes, adj, snapVia.id, snapTo.id);
  if (!r1 || !r2) return null;
  return [...r1, ...r2.slice(1)]; // stitch (remove duplicate waypoint)
}
