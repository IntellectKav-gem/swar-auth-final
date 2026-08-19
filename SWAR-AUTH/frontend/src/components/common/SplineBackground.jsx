import React, { useRef, useEffect, useState } from 'react';
import Spline from '@splinetool/react-spline';

export default function SplineBackground() {
  const splineRef = useRef();
  const containerRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Handle window resize for responsive background
    const handleResize = () => {
      if (splineRef.current) {
        // Trigger re-render on resize if needed
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSplineLoad = (splineApp) => {
    console.log('✓ Spline scene loaded successfully');
    setIsLoaded(true);
    // Optional: Store spline app reference for advanced interactions
  };

  const handleSplineError = (error) => {
    console.error('✗ Error loading Spline scene:', error);
  };

  return (
    <div
      ref={containerRef}
      className="spline-background-container"
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
      {/* Spline Scene - Replace with your actual scene URL */}
      <Spline
        ref={splineRef}
        scene="https://prod.spline.design/YOUR_SCENE_ID/scene"
        onLoad={handleSplineLoad}
        onError={handleSplineError}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* Semi-transparent overlay for better text readability and contrast */}
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

      {/* Loading indicator (optional) */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            opacity: 0.5,
          }}
        >
          <div className="loader-spinner" />
        </div>
      )}
    </div>
  );
}
