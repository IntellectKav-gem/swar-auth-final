import React from 'react';

export const AudioVisualizer = ({ isRecording, levels = [12, 22, 34, 48, 62, 45, 30, 20, 35, 50, 68, 52, 38, 24, 14] }) => {
  return (
    <div className="voice-visualizer-stage">
      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: isRecording ? 'var(--accent-cyan)' : 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="pulse-dot" style={{ background: isRecording ? 'var(--accent-cyan)' : 'var(--text-subtle)' }}></span>
        <span>{isRecording ? 'Capturing Acoustic Spectral Signature...' : 'Voice Stream Idle'}</span>
      </div>

      <div className="wave-container" style={{ opacity: isRecording ? 1 : 0.45 }}>
        {levels.map((level, idx) => {
          const heightPx = isRecording ? Math.max(10, Math.min(65, level * 1.2)) : 8;
          return (
            <div
              key={idx}
              className="wave-bar"
              style={{
                height: `${heightPx}px`,
                transition: 'height 80ms ease, background 200ms ease',
                background: isRecording
                  ? 'linear-gradient(180deg, var(--accent-cyan), var(--accent-violet))'
                  : 'rgba(255, 255, 255, 0.12)',
                boxShadow: isRecording ? '0 0 12px rgba(0, 245, 228, 0.4)' : 'none'
              }}
            />
          );
        })}
      </div>

      {isRecording && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          <span>FREQ: <b>44.1 kHz</b></span>
          <span>SNR: <b>+28.4 dB</b></span>
          <span>BIOMARKERS: <b style={{ color: 'var(--accent-cyan)' }}>142 DETECTED</b></span>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizer;
