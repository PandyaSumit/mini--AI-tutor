import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Theme can be: 'light', 'dark', or 'system'
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'system';
  });

  // Resolved theme is the actual theme applied: 'light' or 'dark'
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Get system preference
  const getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Update the resolved theme based on current theme setting
  useEffect(() => {
    const updateResolvedTheme = () => {
      const newResolvedTheme = theme === 'system' ? getSystemTheme() : theme;
      setResolvedTheme(newResolvedTheme);

      // Apply theme to document
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(newResolvedTheme);

      // Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          newResolvedTheme === 'dark' ? '#1f2937' : '#ffffff'
        );
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes when in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateResolvedTheme();

      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, [theme]);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const value = {
    theme, // The user's preference: 'light', 'dark', or 'system'
    resolvedTheme, // The actual applied theme: 'light' or 'dark'
    setTheme, // Function to change theme
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
