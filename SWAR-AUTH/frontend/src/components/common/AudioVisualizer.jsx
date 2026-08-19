import React from 'react';

export const AudioVisualizer = ({ isRecording, levels = [10, 15, 20, 30, 20, 15, 10, 5] }) => {
  return (
    <div className="wave-container" style={{ margin: '1.5rem 0', opacity: isRecording ? 1 : 0.4 }}>
      {levels.map((level, idx) => (
        <div
          key={idx}
          className="wave-bar"
          style={{
            height: isRecording ? `${Math.max(6, level)}px` : '6px',
            transition: 'height 100ms ease',
            background: isRecording
              ? 'linear-gradient(180deg, #6366f1, #06b6d4)'
              : '#334155'
          }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
