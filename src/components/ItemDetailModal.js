import React, { useState, useEffect } from 'react';
import { fetchMarketData, fetchPriceHistory, formatGil, timeAgo } from '../api';
import './ItemDetailModal.css';

export default function ItemDetailModal({ item, selectedWorlds, onClose }) {
  const [activeWorld, setActiveWorld] = useState(selectedWorlds[0]);
  const [listings, setListings] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('listings'); // 'listings' | 'history'

  // Fetch data whenever world changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      setListings(null);
      setHistory(null);
      const [marketData, historyData] = await Promise.all([
        fetchMarketData(item.id, activeWorld),
        fetchPriceHistory(item.id, activeWorld),
      ]);
      setListings(marketData);
      setHistory(historyData);
      setLoading(false);
    }
    load();
  }, [item.id, activeWorld]);

  // Close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            {item.icon && (
              <img
                className="modal-item-icon"
                src={item.icon}
                alt=""
                onError={e => { e.target.style.display = 'none'; }}
              />
            )}
            <div>
              <h2 className="modal-item-name">{item.name}</h2>
              <p className="modal-subtitle">Market Listings</p>
            </div>
          </div>
          <button className="btn-icon modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* World tabs */}
          <div className="world-tabs">
            {selectedWorlds.map(world => (
              <button
                key={world}
                className={`world-tab ${activeWorld === world ? 'active' : ''}`}
                onClick={() => setActiveWorld(world)}
              >
                {world}
              </button>
            ))}
          </div>

          {/* Content tabs */}
          <div className="content-tabs">
            <button
              className={`content-tab ${tab === 'listings' ? 'active' : ''}`}
              onClick={() => setTab('listings')}
            >
              Current Listings
            </button>
            <button
              className={`content-tab ${tab === 'history' ? 'active' : ''}`}
              onClick={() => setTab('history')}
            >
              Sale History
            </button>
          </div>

          {/* Body */}
          {loading ? (
            <div className="modal-loading">
              <span className="spinner" />
              <span>Fetching data from Universalis…</span>
            </div>
          ) : tab === 'listings' ? (
            <ListingsTab data={listings} />
          ) : (
            <HistoryTab data={history} />
          )}
        </div>
      </div>
    </div>
  );
}

function ListingsTab({ data }) {
  if (!data || !data.listings || data.listings.length === 0) {
    return <p className="modal-empty">No listings found on this server.</p>;
  }

  return (
    <div>
      {/* Summary row */}
      <div className="listing-summary">
        <div className="summary-stat">
          <span className="stat-label">Avg NQ</span>
          <span className="stat-value">{formatGil(data.averagePriceNQ)}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Avg HQ</span>
          <span className="stat-value text-purple">{formatGil(data.averagePriceHQ)}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Updated</span>
          <span className="stat-value text-muted">{timeAgo(data.lastUploadTime)}</span>
        </div>
      </div>

      <table className="detail-table">
        <thead>
          <tr>
            <th>Quality</th>
            <th>Price / unit</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Retainer</th>
            <th>Town</th>
          </tr>
        </thead>
        <tbody>
          {data.listings.map((l, i) => (
            <tr key={i} className={l.hq ? 'row-hq' : ''}>
              <td>{l.hq ? <span className="hq-tag">HQ</span> : <span className="nq-tag">NQ</span>}</td>
              <td className="price-col">{formatGil(l.pricePerUnit)}</td>
              <td>{l.quantity}</td>
              <td className="text-muted">{formatGil(l.total)}</td>
              <td className="text-muted">{l.retainerName || '—'}</td>
              <td className="text-muted">{l.retainerCity !== undefined ? cityName(l.retainerCity) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryTab({ data }) {
  if (!data || !data.entries || data.entries.length === 0) {
    return <p className="modal-empty">No recent sales history found.</p>;
  }

  return (
    <table className="detail-table">
      <thead>
        <tr>
          <th>Quality</th>
          <th>Price / unit</th>
          <th>Qty</th>
          <th>Buyer</th>
          <th>Sold</th>
        </tr>
      </thead>
      <tbody>
        {data.entries.slice(0, 20).map((e, i) => (
          <tr key={i} className={e.hq ? 'row-hq' : ''}>
            <td>{e.hq ? <span className="hq-tag">HQ</span> : <span className="nq-tag">NQ</span>}</td>
            <td className="price-col">{formatGil(e.pricePerUnit)}</td>
            <td>{e.quantity}</td>
            <td className="text-muted">{e.buyerName || '—'}</td>
            <td className="text-muted">{timeAgo((e.timestamp || 0) * 1000)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Universalis uses numeric city IDs
function cityName(id) {
  const cities = { 1: 'Limsa', 2: "Ul'dah", 3: 'Gridania', 4: 'Ishgard', 7: 'Kugane', 9: 'Crystarium', 10: 'Old Sharlayan', 12: 'Tuliyollal' };
  return cities[id] || `City ${id}`;
}
