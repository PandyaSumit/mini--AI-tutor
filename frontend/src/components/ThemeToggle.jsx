import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';

const ThemeToggle = () => {
  const { theme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const themes = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Light theme',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme',
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
      description: 'Follow system preference',
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const getCurrentIcon = () => {
    const currentTheme = themes.find((t) => t.value === theme);
    return currentTheme?.icon || Monitor;
  };

  const CurrentIcon = getCurrentIcon();

  const handleThemeSelect = (newTheme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group relative p-2.5 rounded-lg
          transition-all duration-300 ease-out
          ${isDark
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}
        `}
        aria-label="Toggle theme"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <CurrentIcon
          className={`
            w-5 h-5 transition-transform duration-300
            ${isOpen ? 'rotate-12 scale-110' : 'group-hover:rotate-12'}
          `}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute right-0 mt-2 w-64 rounded-xl shadow-xl
            transform transition-all duration-200 ease-out
            origin-top-right animate-scale-in z-50
            ${isDark
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-200'
            }
          `}
          role="menu"
          aria-orientation="vertical"
        >
          {/* Menu Header */}
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              Choose Theme
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Select your preferred theme mode
            </p>
          </div>

          {/* Theme Options */}
          <div className="p-2 space-y-1">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.value;

              return (
                <button
                  key={themeOption.value}
                  onClick={() => handleThemeSelect(themeOption.value)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 ease-out
                    group/item relative overflow-hidden
                    ${isSelected
                      ? isDark
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-primary-50 text-primary-900 shadow-sm'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                    ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}
                  `}
                  role="menuitem"
                >
                  {/* Icon with animation */}
                  <div
                    className={`
                      flex items-center justify-center w-9 h-9 rounded-lg
                      transition-all duration-200
                      ${isSelected
                        ? isDark
                          ? 'bg-primary-700'
                          : 'bg-primary-100'
                        : isDark
                          ? 'bg-gray-700 group-hover/item:bg-gray-600'
                          : 'bg-gray-100 group-hover/item:bg-gray-200'
                      }
                    `}
                  >
                    <Icon
                      className={`
                        w-4 h-4 transition-all duration-200
                        ${isSelected ? 'scale-110' : 'group-hover/item:scale-110'}
                      `}
                    />
                  </div>

                  {/* Label and Description */}
                  <div className="flex-1 text-left">
                    <div className={`text-sm font-medium ${isSelected ? 'font-semibold' : ''}`}>
                      {themeOption.label}
                    </div>
                    <div
                      className={`
                        text-xs mt-0.5
                        ${isSelected
                          ? isDark
                            ? 'text-primary-100'
                            : 'text-primary-700'
                          : isDark
                            ? 'text-gray-400'
                            : 'text-gray-500'
                        }
                      `}
                    >
                      {themeOption.description}
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="flex items-center">
                      <div
                        className={`
                          w-2 h-2 rounded-full
                          ${isDark ? 'bg-white' : 'bg-primary-600'}
                        `}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Tip */}
          <div
            className={`
              px-4 py-3 border-t text-xs
              ${isDark
                ? 'border-gray-700 bg-gray-750 text-gray-400'
                : 'border-gray-200 bg-gray-50 text-gray-500'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-primary-500' : 'bg-primary-600'}`} />
              <span>
                System mode syncs with your OS settings
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
