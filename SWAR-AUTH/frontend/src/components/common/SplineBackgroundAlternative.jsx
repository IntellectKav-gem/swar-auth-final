/**
 * SplineBackgroundAlternative.jsx
 * 
 * Alternative iframe-based Spline component for SWAR-AUTH
 * Use this if you prefer NOT to install the @spline/react-spline package
 * Simply replace the import in main.jsx from:
 *   import SplineBackground from './components/common/SplineBackground'
 * To:
 *   import SplineBackgroundAlternative as SplineBackground from './components/common/SplineBackgroundAlternative'
 */

import React, { useState } from 'react';

export default function SplineBackgroundAlternative() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: -1,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1a3e 100%)',
      }}
    >
      {/* Spline Scene Iframe - Replace YOUR_SCENE_ID with your Spline scene URL */}
      <iframe
        src="https://prod.spline.design/YOUR_SCENE_ID/scene"
        frameBorder="0"
        width="100%"
        height="100%"
        style={{
          display: 'block',
          border: 'none',
        }}
        allow="xr-spatial-tracking"
        title="SWAR-AUTH 3D Voice Background"
        onLoad={() => {
          console.log('✓ Spline scene loaded');
          setIsLoaded(true);
        }}
        onError={(e) => {
          console.error('✗ Error loading Spline scene:', e);
        }}
      />

      {/* Semi-transparent overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(10, 14, 39, 0.2)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </div>
  );
}
