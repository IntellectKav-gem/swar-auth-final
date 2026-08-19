# SWAR-AUTH Spline 3D Background Integration Guide

## Overview

This guide covers the complete setup and integration of a custom Spline 3D scene as a fullscreen animated background for your SWAR-AUTH voice-attendance application.

---

## Installation

### Step 1: Install Dependencies

```bash
cd frontend
npm install @spline/react-spline
```

This has already been added to your `package.json`. Now install:

```bash
npm install
```

---

## Files Created/Modified

### 1. **SplineBackground.jsx** (NEW)
Located at: `frontend/src/components/common/SplineBackground.jsx`

The main React component that renders the Spline 3D scene.

**Features:**
- Loads Spline scene via URL
- Handles loading/error states
- Semi-transparent overlay for text readability
- Responsive positioning
- Mouse interaction support (configured in Spline editor)

**Usage:**
```jsx
import SplineBackground from './components/common/SplineBackground'

// Use in your app root:
<SplineBackground />
```

### 2. **SplineBackgroundAlternative.jsx** (NEW)
Located at: `frontend/src/components/common/SplineBackgroundAlternative.jsx`

Alternative iframe-based implementation if you prefer not to use the npm package.

**To use instead of the main component:**
```jsx
// In main.jsx, change:
import SplineBackground from './components/common/SplineBackground'
// To:
import SplineBackgroundAlternative as SplineBackground from './components/common/SplineBackgroundAlternative'
```

### 3. **main.jsx** (MODIFIED)
- Added: `import SplineBackground from './components/common/SplineBackground'`
- Updated React root render to include `<SplineBackground />` before `<App />`

### 4. **index.css** (MODIFIED)
Added comprehensive styling:
- Spline background container styles
- Z-index management for UI elements
- Cyan/electric blue glow effects
- Enhanced button and card styling
- Glass-morphism effects
- Loading spinner animation
- Responsive media queries

### 5. **package.json** (MODIFIED)
- Added `@spline/react-spline: ^3.5.0` to dependencies

---

## Spline Scene Setup

### Get Your Scene URL

1. **Create/Modify Scene in Spline:**
   - Go to: https://app.spline.design/
   - Open or create your scene
   - Make design modifications per the guide provided

2. **Publish Scene:**
   - Click **Share** → **Publish to Web**
   - Copy the generated URL (format: `https://prod.spline.design/xxxxx/scene`)

3. **Add Scene URL to Component:**

   **Option A: Using main SplineBackground component**
   ```jsx
   // In SplineBackground.jsx, line 29, replace:
   scene="https://prod.spline.design/YOUR_SCENE_ID/scene"
   // With your actual URL:
   scene="https://prod.spline.design/3afbbf73d552/scene"
   ```

   **Option B: Using iframe alternative**
   ```jsx
   // In SplineBackgroundAlternative.jsx, line 24, replace:
   src="https://prod.spline.design/YOUR_SCENE_ID/scene"
   // With your actual URL:
   src="https://prod.spline.design/3afbbf73d552/scene"
   ```

---

## Configuration Options

### Overlay Transparency
Adjust the semi-transparent overlay in `SplineBackground.jsx` (line 55-62):

```jsx
<div
  style={{
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(10, 14, 39, 0.2)', // Change 0.2 to 0.3 for darker overlay
    pointerEvents: 'none',
    zIndex: 1,
  }}
/>
```

### Background Gradient
Modify the background in `index.css` (search for `.spline-background-container`):

```css
.spline-background-container {
  background: linear-gradient(135deg, #0a0e27 0%, #1a1a3e 100%);
  /* Adjust colors as needed */
}
```

### Disable for Mobile
The CSS includes a media query that hides the Spline background on mobile (< 768px) to improve performance.

---

## Color Theme Reference

The Spline scene should use this color palette for consistency:

```
Primary Background:  #0a0e27 (Dark Navy/Black)
Secondary BG:        #1a1a3e (Deep Purple-Blue)
Primary Accent:      #00d9ff (Cyan/Electric Blue)
Secondary Accent:    #0099ff (Bright Blue)
Accent Highlight:    #7c3aed (Violet)
Text Primary:        #f8fafc (Off-White)
Text Muted:          #94a3b8 (Gray-Blue)
```

---

## Testing Checklist

- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Verify Spline scene loads without errors in browser console
- [ ] Check that login form is readable over background
- [ ] Test mouse interactions (parallax/hover effects)
- [ ] Verify animations play smoothly (no stuttering)
- [ ] Check dashboard/sidebar appear above background (z-index)
- [ ] Test on mobile device (should fall back to solid gradient)
- [ ] Test on different screen sizes (1080p, 1440p, 4K)
- [ ] Monitor performance: Open DevTools → Performance tab

---

## Performance Optimization

### Browser DevTools Analysis

1. Open: **DevTools → Performance tab**
2. Click **Record**
3. Interact with the scene for 10 seconds
4. Click **Stop**
5. Look for:
   - FPS consistency (aim for 50-60 FPS)
   - GPU memory usage
   - CPU usage

### Optimization Tips

If performance is poor:

1. **In Spline Editor:**
   - Simplify mesh geometry
   - Reduce number of active animations
   - Limit particle emitter count
   - Disable physics simulation

2. **In React:**
   - Use `React.memo()` on heavy components
   - Enable code splitting
   - Lazy load non-critical components

3. **Browser:**
   - Try different browser (Chrome vs Firefox)
   - Clear browser cache
   - Test in incognito/private mode

---

## Troubleshooting

### Issue: Spline scene not loading
**Solution:**
- Check browser console for errors (DevTools → Console)
- Verify scene URL is correct
- Ensure scene is published to web in Spline
- Try refreshing the page

### Issue: UI text is hard to read
**Solution:**
- Increase overlay opacity in `SplineBackground.jsx`
- Change background colors in Spline to darker
- Add text-shadow to text elements

### Issue: Low performance/FPS
**Solution:**
- Check Spline scene performance in editor
- Reduce animations complexity
- Disable on mobile (already done in CSS)
- Use iframe version instead (simpler rendering)

### Issue: Mouse parallax not working
**Solution:**
- Ensure parallax is enabled in Spline editor
- Check that objects have proper interaction settings
- Verify scene is fully loaded before expecting interactions

### Issue: Background doesn't show
**Solution:**
- Check z-index: `.spline-background-container` should be `-1`
- Verify `#root` has `position: relative; z-index: 0;`
- Ensure app container isn't blocking the background
- Check if scene URL is loading in DevTools Network tab

---

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✓ Full  | Best performance |
| Firefox | ✓ Full  | Good performance |
| Safari  | ✓ Full  | May need WebGL check |
| Edge    | ✓ Full  | Chromium-based |
| Mobile  | ⚠ Limited | Disabled by default (CSS media query) |

---

## Advanced: Custom Spline Scene URL Management

For production, store the Spline URL in an environment variable:

1. **Create `.env` file in frontend root:**
```
VITE_SPLINE_SCENE_URL=https://prod.spline.design/xxxxx/scene
```

2. **Update `SplineBackground.jsx`:**
```jsx
const sceneUrl = import.meta.env.VITE_SPLINE_SCENE_URL || 'https://prod.spline.design/xxxxx/scene';

<Spline
  scene={sceneUrl}
  // ...
/>
```

3. **In `.env.local` for local testing (not committed):**
```
VITE_SPLINE_SCENE_URL=https://prod.spline.design/your-test-scene/scene
```

---

## Next Steps

1. **Design your Spline scene** using the modification guide provided
2. **Publish to web** and get the scene URL
3. **Update component** with your scene URL
4. **Test thoroughly** using the checklist above
5. **Deploy** with confidence!

---

## Support & Resources

- **Spline Documentation:** https://docs.spline.design/
- **React Spline Package:** https://www.npmjs.com/package/@spline/react-spline
- **Spline Community:** https://community.spline.design/
- **Your CSS Variables:** See `:root` in `index.css` for all theme colors

---

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── SplineBackground.jsx          (NEW - Main component)
│   │       ├── SplineBackgroundAlternative.jsx (NEW - Iframe version)
│   │       ├── Navbar.jsx
│   │       ├── Sidebar.jsx
│   │       ├── AudioVisualizer.jsx
│   │       ├── Loader.jsx
│   │       └── Toast.jsx
│   ├── index.css                              (MODIFIED - Added Spline styles)
│   ├── main.jsx                               (MODIFIED - Added SplineBackground import)
│   └── App.jsx
├── package.json                               (MODIFIED - Added @spline/react-spline)
├── vite.config.js
└── index.html
```

---

**Last Updated:** 2026-08-18
**Version:** 1.0.0
