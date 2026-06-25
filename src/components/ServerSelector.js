import React, { useState } from 'react';
import { NA_DATA_CENTERS } from '../api';
import './ServerSelector.css';

export default function ServerSelector({ selectedWorlds, onWorldsChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedSet = new Set(selectedWorlds);

  function toggleWorld(world) {
    const next = selectedSet.has(world)
      ? selectedWorlds.filter(w => w !== world)
      : [...selectedWorlds, world];
    // Require at least 1 world
    if (next.length > 0) onWorldsChange(next);
  }

  function toggleDC(dc) {
    const dcWorlds = NA_DATA_CENTERS[dc];
    const allSelected = dcWorlds.every(w => selectedSet.has(w));
    if (allSelected) {
      // Deselect all in DC (keep at least 1 total selected)
      const next = selectedWorlds.filter(w => !dcWorlds.includes(w));
      if (next.length > 0) onWorldsChange(next);
    } else {
      // Select all in DC
      const next = [...new Set([...selectedWorlds, ...dcWorlds])];
      onWorldsChange(next);
    }
  }

  return (
    <div className="server-selector panel">
      <label className="search-label">Servers ({selectedWorlds.length} selected)</label>
      <button className="btn-primary server-toggle-btn" onClick={() => setIsOpen(o => !o)}>
        {selectedWorlds.slice(0, 3).join(', ')}{selectedWorlds.length > 3 ? ` +${selectedWorlds.length - 3} more` : ''} ▾
      </button>

      {isOpen && (
        <div className="server-panel">
          {Object.entries(NA_DATA_CENTERS).map(([dc, worlds]) => {
            const allSelected = worlds.every(w => selectedSet.has(w));
            const someSelected = worlds.some(w => selectedSet.has(w));
            return (
              <div key={dc} className="dc-group">
                <button
                  className={`dc-header ${allSelected ? 'dc-all' : someSelected ? 'dc-some' : ''}`}
                  onClick={() => toggleDC(dc)}
                >
                  <span className="dc-name">{dc}</span>
                  <span className="dc-hint">{allSelected ? 'deselect all' : 'select all'}</span>
                </button>
                <div className="world-list">
                  {worlds.map(world => (
                    <button
                      key={world}
                      className={`world-btn ${selectedSet.has(world) ? 'world-selected' : ''}`}
                      onClick={() => toggleWorld(world)}
                    >
                      {world}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="server-panel-footer">
            <button className="btn-primary" onClick={() => setIsOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
