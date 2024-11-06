import React from 'react';
import './Header.css';

export default function Header({ currentView, onViewChange }) {
  return (
    <header className="main-header">
      <div className="header-title">
        TR-909 Drum Machine
      </div>
      <button 
        className="docs-link"
        onClick={() => onViewChange(currentView === 'drum-machine' ? 'documentation' : 'drum-machine')}
      >
        {currentView === 'drum-machine' ? 'Documentation' : 'Back to Drum Machine'}
      </button>
    </header>
  );
} 