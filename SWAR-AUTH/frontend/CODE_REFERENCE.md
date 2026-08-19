# Complete SWAR-AUTH Spline Integration - Code Reference

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install @spline/react-spline
npm install
```

### 2. Get Your Spline Scene URL
Follow these steps:
1. Go to https://app.spline.design/
2. Create/modify your scene with the design guide provided
3. Click **Share** → **Publish to Web**
4. Copy the generated URL (e.g., `https://prod.spline.design/xxxxx/scene`)

### 3. Update Scene URL
Replace `YOUR_SCENE_ID` in the component:

**File:** `frontend/src/components/common/SplineBackground.jsx` (Line 29)
```jsx
scene="https://prod.spline.design/YOUR_SCENE_ID/scene"
```

### 4. Start Development Server
```bash
npm run dev
```

---

## Complete File Contents

### 1️⃣ SplineBackground.jsx

**Path:** `frontend/src/components/common/SplineBackground.jsx`

```jsx
import React, { useRef, useEffect, useState } from 'react';
import Spline from '@spline/react-spline';

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
```

---

### 2️⃣ SplineBackgroundAlternative.jsx (Iframe Version)

**Path:** `frontend/src/components/common/SplineBackgroundAlternative.jsx`

Use this if you don't want to install the npm package.

```jsx
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
```

---

### 3️⃣ main.jsx (Updated)

**Path:** `frontend/src/main.jsx`

Add the import and component to your existing file:

```jsx
// ADD THIS IMPORT:
import SplineBackground from './components/common/SplineBackground';

// ... rest of imports ...

// THEN UPDATE THE ReactDOM.createRoot:
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SplineBackground />  {/* ADD THIS LINE */}
    <App />
  </React.StrictMode>
);
```

---

### 4️⃣ index.css (Spline-Specific Styles)

**Path:** `frontend/src/index.css`

Add these styles at the end of your existing CSS file:

```css
/* ============================================
   SPLINE 3D BACKGROUND STYLES
   ============================================ */

#root {
  position: relative;
  z-index: 0;
}

/* Spline Background Container */
.spline-background-container {
  position: fixed;
  top: 0;
  left: 0;
  width: '100%';
  height: 100vh;
  z-index: -1;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1a3e 100%);
}

/* Spline Scene Container */
.spline-background-container iframe,
.spline-background-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* Ensure UI Elements Appear Above Background */
.navbar,
.sidebar,
.login-form,
.dashboard,
.app-container,
.main-wrapper {
  position: relative;
  z-index: 10;
}

.content-area {
  position: relative;
  z-index: 10;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(8px);
}

/* Enhanced Button Glow for Spline Background */
.btn-primary {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary:hover {
  box-shadow: 0 0 30px rgba(0, 217, 255, 0.6),
              0 0 50px rgba(99, 102, 241, 0.3);
}

/* Cyan Glow Accent */
.btn-primary::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, rgba(0, 217, 255, 0.3), rgba(99, 102, 241, 0.3));
  border-radius: var(--radius-sm);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.btn-primary:hover::before {
  opacity: 1;
}

/* Card Glow Enhancement */
.card {
  border-color: rgba(6, 182, 212, 0.1);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(0, 217, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.1),
              var(--shadow-md);
}

.card-glass {
  background: rgba(15, 23, 42, 0.5);
  border-color: rgba(0, 217, 255, 0.15);
}

/* Form Input Glow */
.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: #00d9ff;
  box-shadow: 0 0 0 3px rgba(0, 217, 255, 0.15),
              0 0 20px rgba(0, 217, 255, 0.2);
}

/* Loading Spinner Animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-fade {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 217, 255, 0.2);
  border-top: 3px solid #00d9ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Table Adjustments for Glass Background */
.table-container {
  background: rgba(30, 41, 59, 0.4);
  border-color: rgba(0, 217, 255, 0.15);
  backdrop-filter: blur(8px);
}

.custom-table th {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(0, 217, 255, 0.1);
}

.custom-table td {
  border-color: rgba(0, 217, 255, 0.08);
}

/* Badge Adjustments */
.badge-primary {
  background: rgba(0, 217, 255, 0.1);
  color: #00ffff;
  border-color: rgba(0, 217, 255, 0.3);
}

/* Voice Recorder with Cyan Accent */
.recording-pulse {
  animation: pulseGlow 1.5s infinite;
  background: #00d9ff !important;
  color: #000 !important;
  box-shadow: 0 0 20px rgba(0, 217, 255, 0.5);
}

@keyframes pulseGlow {
  0% { box-shadow: 0 0 0 0 rgba(0, 217, 255, 0.7); }
  70% { box-shadow: 0 0 0 20px rgba(0, 217, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 217, 255, 0); }
}

/* Wave Bars with Gradient */
.wave-bar {
  background: linear-gradient(180deg, #00d9ff, #0099ff);
  box-shadow: 0 0 10px rgba(0, 217, 255, 0.6);
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .content-area {
    padding: 1rem;
  }

  .spline-background-container {
    display: none;
  }

  #root {
    background: linear-gradient(135deg, #0a0e27 0%, #1a1a3e 100%);
  }
}

/* Prevent Selection Highlight on Background */
.spline-background-container {
  user-select: none;
  -webkit-user-select: none;
}

/* Smooth Transitions Throughout App */
* {
  transition-property: color, background-color, border-color, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

---

### 5️⃣ package.json (Dependency Added)

**Path:** `frontend/package.json`

Add this to your dependencies:

```json
"dependencies": {
  "@spline/react-spline": "^3.5.0",
  "lucide-react": "^0.344.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0"
}
```

---

## Environment Variables (Optional)

**Path:** `frontend/.env`

For better configuration management:

```env
VITE_SPLINE_SCENE_URL=https://prod.spline.design/YOUR_SCENE_ID/scene
VITE_OVERLAY_OPACITY=0.2
VITE_ENABLE_SPLINE=true
```

Then update `SplineBackground.jsx` line 29:

```jsx
const sceneUrl = import.meta.env.VITE_SPLINE_SCENE_URL;
const overlayOpacity = parseFloat(import.meta.env.VITE_OVERLAY_OPACITY || '0.2');
const enableSpline = import.meta.env.VITE_ENABLE_SPLINE === 'true';

// Use these values:
scene={sceneUrl}
background={`rgba(10, 14, 39, ${overlayOpacity})`}
```

---

## Color Palette for Spline

Use these colors in your Spline scene for consistency:

```
Dark Navy/Black:    #0a0e27
Deep Purple-Blue:   #1a1a3e
Electric Blue:      #00d9ff (Primary Accent)
Bright Blue:        #0099ff (Secondary Accent)
Violet:             #7c3aed (Highlight)
Off-White:          #f8fafc (Text)
Gray-Blue:          #94a3b8 (Muted Text)
Card Surface:       #1e293b
Border:             #334155
```

---

## Deployment Checklist

- [ ] Install `@spline/react-spline` package
- [ ] Add Spline scene URL to component
- [ ] Test locally with `npm run dev`
- [ ] Verify animations are smooth (60 FPS)
- [ ] Check responsive design on mobile
- [ ] Test on different browsers
- [ ] Build for production: `npm run build`
- [ ] Deploy to production server
- [ ] Monitor performance in production

---

## Troubleshooting Commands

```bash
# Clear node_modules and reinstall
rm -r node_modules package-lock.json
npm install

# Clear browser cache
# (DevTools → Storage → Clear Site Data)

# Test build
npm run build

# Preview production build
npm run preview

# Check for console errors
# DevTools → Console tab
```

---

**Ready to deploy!** 🚀
