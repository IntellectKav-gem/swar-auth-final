import React from 'react';

export const OverallAttendanceCard = ({ percentage = 75 }) => {
  const roundedPct = Math.min(100, Math.max(0, Math.round(percentage)));

  // SVG Circular Donut calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (roundedPct / 100) * circumference;

  let headingMsg = 'You are doing great!';
  let subMsg = 'Keep it up.';
  if (roundedPct < 75) {
    headingMsg = 'Attendance Alert!';
    subMsg = 'Try to attend upcoming classes.';
  } else if (roundedPct >= 90) {
    headingMsg = 'Excellent Standing!';
    subMsg = 'Outstanding attendance record.';
  }

  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(13, 17, 30, 0.65)',
        border: '1px solid rgba(120, 170, 255, 0.14)',
        borderRadius: '16px',
        padding: '1.4rem 1.6rem',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.1rem',
        flex: 1,
        minWidth: '280px',
        overflow: 'hidden'
      }}
    >
      {/* Background soft wave graphic overlay */}
      <svg
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '60%',
          height: '80%',
          opacity: 0.18,
          pointerEvents: 'none'
        }}
        viewBox="0 0 300 150"
        preserveAspectRatio="none"
      >
        <path
          d="M0,100 C80,20 160,130 240,60 C270,30 290,90 300,70 L300,150 L0,150 Z"
          fill="url(#cardWaveGradient)"
        />
        <defs>
          <linearGradient id="cardWaveGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4E8CFF" />
            <stop offset="100%" stopColor="#3FD8E0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Title */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '1.1rem',
        fontWeight: 600,
        color: '#EAEEF7',
        letterSpacing: '0.01em'
      }}>
        Overall Attendance
      </div>

      {/* Main Stats Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', zIndex: 1 }}>
        {/* Glowing Circular Progress Ring */}
        <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="9"
            />
            {/* Glowing Cyan Fill */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#3FD8E0"
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{
                transition: 'stroke-dashoffset 0.6s ease',
                filter: 'drop-shadow(0 0 8px rgba(63, 216, 224, 0.6))'
              }}
            />
          </svg>

          {/* Percentage Center Label */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.45rem',
              fontWeight: 700,
              color: '#3FD8E0',
              textShadow: '0 0 12px rgba(63, 216, 224, 0.4)'
            }}
          >
            {roundedPct}%
          </div>
        </div>

        {/* Message */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#EAEEF7',
              lineHeight: 1.2
            }}
          >
            {headingMsg}
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.9rem',
              color: '#8A93A8',
              lineHeight: 1.3
            }}
          >
            {subMsg}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallAttendanceCard;
