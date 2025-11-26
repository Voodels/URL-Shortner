# NeoBrutalism Theme System

## 🎨 Overview

Your URL Shortener now includes a **NeoBrutalism** design system alongside the original elegant design. You can switch between them easily.

## 🔧 What's Included

### 1. **Tailwind Configuration** (`tailwind.config.js`)
- Custom NeoBrutalism color palette
- Brutal typography (Space Mono, Space Grotesk)
- Thick border utilities
- Hard shadow utilities (no blur)
- Brutal animation effects

### 2. **CSS Utilities** (`src/index.css`)
- `.brutal-border` - 4px black borders
- `.brutal-shadow` - Hard 8x8px shadows
- `.brutal-btn` - Interactive button effects
- `.brutal-card` - Card with asymmetric design
- `.brutal-texture` - Industrial grid pattern
- `.brutal-offset-*` - Asymmetric positioning

### 3. **NeoBrutalism Components**
- `URLCardBrutal.tsx` - Bold URL card with hard shadows
- `URLFormBrutal.tsx` - Industrial form design
- `BrutalThemeToggle.tsx` - Theme switcher button

### 4. **DaisyUI Themes**
- `neobrutal` (light) - White bg, bold colors
- `neobrutaldark` (dark) - Black bg, bold colors

## 🚀 How to Use

### Option A: Switch Components in App.tsx

**Original Design (Current):**
```tsx
import { URLCard } from "./components/URLCard";
import { URLForm } from "./components/URLForm";
```

**NeoBrutalism Design:**
```tsx
import { URLCard } from "./components/URLCardBrutal";
import { URLForm } from "./components/URLFormBrutal";
import { BrutalThemeToggle } from "./components/BrutalThemeToggle";

// Add to your App component JSX:
<BrutalThemeToggle />
```

### Option B: Enable Theme Switcher in UI

Add this to your `App.tsx` return statement:
```tsx
<div className="relative min-h-screen">
  <BrutalThemeToggle />
  {/* rest of your app */}
</div>
```

Then set theme in browser:
```javascript
// In browser console:
document.documentElement.setAttribute("data-theme", "neobrutal");
```

## 🎯 Design Characteristics

### NeoBrutalism
- ✅ High-contrast: Black/white + electric yellow/harsh red/industrial blue
- ✅ Thick borders: 4-6px pure black strokes
- ✅ Hard shadows: 8px offset, zero blur
- ✅ Bold typography: Space Mono, Space Grotesk (700 weight)
- ✅ Asymmetric layouts: Offset elements, geometric shapes
- ✅ Raw aesthetics: Grid patterns, pixelated text rendering
- ✅ Industrial feel: Concrete textures, metal-like surfaces

### Original Design
- ✅ Glass morphism: Frosted glass effects with backdrop blur
- ✅ Soft shadows: Subtle, blurred shadows
- ✅ Gradients: Smooth color transitions
- ✅ Round corners: Smooth, friendly shapes
- ✅ Elegant typography: Dancing Script, Manrope
- ✅ Balanced layouts: Centered, symmetric designs

## 🔄 Quick Switch Commands

### Use NeoBrutalism (Light):
```bash
# Replace imports in App.tsx
sed -i 's/URLCard"/URLCardBrutal"/g' frontend/src/App.tsx
sed -i 's/URLForm"/URLFormBrutal"/g' frontend/src/App.tsx
```

### Revert to Original:
```bash
# Replace imports in App.tsx
sed -i 's/URLCardBrutal"/URLCard"/g' frontend/src/App.tsx
sed -i 's/URLFormBrutal"/URLForm"/g' frontend/src/App.tsx
```

## 🎨 Custom Colors

Edit `tailwind.config.js` to customize brutal colors:

```javascript
colors: {
  brutal: {
    black: '#000000',
    white: '#FFFFFF',
    yellow: '#FFEB3B',    // Change these!
    red: '#FF1744',
    orange: '#FF6F00',
    blue: '#00B8D4',
    green: '#00E676',
    purple: '#D500F9',
  },
},
```

## 📦 Using Brutal Utilities

```tsx
// Brutal button
<button className="brutal-btn bg-brutal-yellow text-black font-brutal font-bold uppercase">
  CLICK ME
</button>

// Brutal card
<div className="brutal-card">
  <h3>Title</h3>
  <p>Content</p>
</div>

// Brutal shadow variations
<div className="brutal-shadow">Default shadow</div>
<div className="brutal-shadow-yellow">Yellow shadow</div>
<div className="brutal-shadow-red">Red shadow</div>

// Asymmetric offset
<div className="brutal-offset-1">Shifted element</div>
```

## 🎯 When to Use Each Design

### Use NeoBrutalism For:
- 🎨 Creative portfolios
- 🚀 Tech startups wanting bold branding
- 🎓 Educational platforms
- 🎵 Music/entertainment sites
- 💪 Standing out from competitors
- 🔥 Young, rebellious audience

### Use Original Design For:
- 💼 Corporate/professional environments
- 💎 Luxury/elegant products
- 👔 Conservative brands
- 🌟 Broad mainstream appeal
- 📱 Mobile-first experiences
- ♿ Maximum accessibility

## 🔧 Build for Production

Both themes are production-ready:

```bash
cd frontend
npm run build
```

Tailwind will tree-shake unused styles automatically.

## 📝 Notes

- **Accessibility**: Both themes maintain WCAG AA contrast ratios
- **Performance**: No impact - same bundle size (tree-shaking)
- **Mobile**: Both themes are fully responsive
- **Browser**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🎨 Live Examples

### NeoBrutalism
- **Colors**: Yellow (#FFEB3B), Red (#FF1744), Blue (#00B8D4)
- **Borders**: 4-6px solid black
- **Shadows**: 8px hard shadows (no blur)
- **Fonts**: Space Mono, Space Grotesk
- **Feel**: Bold, raw, industrial, rebellious

### Original
- **Colors**: Gradients, pastels, soft hues
- **Borders**: 1-2px, rounded corners
- **Shadows**: Soft, blurred, layered
- **Fonts**: Dancing Script, Manrope
- **Feel**: Elegant, modern, friendly, polished

---

**Made with ⚡ NeoBrutalism energy**
