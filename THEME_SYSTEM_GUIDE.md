# Dark/Light/System Theme System Guide

## Overview

The Mini AI Tutor now features a comprehensive, premium dark/light/system theme system with modern UI/UX best practices. This guide explains the implementation, usage, and design principles.

## Features

### Core Features
- **Three Theme Modes**: Light, Dark, and System (follows OS preference)
- **Persistent Storage**: Theme preference saved to localStorage
- **Automatic Detection**: System mode automatically detects OS preference changes
- **Smooth Transitions**: 300ms transition animations for color changes
- **Premium UI**: Beautiful, polished theme toggle component
- **Full Coverage**: All components support both light and dark modes
- **Accessibility**: WCAG compliant with proper focus states and keyboard navigation

### Design Principles
- **Clean Visual Hierarchy**: Clear separation of UI elements
- **Ample Whitespace**: Comfortable spacing that scales beautifully
- **Consistent Padding**: Uniform spacing system throughout
- **Intuitive Grouping**: Logically organized components
- **Strong Alignment**: Precise alignment for professional appearance
- **Easy Discoverability**: Theme toggle is prominent and accessible
- **Minimal Cognitive Load**: Simple, clear interface

## Architecture

### File Structure

```
frontend/src/
├── context/
│   └── ThemeContext.jsx          # Theme provider and hook
├── components/
│   ├── ThemeToggle.jsx            # Premium theme toggle UI
│   ├── Navbar.jsx                 # Updated with dark mode
│   └── Sidebar.jsx                # Updated with dark mode
├── App.jsx                        # Integrated theme system
├── main.jsx                       # ThemeProvider wrapper
└── index.css                      # Dark mode CSS utilities
```

### Configuration Files

- `tailwind.config.js` - Dark mode enabled with class strategy
- `frontend/index.html` - Meta theme-color for mobile browsers

## Implementation Details

### 1. Theme Context (`ThemeContext.jsx`)

The theme context manages:
- Theme state (light/dark/system)
- Resolved theme (actual applied theme: light/dark)
- LocalStorage persistence
- System preference detection
- Automatic updates when OS preference changes

**Available Values:**
- `theme` - User's preference ('light', 'dark', or 'system')
- `resolvedTheme` - Actual applied theme ('light' or 'dark')
- `setTheme` - Function to change theme
- `isDark` - Boolean for dark mode
- `isLight` - Boolean for light mode
- `isSystem` - Boolean for system mode

**Example Usage:**
```jsx
import { useTheme } from './context/ThemeContext';

function MyComponent() {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <div className={isDark ? 'dark-styles' : 'light-styles'}>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  );
}
```

### 2. Theme Toggle Component (`ThemeToggle.jsx`)

Premium dropdown component featuring:

**UI/UX Features:**
- Animated icon rotation on hover
- Dropdown with smooth scale-in animation
- Three theme options with icons and descriptions
- Visual feedback for selected theme
- Keyboard navigation (Escape to close)
- Click-outside-to-close behavior
- Accessible ARIA labels
- Premium tooltips and visual hierarchy

**Design Elements:**
- Header with title and description
- Icon-based theme options (Sun, Moon, Monitor)
- Visual selected indicator
- Footer tip about system mode
- Smooth transitions and hover states

### 3. Color System

The theme uses Tailwind's dark mode class strategy:

**Light Mode Colors:**
- Background: `bg-gray-50`
- Surface: `bg-white`
- Text: `text-gray-900`
- Borders: `border-gray-200`

**Dark Mode Colors:**
- Background: `bg-gray-900`
- Surface: `bg-gray-800`
- Text: `text-gray-100`
- Borders: `border-gray-700`

**CSS Classes:**
```css
/* Automatic dark mode variants */
.card {
  @apply bg-white rounded-lg shadow-md p-6;
}

.dark .card {
  @apply bg-gray-800 shadow-xl shadow-black/20;
}
```

### 4. Component Updates

All major components updated for dark mode:

**App.jsx:**
- Background colors transition
- Loading state supports both themes

**Navbar.jsx:**
- Dark background and borders
- Updated link colors
- Theme toggle integrated
- Proper contrast ratios

**Sidebar.jsx:**
- Full dark mode support
- Theme toggle in header
- Search bar dark styling
- Navigation links with proper states
- Bottom section elements
- Premium CTA card styling
- Mobile hamburger button
- Tooltips and overlays

## Usage Guide

### For Developers

**1. Adding Dark Mode to New Components:**

Use the `useTheme` hook and Tailwind conditional classes:

```jsx
import { useTheme } from '../context/ThemeContext';

function NewComponent() {
  const { isDark } = useTheme();

  return (
    <div className={`p-4 rounded-lg ${
      isDark
        ? 'bg-gray-800 text-gray-100'
        : 'bg-white text-gray-900'
    }`}>
      Content here
    </div>
  );
}
```

**2. Using Tailwind Dark Mode Utilities:**

Tailwind provides `dark:` prefix for dark mode styles:

```jsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  This automatically changes with theme
</div>
```

**3. Adding Custom CSS for Dark Mode:**

In `index.css`:

```css
.my-component {
  @apply bg-white text-gray-900;
}

.dark .my-component {
  @apply bg-gray-800 text-gray-100;
}
```

### For Users

**Accessing Theme Toggle:**

The theme toggle is available in two locations:
1. **Navbar** (top right, next to logout button)
2. **Sidebar** (below the logo when not collapsed)

**Changing Theme:**

1. Click the theme toggle button (Sun/Moon icon)
2. Select from dropdown:
   - **Light** - Always use light theme
   - **Dark** - Always use dark theme
   - **System** - Follow OS preference (default)
3. Theme changes instantly
4. Preference is saved automatically

**Keyboard Navigation:**

- Click toggle or press Enter/Space to open
- Arrow keys to navigate options
- Enter/Space to select
- Escape to close dropdown

## Accessibility Features

### WCAG Compliance
- ✅ Proper color contrast ratios (AA standard)
- ✅ Focus visible states on all interactive elements
- ✅ Keyboard navigation support
- ✅ ARIA labels for screen readers
- ✅ Semantic HTML structure
- ✅ Touch targets meet 44px minimum (mobile)

### Focus Management
- Focus ring with offset for visibility
- Dark mode has appropriate ring-offset color
- Smooth transitions don't interfere with focus

### Screen Reader Support
- ARIA labels on all buttons
- Proper role attributes (dialog, menu, menuitem)
- Expanded/collapsed states announced
- Selected theme announced

## Mobile Support

### Responsive Design
- Theme toggle works on all screen sizes
- Mobile hamburger button supports dark mode
- Dropdown positioned correctly on mobile
- Touch-friendly 44px minimum target sizes

### Mobile Browser Features
- Meta theme-color updates dynamically
- Smooth color transitions on theme change
- Proper viewport scaling

## Performance Optimizations

### Efficient Updates
- Theme context uses React Context API
- LocalStorage for persistence (no API calls)
- CSS transitions handled by browser
- Minimal re-renders on theme change

### Load Time
- Theme loaded before first paint
- No flash of unstyled content (FOUC)
- System preference detected instantly

## Browser Support

### Tested Browsers
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android)

### Features
- `prefers-color-scheme` media query (System mode)
- LocalStorage API
- CSS transitions and animations
- CSS custom properties (for future enhancements)

## Customization

### Changing Colors

Edit `tailwind.config.js` for global color changes:

```js
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom primary colors
        500: '#your-color',
        600: '#your-darker-color',
      },
    },
  },
}
```

### Changing Transition Duration

Edit `frontend/src/index.css`:

```css
body {
  @apply transition-colors duration-300; /* Change 300 to your value */
}
```

### Adding New Theme Modes

You can extend the theme system to include custom modes:

1. Update `ThemeContext.jsx` to handle new mode
2. Add new option to `ThemeToggle.jsx`
3. Create corresponding CSS classes

## Troubleshooting

### Theme Not Persisting
- Check browser's localStorage is enabled
- Clear localStorage and try again: `localStorage.clear()`

### System Mode Not Working
- Verify browser supports `prefers-color-scheme`
- Check OS has dark mode enabled
- Try toggling OS dark mode on/off

### Styles Not Updating
- Check Tailwind's `darkMode: 'class'` is set
- Verify `dark` class is on `<html>` element
- Clear browser cache and rebuild

### Flash of Wrong Theme
- Ensure ThemeProvider wraps entire app
- Theme should load before first render
- Check meta theme-color is set

## Future Enhancements

Potential improvements for future versions:

1. **Custom Theme Colors**: Allow users to pick accent colors
2. **High Contrast Mode**: For accessibility
3. **Theme Scheduling**: Auto-switch at specific times
4. **Per-Page Themes**: Different themes for different sections
5. **Theme Animations**: More elaborate transition effects
6. **Theme Preview**: Live preview before applying
7. **Theme Sharing**: Export/import theme preferences

## Best Practices

### When Building New Features

1. **Always test in both modes**: Light and dark
2. **Use semantic colors**: Don't hardcode colors
3. **Check contrast ratios**: Ensure readability
4. **Test keyboard navigation**: All features should work without mouse
5. **Verify mobile behavior**: Test on actual devices
6. **Update documentation**: Keep this guide current

### Code Style

```jsx
// ✅ Good - Using isDark boolean
const { isDark } = useTheme();
<div className={isDark ? 'bg-gray-800' : 'bg-white'}>

// ✅ Good - Using Tailwind dark: prefix
<div className="bg-white dark:bg-gray-800">

// ❌ Bad - Hardcoding colors
<div style={{ backgroundColor: '#ffffff' }}>

// ❌ Bad - Checking theme string
const { theme } = useTheme();
<div className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
```

## Support

For issues or questions about the theme system:
1. Check this documentation
2. Review the code in `ThemeContext.jsx` and `ThemeToggle.jsx`
3. Test in incognito/private browsing mode
4. Check browser console for errors

---

**Version**: 1.0.0
**Last Updated**: 2025-11-15
**Maintained By**: Mini AI Tutor Team
