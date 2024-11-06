import React, { useState, useEffect, useCallback, useRef } from 'react';
import './DrumMachine.css';

const LCD = ({ text, tempo }) => (
  <div className="lcd-screen">
    <div className="lcd-row">{`${Math.round(tempo)} BPM`}</div>
    <div className="lcd-row">{text}</div>
  </div>
);

export default function DrumMachine() {
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [filterFreq, setFilterFreq] = useState(22050);
  const [currentStepUI, setCurrentStepUI] = useState(0);
  const [swing, setSwing] = useState(0); // Swing amount in percentage
  const [displayText, setDisplayText] = useState('PATTERN 1');

  const audioContextRef = useRef(null);
  const filterNodeRef = useRef(null);
  const timerIDRef = useRef(null);
  const buffersRef = useRef({});

  const openHatSourceRef = useRef(null); // Reference for open hi-hat source
  const openHatGainRef = useRef(null);   // Reference for open hi-hat gain node

  const scheduleAheadTime = 0.1; // Seconds
  const lookahead = 25.0; // Milliseconds
  const STEPS = 16;

  const drumPads = [
    { id: 'kick', key: 'Q', label: 'BASS DRUM' },
    { id: 'snare', key: 'W', label: 'SNARE' },
    { id: 'hihat', key: 'E', label: 'CL HI HAT' }, // Closed hi-hat
    { id: 'openhat', key: 'A', label: 'O HI HAT' }, // Open hi-hat
    { id: 'clap', key: 'S', label: 'CLAP' },
    { id: 'rim', key: 'D', label: 'RIM' },
    { id: 'tom1', key: 'Z', label: 'HI TOM' },
    { id: 'tom2', key: 'X', label: 'MID TOM' },
    { id: 'crash', key: 'C', label: 'CRASH' },
    { id: 'ride', key: 'V', label: 'RIDE' },
  ];

  const [patterns, setPatterns] = useState([
    Array(drumPads.length).fill().map(() => Array(STEPS).fill(false)), // P1 starts with empty pattern
    Array(drumPads.length).fill().map(() => Array(STEPS).fill(false)), // P2
    Array(drumPads.length).fill().map(() => Array(STEPS).fill(false)), // P3
    Array(drumPads.length).fill().map(() => Array(STEPS).fill(false))  // P4
  ]);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);

  const [sequence, setSequence] = useState(patterns[0]);

  const sequenceRef = useRef(sequence);
  const tempoRef = useRef(tempo);
  const swingRef = useRef(swing);
  const volumeRef = useRef(volume);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  useEffect(() => {
    tempoRef.current = tempo;
  }, [tempo]);

  useEffect(() => {
    swingRef.current = swing;
  }, [swing]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const currentStepRef = useRef(0);
  const nextNoteTimeRef = useRef(0);

  const presets = [
    { 
      id: 'classic909', 
      name: 'Classic 909',
      variant: 'classic'
    },
    { 
      id: 'industrial', 
      name: 'Industrial',
      variant: 'hard'
    },
    { 
      id: 'lofi', 
      name: 'Lo-Fi',
      variant: 'lofi'
    }
  ];

  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);

  const handlePreviousPreset = () => {
    setCurrentPresetIndex((prev) => 
      prev === 0 ? presets.length - 1 : prev - 1
    );
  };

  const handleNextPreset = () => {
    setCurrentPresetIndex((prev) => 
      prev === presets.length - 1 ? 0 : prev + 1
    );
  };

  const handlePatternStore = (index) => {
    setPatterns(prevPatterns => {
      const newPatterns = [...prevPatterns];
      newPatterns[index] = [...sequence];
      return newPatterns;
    });
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--tempo', tempo);
  }, [tempo]);

  const DEFAULT_TEMPO = 120;
  const DEFAULT_SWING = 0;
  const DEFAULT_VOLUME = 0.5;
  const DEFAULT_FILTER = 22050;

  const handleTempoReset = () => setTempo(DEFAULT_TEMPO);
  const handleSwingReset = () => setSwing(DEFAULT_SWING);
  const handleVolumeReset = () => setVolume(DEFAULT_VOLUME);
  const handleFilterReset = () => setFilterFreq(DEFAULT_FILTER);

  useEffect(() => {
    setDisplayText(presets[currentPresetIndex].name);
  }, [currentPresetIndex]);

  const handleTrackVolumeChange = (e, padIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const updateVolume = (clientX) => {
      const position = clientX - rect.left;
      const width = rect.width;
      let newValue = Math.max(0, Math.min(1, position / width));
      setTrackVolumes(prev => {
        const newVolumes = [...prev];
        newVolumes[padIndex] = newValue;
        return newVolumes;
      });
    };

    updateVolume(e.clientX);

    const onMouseMove = (eMove) => {
      updateVolume(eMove.clientX);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const [trackVolumes, setTrackVolumes] = useState(Array(drumPads.length).fill(1.0));
  const trackVolumesRef = useRef(Array(drumPads.length).fill(1.0));

  useEffect(() => {
    trackVolumesRef.current = trackVolumes;
  }, [trackVolumes]);

  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      filterNodeRef.current = audioContextRef.current.createBiquadFilter();
      filterNodeRef.current.type = 'lowpass';
      filterNodeRef.current.frequency.value = filterFreq;
      filterNodeRef.current.connect(audioContextRef.current.destination);

      const variants = ['classic', 'hard', 'lofi'];
      buffersRef.current = {};

      const loadPromises = drumPads.flatMap(pad => 
        variants.map(async variant => {
          try {
            const response = await fetch(`/sounds/${pad.id}.${variant}.wav`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
            buffersRef.current[`${pad.id}.${variant}`] = audioBuffer;
          } catch (error) {
            console.error(`Failed to load sound: ${pad.id}.${variant}`, error);
          }
        })
      );

      await Promise.all(loadPromises);
      console.log('All sounds loaded');
    }
  }, [filterFreq, drumPads]);

  useEffect(() => {
    initializeAudioContext();
  }, [initializeAudioContext]);

  useEffect(() => {
    if (filterNodeRef.current) {
      filterNodeRef.current.frequency.value = filterFreq;
    }
  }, [filterFreq]);

  const playSound = useCallback(
    (id, time = 0) => {
      const padIndex = drumPads.findIndex(pad => pad.id === id);
      const variant = presets[currentPresetIndex].variant;
      const soundId = `${id}.${variant}`;

      if (!audioContextRef.current || !buffersRef.current[soundId]) return;

      const context = audioContextRef.current;
      const source = context.createBufferSource();
      source.buffer = buffersRef.current[soundId];

      const gainNode = context.createGain();
      gainNode.gain.value = volumeRef.current * trackVolumesRef.current[padIndex];

      source.connect(gainNode);
      gainNode.connect(filterNodeRef.current);

      if (time === 0) {
        source.start(context.currentTime);
      } else {
        source.start(time);
      }
    },
    [currentPresetIndex]
  );

  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(false);

  const toggleStep = (padIndex, stepIndex, forceValue = null) => {
    setSequence(prevSequence => {
      const newSequence = [...prevSequence];
      newSequence[padIndex] = [...newSequence[padIndex]];
      newSequence[padIndex][stepIndex] = forceValue !== null ? forceValue : !newSequence[padIndex][stepIndex];
      return newSequence;
    });
  };

  const handleMouseDown = (padIndex, stepIndex) => {
    setIsDragging(true);
    const newValue = !sequence[padIndex][stepIndex];
    setDragValue(newValue);
    toggleStep(padIndex, stepIndex);
  };

  const handleMouseEnter = (padIndex, stepIndex) => {
    if (isDragging) {
      toggleStep(padIndex, stepIndex, dragValue);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const [pendingPatternIndex, setPendingPatternIndex] = useState(null);
  const [isEndOfBar, setIsEndOfBar] = useState(false);

  const patternsRef = useRef(patterns);
  const currentPatternIndexRef = useRef(currentPatternIndex);
  const pendingPatternIndexRef = useRef(null);

  useEffect(() => {
    patternsRef.current = patterns;
  }, [patterns]);

  useEffect(() => {
    currentPatternIndexRef.current = currentPatternIndex;
  }, [currentPatternIndex]);

  const handlePatternSelect = (index) => {
    if (index === currentPatternIndexRef.current) return;

    setPatterns(prevPatterns => {
      const newPatterns = [...prevPatterns];
      newPatterns[currentPatternIndexRef.current] = [...sequence];
      patternsRef.current = newPatterns;
      return newPatterns;
    });

    if (!isPlaying) {
      setSequence(patternsRef.current[index]);
      setCurrentPatternIndex(index);
      currentPatternIndexRef.current = index;
      currentStepRef.current = 0;
      setCurrentStepUI(0);
    } else {
      pendingPatternIndexRef.current = index;
    }
  };

  const scheduler = useCallback(() => {
    const currentTime = audioContextRef.current?.currentTime || 0;

    while (nextNoteTimeRef.current < currentTime + scheduleAheadTime) {
      const currentStep = currentStepRef.current;
      const noteDuration = (60 / tempoRef.current) / 4;

      if (currentStep === STEPS - 1) {
        if (pendingPatternIndexRef.current !== null) {
          setSequence(patternsRef.current[pendingPatternIndexRef.current]);
          setCurrentPatternIndex(pendingPatternIndexRef.current);
          currentPatternIndexRef.current = pendingPatternIndexRef.current;
          pendingPatternIndexRef.current = null;
          currentStepRef.current = 0;
          setCurrentStepUI(0);
        }
      }

      let swingOffset = 0;
      if (swingRef.current > 0 && currentStep % 2 === 1) {
        swingOffset = noteDuration * (swingRef.current / 100);
      }

      sequenceRef.current.forEach((row, padIndex) => {
        if (row[currentStep]) {
          playSound(drumPads[padIndex].id, nextNoteTimeRef.current + swingOffset);
        }
      });

      setCurrentStepUI(currentStep);

      currentStepRef.current = (currentStep + 1) % STEPS;
      nextNoteTimeRef.current += noteDuration;
    }

    timerIDRef.current = setTimeout(scheduler, lookahead);
  }, [playSound]);

  useEffect(() => {
    if (isPlaying) {
      nextNoteTimeRef.current = audioContextRef.current?.currentTime || 0;
      scheduler();
    } else {
      currentStepRef.current = 0;
      setCurrentStepUI(0);
    }
    return () => clearTimeout(timerIDRef.current);
  }, [isPlaying, scheduler]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      const pad = drumPads.find(
        (pad) => pad.key.toLowerCase() === event.key.toLowerCase()
      );
      if (pad) {
        playSound(pad.id);
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playSound, drumPads]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleKnobChange = (e, setter, min, max) => {
    e.preventDefault();
    const startY = e.clientY;
    const startValue = setter === setTempo ? tempo : setter === setSwing ? swing : setter === setVolume ? volume : filterFreq;
    const range = max - min;
    const sensitivity = 0.5;

    const onMouseMove = (eMove) => {
      const deltaY = startY - eMove.clientY;
      let newValue = startValue + (deltaY * (range / 200)) * sensitivity;
      newValue = Math.max(min, Math.min(max, newValue));
      setter(newValue);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const resetSequence = () => {
    setSequence(drumPads.map(() => Array(STEPS).fill(false)));
    if (isPlaying) {
      setIsPlaying(false);
    }
    currentStepRef.current = 0;
    setCurrentStepUI(0);
  };

  return (
    <div className="drum-machine">
      <div className="title-container">
        <span className="title-left">TR-909</span>
        <span className="title-right">Rhythm Composer</span>
      </div>
      
      <div className="main-controls-row">
        <div className="transport-controls">
          <div className="button-group">
            <button
              className={`square-button play-button ${isPlaying ? 'playing' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {''}
            </button>
            <div className="button-label">
              {isPlaying ? 'STOP' : 'PLAY'}
            </div>
          </div>

          <div className="button-group">
            <button className="square-button reset-button" onClick={resetSequence}>
            </button>
            <div className="button-label">RESET</div>
          </div>
        </div>

        <div className="display-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="lcd-container" style={{ marginTop: '-20px' }}>
              <LCD text={displayText} tempo={tempo} />
            </div>
            <div className="preset-controls" style={{ marginTop: '-20px' }}>
              <button className="preset-arrow" onClick={handlePreviousPreset}>▲</button>
              <button className="preset-arrow" onClick={handleNextPreset}>▼</button>
            </div>
          </div>
          <div className="pattern-buttons">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="button-group pattern-button-group">
                <button
                  className={`square-button pattern-button 
                    ${currentPatternIndex === index ? 'pattern-active' : ''} 
                    ${pendingPatternIndexRef.current === index ? 'pattern-pending' : ''}`}
                  onClick={() => handlePatternSelect(index)}
                >
                  {/* Button content, e.g., an icon or text */}
                </button>
                <div className="button-label">{`P${index + 1}`}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="knob-controls">
          <div className="control-group">
            <div
              className="knob"
              onMouseDown={(e) => handleKnobChange(e, setTempo, 60, 180)}
              onDoubleClick={handleTempoReset}
              style={{ transform: `rotate(${((tempo - 60) / 120) * 270 - 135}deg)` }}
            >
              <input type="range" min="60" max="180" value={tempo} readOnly className="knob-input" />
            </div>
            <div className="knob-label">TEMPO</div>
          </div>

          <div className="control-group">
            <div
              className="knob"
              onMouseDown={(e) => handleKnobChange(e, setSwing, 0, 50)}
              onDoubleClick={handleSwingReset}
              style={{ transform: `rotate(${(swing / 50) * 270 - 135}deg)` }}
            >
              <input type="range" min="0" max="50" value={swing} readOnly className="knob-input" />
            </div>
            <div className="knob-label">SWING</div>
          </div>

          <div className="control-group">
            <div
              className="knob"
              onMouseDown={(e) => handleKnobChange(e, setVolume, 0, 1)}
              onDoubleClick={handleVolumeReset}
              style={{ transform: `rotate(${(volume / 1) * 270 - 135}deg)` }}
            >
              <input type="range" min="0" max="1" step="0.01" value={volume} readOnly className="knob-input" />
            </div>
            <div className="knob-label">VOLUME</div>
          </div>

          <div className="control-group">
            <div
              className="knob"
              onMouseDown={(e) => handleKnobChange(e, setFilterFreq, 200, 15000)}
              onDoubleClick={handleFilterReset}
              style={{ transform: `rotate(${((Math.min(filterFreq, 15000) - 200) / (15000 - 200)) * 270 - 135}deg)` }}
            >
              <input type="range" min="200" max="15000" value={filterFreq} readOnly className="knob-input" />
            </div>
            <div className="knob-label">FILTER</div>
          </div>
        </div>
      </div>

      <div className="sequencer-grid">
        <div className="beat-numbers">
          <div className="beat-numbers-strip">
            {Array.from({ length: STEPS }, (_, i) => (
              <div key={i} className="beat-number">
                {i + 1}
              </div>
            ))}
          </div>
        </div>
        
        {sequence.map((row, padIndex) => (
          <div key={padIndex} className="sequence-row">
            <div 
              className="pad-label"
              onMouseDown={(e) => handleTrackVolumeChange(e, padIndex)}
            >
              <div 
                className="volume-indicator" 
                style={{ width: `${trackVolumes[padIndex] * 100}%` }}
              />
              <span className="label-text">{drumPads[padIndex].label}</span>
            </div>
            {row.map((isActive, stepIndex) => (
              <div className="sequence-step-container" key={stepIndex}>
                <button
                  className={`sequence-step ${isActive ? 'active' : ''} ${currentStepUI === stepIndex ? 'current' : ''}`}
                  onMouseDown={() => handleMouseDown(padIndex, stepIndex)}
                  onMouseEnter={() => handleMouseEnter(padIndex, stepIndex)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}