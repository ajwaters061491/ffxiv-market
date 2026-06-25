import React from 'react';
import { extractPrices, formatGil, timeAgo } from '../api';
import './MarketGrid.css';

export default function MarketGrid({
  trackedItems, selectedWorlds, marketData, loadingItems,
  onRemoveItem, onRefreshItem, onOpenDetail
}) {
  if (trackedItems.length === 0) {
    return (
      <div className="grid-empty panel">
        <div className="empty-crystal">✦</div>
        <p className="empty-title">No items tracked yet</p>
        <p className="empty-sub">Search for an item above to begin comparing prices across servers.</p>
      </div>
    );
  }

  return (
    <div className="market-grid-wrap panel">
      <div className="grid-scroll">
        <table className="market-table">
          <thead>
            <tr>
              <th className="col-item">Item</th>
              {selectedWorlds.map(world => (
                <th key={world} className="col-world">{world}</th>
              ))}
              <th className="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {trackedItems.map(item => {
              const itemData = marketData[item.id] || {};
              const isLoading = loadingItems[item.id];

              // Find cheapest NQ price across all selected worlds for highlighting
              const allPrices = selectedWorlds
                .map(w => extractPrices(itemData[w]).nq)
                .filter(p => p !== null);
              const minNQ = allPrices.length ? Math.min(...allPrices) : null;

              return (
                <tr key={item.id} className="market-row">
                  {/* Item name + icon */}
                  <td className="col-item">
                    <div className="item-cell">
                      {item.icon && (
                        <img
                          className="item-icon"
                          src={item.icon}
                          alt=""
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <button
                        className="item-name-btn"
                        onClick={() => onOpenDetail(item)}
                        title="View detailed listings"
                      >
                        {item.name}
                      </button>
                    </div>
                  </td>

                  {/* Price cells per world */}
                  {selectedWorlds.map(world => {
                    const prices = extractPrices(itemData[world]);
                    const isCheapest = prices.nq !== null && prices.nq === minNQ;

                    return (
                      <td key={world} className={`col-world price-cell ${isCheapest ? 'cheapest' : ''}`}>
                        {isLoading ? (
                          <span className="spinner" />
                        ) : !itemData[world] ? (
                          <span className="price-na">—</span>
                        ) : (
                          <div className="price-stack">
                            <div className="price-nq">
                              {isCheapest && <span className="cheapest-badge" title="Cheapest NQ">★</span>}
                              {formatGil(prices.nq)}
                            </div>
                            {prices.hq !== null && (
                              <div className="price-hq">
                                <span className="hq-label">HQ</span>
                                {formatGil(prices.hq)}
                              </div>
                            )}
                            <div className="price-updated">{timeAgo(prices.lastUpdated)}</div>
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Actions */}
                  <td className="col-actions">
                    <div className="action-btns">
                      <button
                        className="btn-icon"
                        onClick={() => onRefreshItem(item)}
                        title="Refresh prices"
                        disabled={isLoading}
                      >
                        ↻
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => onRemoveItem(item.id)}
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
