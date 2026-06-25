import React, { useState, useEffect, useRef } from 'react';
import { searchItems } from '../api';
import './ItemSearch.css';

export default function ItemSearch({ onAddItem, trackedItems }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Debounce: wait 400ms after the user stops typing before searching
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const items = await searchItems(query);
      setResults(items);
      setShowDropdown(true);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(item) {
    onAddItem(item);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }

  const trackedIds = new Set(trackedItems.map(i => i.id));

  return (
    <div className="item-search panel" ref={wrapperRef}>
      <label className="search-label">Add Item</label>
      <div className="search-input-wrap">
        <input
          className="search-input"
          type="text"
          placeholder="Search for an item… (e.g. Rarefied Titanium)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
        />
        {isSearching && <span className="search-spinner spinner" />}
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="search-dropdown">
          {results.map(item => {
            const alreadyTracked = trackedIds.has(item.id);
            return (
              <li
                key={item.id}
                className={`search-result ${alreadyTracked ? 'already-tracked' : ''}`}
                onClick={() => !alreadyTracked && handleSelect(item)}
              >
                {item.icon && (
                  <img
                    className="result-icon"
                    src={item.icon}
                    alt=""
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <span className="result-name">{item.name}</span>
                {alreadyTracked && <span className="result-badge">Tracking</span>}
              </li>
            );
          })}
        </ul>
      )}

      {showDropdown && !isSearching && results.length === 0 && query.length >= 2 && (
        <div className="search-empty">No items found for "{query}"</div>
      )}
    </div>
  );
}
