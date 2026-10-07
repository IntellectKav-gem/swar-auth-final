import React from 'react';

export const Logo = ({ 
  size = 'md', 
  showText = true, 
  subtitle = false, 
  animated = true,
  style = {},
  className = '' 
}) => {
  // Dimension mapping
  const sizeMap = {
    sm: { icon: 28, font: '1rem', gap: '0.5rem', glow: '0 0 12px rgba(63, 216, 224, 0.4)' },
    md: { icon: 36, font: '1.2rem', gap: '0.65rem', glow: '0 0 18px rgba(63, 216, 224, 0.45)' },
    lg: { icon: 48, font: '1.5rem', gap: '0.85rem', glow: '0 0 24px rgba(63, 216, 224, 0.5)' },
    xl: { icon: 72, font: '2.1rem', gap: '1.1rem', glow: '0 0 35px rgba(63, 216, 224, 0.6)' },
  };

  const dim = typeof size === 'number' 
    ? { icon: size, font: `${size * 0.4}px`, gap: '0.6rem', glow: '0 0 16px rgba(63, 216, 224, 0.4)' }
    : (sizeMap[size] || sizeMap.md);

  return (
    <div 
      className={`swar-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dim.gap,
        userSelect: 'none',
        ...style
      }}
    >
      {/* Emblem Frame */}
      <div 
        style={{
          width: `${dim.icon}px`,
          height: `${dim.icon}px`,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '24%',
          background: 'linear-gradient(135deg, rgba(8, 18, 36, 0.95), rgba(5, 10, 20, 0.98))',
          border: '1.5px solid rgba(63, 216, 224, 0.4)',
          boxShadow: dim.glow,
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0
        }}
      >
        {/* Animated Glow Backdrop */}
        {animated && (
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(63, 216, 224, 0.25), transparent 70%)',
              animation: 'swarPulse 3s infinite alternate ease-in-out',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Crisp Vector Shield & Mic Emblem SVG */}
        <svg 
          viewBox="0 0 100 100" 
          style={{ 
            width: '80%', 
            height: '80%', 
            zIndex: 1, 
            filter: 'drop-shadow(0 0 4px rgba(63, 216, 224, 0.7))' 
          }}
        >
          <defs>
            <linearGradient id="logoCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3FD8E0" />
              <stop offset="100%" stopColor="#4E8CFF" />
            </linearGradient>
          </defs>

          {/* Shield Contour */}
          <path 
            d="M 50 12 L 82 24 C 82 58 70 80 50 90 C 30 80 18 58 18 24 Z" 
            fill="rgba(63, 216, 224, 0.08)" 
            stroke="url(#logoCyanGrad)" 
            strokeWidth="3.5" 
            strokeLinejoin="round"
          />

          {/* Microphone Body */}
          <rect 
            x="44" 
            y="30" 
            width="12" 
            height="22" 
            rx="6" 
            fill="#081224" 
            stroke="url(#logoCyanGrad)" 
            strokeWidth="2.5" 
          />

          {/* Mic Mesh lines */}
          <line x1="46" y1="36" x2="54" y2="36" stroke="#3FD8E0" strokeWidth="1.5" opacity="0.8" />
          <line x1="45" y1="41" x2="55" y2="41" stroke="#3FD8E0" strokeWidth="1.5" opacity="0.8" />

          {/* Mic Stand Arc */}
          <path 
            d="M 40 43 C 40 57, 60 57, 60 43" 
            fill="none" 
            stroke="url(#logoCyanGrad)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          <line x1="50" y1="54" x2="50" y2="63" stroke="url(#logoCyanGrad)" strokeWidth="2.5" />
          <line x1="43" y1="63" x2="57" y2="63" stroke="url(#logoCyanGrad)" strokeWidth="2.5" strokeLinecap="round" />

          {/* Soundwave line overlay */}
          <path 
            d="M 12 50 Q 24 50 30 42 T 40 58 T 50 38 T 60 62 T 70 42 Q 76 50 88 50" 
            fill="none" 
            stroke="#3FD8E0" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography Brand Name */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span 
            style={{
              fontFamily: "'Space Grotesk', 'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: dim.font,
              letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, #EAEEF7 30%, #3FD8E0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.15,
              filter: 'drop-shadow(0 2px 8px rgba(63, 216, 224, 0.25))'
            }}
          >
            SWAR-AUTH
          </span>
          {subtitle && (
            <span 
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#3FD8E0',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.9,
                marginTop: '1px'
              }}
            >
              Voice Biometrics
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
