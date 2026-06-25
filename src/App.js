import React, { useState, useCallback } from 'react';
import './App.css';
import Header from './components/Header';
import ItemSearch from './components/ItemSearch';
import ServerSelector from './components/ServerSelector';
import MarketGrid from './components/MarketGrid';
import ItemDetailModal from './components/ItemDetailModal';
import { fetchItemAcrossWorlds } from './api';

export default function App() {
  // The list of items the user has added to track
  const [trackedItems, setTrackedItems] = useState([]);
  // Which worlds/servers are selected for comparison
  const [selectedWorlds, setSelectedWorlds] = useState(['Gilgamesh', 'Behemoth', 'Famfrit']);
  // Market data cache: { [itemId]: { [world]: marketData } }
  const [marketData, setMarketData] = useState({});
  // Which items are currently loading
  const [loadingItems, setLoadingItems] = useState({});
  // Item open in detail modal
  const [detailItem, setDetailItem] = useState(null);

  // Add an item and immediately fetch its prices
  const handleAddItem = useCallback(async (item) => {
    // Don't add duplicates
    if (trackedItems.find(i => i.id === item.id)) return;

    setTrackedItems(prev => [...prev, item]);
    setLoadingItems(prev => ({ ...prev, [item.id]: true }));

    const data = await fetchItemAcrossWorlds(item.id, selectedWorlds);
    setMarketData(prev => ({ ...prev, [item.id]: data }));
    setLoadingItems(prev => ({ ...prev, [item.id]: false }));
  }, [trackedItems, selectedWorlds]);

  // Remove an item from tracking
  const handleRemoveItem = useCallback((itemId) => {
    setTrackedItems(prev => prev.filter(i => i.id !== itemId));
    setMarketData(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  // Refresh prices for all tracked items on new world selection
  const handleWorldsChange = useCallback(async (worlds) => {
    setSelectedWorlds(worlds);
    if (trackedItems.length === 0) return;

    // Mark all as loading
    const loadingMap = {};
    trackedItems.forEach(i => { loadingMap[i.id] = true; });
    setLoadingItems(loadingMap);

    // Fetch all in parallel
    const updates = await Promise.all(
      trackedItems.map(item =>
        fetchItemAcrossWorlds(item.id, worlds).then(data => ({ id: item.id, data }))
      )
    );

    const newMarketData = {};
    updates.forEach(({ id, data }) => { newMarketData[id] = data; });
    setMarketData(newMarketData);
    setLoadingItems({});
  }, [trackedItems]);

  // Refresh a single item's prices
  const handleRefreshItem = useCallback(async (item) => {
    setLoadingItems(prev => ({ ...prev, [item.id]: true }));
    const data = await fetchItemAcrossWorlds(item.id, selectedWorlds);
    setMarketData(prev => ({ ...prev, [item.id]: data }));
    setLoadingItems(prev => ({ ...prev, [item.id]: false }));
  }, [selectedWorlds]);

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <div className="controls-bar">
          <ItemSearch onAddItem={handleAddItem} trackedItems={trackedItems} />
          <ServerSelector
            selectedWorlds={selectedWorlds}
            onWorldsChange={handleWorldsChange}
          />
        </div>

        <MarketGrid
          trackedItems={trackedItems}
          selectedWorlds={selectedWorlds}
          marketData={marketData}
          loadingItems={loadingItems}
          onRemoveItem={handleRemoveItem}
          onRefreshItem={handleRefreshItem}
          onOpenDetail={setDetailItem}
        />
      </main>

      {detailItem && (
        <ItemDetailModal
          item={detailItem}
          selectedWorlds={selectedWorlds}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  );
}
