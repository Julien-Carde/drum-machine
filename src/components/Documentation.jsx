import React from 'react';
import './Documentation.css';

export default function Documentation() {
  return (
    <div className="documentation">
      <h1>TR-909 Guide</h1>
      
      <section>
        <h2>Overview</h2>
        <p>Welcome to our drum sequencer, inspired by the legendary <a href="https://en.wikipedia.org/wiki/Roland_TR-909" target="_blank" rel="noopener noreferrer">Roland TR-909</a> Rhythm Composer. This web app brings you the iconic sounds and features that helped create genres like techno and house music.</p>
      </section>

      <section>
        <h2>Sound Presets</h2>
        <div className="preset-grid">
          <div className="preset-card">
            <h3>Classic 909</h3>
            <p>Original TR-909 sounds - perfect for authentic drum patterns.</p>
          </div>
          <div className="preset-card">
            <h3>Industrial</h3>
            <p>Enhanced, powerful drum sounds for gritty modern techno tracks.</p>
          </div>
          <div className="preset-card">
            <h3>Lo-Fi</h3>
            <p>Vintage-style, filtered sounds with added character.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>How to Use</h2>
        
        <h3>Basic Controls</h3>
        <ul>
          <li><strong>Play/Stop:</strong> Press to start or stop your sequence</li>
          <li><strong>Reset:</strong> Press to clear all steps and start fresh</li>
        </ul>

        <h3>Sound Adjustments</h3>
        <ul>
          <li><strong>Tempo:</strong> Adjust speed (60-180 BPM) - Double-click for 120 BPM</li>
          <li><strong>Swing:</strong> Add groove (0-100%) - Double-click for no swing</li>
          <li><strong>Master Volume:</strong> Set overall level - Double-click for 50%</li>
          <li><strong>Filter:</strong> Shape the sound - Double-click to fully open</li>
        </ul>

        <h3>Creating Patterns</h3>
        <ul>
          <li><strong>Track Volumes:</strong> Click and drag drum names to adjust individual volumes</li>
          <li><strong>Step Sequencer:</strong> Click boxes to add/remove hits, or drag across multiple steps</li>
          <li><strong>Playback Position:</strong> Follow the highlighted step as your pattern plays</li>
        </ul>
      </section>

      <section>
        <h2>Quick Tips</h2>
        <ul>
          <li>Start with a preset and adjust the swing to instantly change the groove</li>
          <li>Create multiple patterns and switch between them while playing</li>
          <li>Fine-tune your drum mix by adjusting individual track volumes</li>
        </ul>
      </section>

      <footer>
        <p>happy beatmaking!</p>
        <p className="credit">made by Julien Cardeillac</p>
      </footer>
    </div>
  );
} 