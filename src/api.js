// ── Universalis API ──────────────────────────────────────────────────────────
// Docs: https://docs.universalis.app/
// No API key required.

const UNIVERSALIS_BASE = 'https://universalis.app/api/v2';
const XIVAPI_V2_BASE = 'https://v2.xivapi.com';

// North American data centers and their worlds
export const NA_DATA_CENTERS = {
  Aether: ['Adamantoise', 'Cactuar', 'Faerie', 'Gilgamesh', 'Jenova', 'Midgardsormr', 'Sargatanas', 'Siren'],
  Primal: ['Behemoth', 'Excalibur', 'Exodus', 'Famfrit', 'Hyperion', 'Lamia', 'Leviathan', 'Ultros'],
  Crystal: ['Balmung', 'Brynhildr', 'Coeurl', 'Diabolos', 'Goblin', 'Malboro', 'Mateus', 'Zalera'],
  Dynamis: ['Halicarnassus', 'Maduin', 'Marilith', 'Seraph', 'Cuchulainn', 'Golem', 'Kraken', 'Rafflesia'],
};

export const ALL_NA_WORLDS = Object.values(NA_DATA_CENTERS).flat();

/**
 * Search for items by name using XIVAPI v2.
 * Docs: https://v2.xivapi.com/docs/guides/search/
 *
 * Key facts from the docs:
 *  - Endpoint: /api/search  (NOT /api/1/search)
 *  - Query syntax for partial match: Name~"text"
 *  - Use +Name~"text" to REQUIRE the match (filters out irrelevant rows)
 *  - Results shape: { results: [{ row_id, fields: { Name, Icon: { path_hr1 } } }] }
 */
export async function searchItems(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    // +Name~"query" means Name must contain the query string (required clause)
    const searchQuery = `+Name~"${query.trim()}"`;
    const params = new URLSearchParams({
      sheets: 'Item',
      query: searchQuery,
      fields: 'Name,Icon',
      limit: '10',
    });
    const url = `${XIVAPI_V2_BASE}/api/search?${params}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`XIVAPI v2 error: ${res.status}`);
    const data = await res.json();

    return (data.results || [])
      .filter(item => item.fields?.Name) // drop rows with empty names
      .map(item => {
        const iconPath = item.fields?.Icon?.path_hr1 || item.fields?.Icon?.path || null;
        return {
          id: item.row_id,
          name: item.fields.Name,
          icon: iconPath
            ? `${XIVAPI_V2_BASE}/asset?path=${encodeURIComponent(iconPath)}&format=png`
            : null,
        };
      });
  } catch (err) {
    console.error('Item search failed:', err);
    return [];
  }
}

/**
 * Fetch current market listings for a single item on a world or data center.
 */
export async function fetchMarketData(itemId, worldOrDC) {
  try {
    const url = `${UNIVERSALIS_BASE}/${encodeURIComponent(worldOrDC)}/${itemId}?listings=10&entries=10`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Universalis error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Market fetch failed for item ${itemId} on ${worldOrDC}:`, err);
    return null;
  }
}

/**
 * Fetch price history for a single item on a world or data center.
 */
export async function fetchPriceHistory(itemId, worldOrDC) {
  try {
    const url = `${UNIVERSALIS_BASE}/history/${encodeURIComponent(worldOrDC)}/${itemId}?entriesWithin=604800`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Universalis history error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`History fetch failed for item ${itemId} on ${worldOrDC}:`, err);
    return null;
  }
}

/**
 * Fetch market data for ONE item across MULTIPLE worlds in parallel.
 * Returns object: { [worldName]: marketData }
 */
export async function fetchItemAcrossWorlds(itemId, worlds) {
  const results = await Promise.all(
    worlds.map(world =>
      fetchMarketData(itemId, world).then(data => ({ world, data }))
    )
  );
  const out = {};
  for (const { world, data } of results) {
    out[world] = data;
  }
  return out;
}

/**
 * Pull the cheapest NQ and HQ listing prices from a Universalis response.
 */
export function extractPrices(marketData) {
  if (!marketData || !marketData.listings) return { nq: null, hq: null, avgNQ: null, avgHQ: null };
  const listings = marketData.listings;
  const nqListings = listings.filter(l => !l.hq);
  const hqListings = listings.filter(l => l.hq);
  return {
    nq: nqListings.length ? nqListings[0].pricePerUnit : null,
    hq: hqListings.length ? hqListings[0].pricePerUnit : null,
    avgNQ: marketData.averagePriceNQ ?? null,
    avgHQ: marketData.averagePriceHQ ?? null,
    lastUpdated: marketData.lastUploadTime ?? null,
    velocity: marketData.nqSaleVelocity ?? null,
  };
}

/** Format a number as gil with commas */
export function formatGil(n) {
  if (n === null || n === undefined) return '—';
  return Math.round(n).toLocaleString() + ' gil';
}

/** Format a Unix ms timestamp as a relative time string */
export function timeAgo(ms) {
  if (!ms) return 'unknown';
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
