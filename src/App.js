import React, { useState } from 'react';
import DrumMachine from './components/DrumMachine';
import Documentation from './components/Documentation';
import Header from './components/Header';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('drum-machine');

  return (
    <>
      <div className="mobile-warning">
        <h1>Desktop Only</h1>
        <p>A mobile version is coming soon !</p>
        <p>Please visit us on your computer for the best experience.</p>
      </div>
      
      <div className="app">
        <Header 
          currentView={currentView}
          onViewChange={setCurrentView}
        />
        {currentView === 'drum-machine' ? <DrumMachine /> : <Documentation />}
      </div>
    </>
  );
}

export default App; 