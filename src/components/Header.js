import React from 'react';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-title">
          <span className="header-crystal">✦</span>
          <h1>Aetheryte Market</h1>
          <span className="header-crystal">✦</span>
        </div>
        <p className="header-sub">FFXIV Marketboard Price Tracker — North America</p>
      </div>
      <div className="header-line" />
    </header>
  );
}
