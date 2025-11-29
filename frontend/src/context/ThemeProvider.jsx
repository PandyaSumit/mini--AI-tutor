import React, { createContext, useContext } from 'react';
import useTheme from '../hooks/useTheme';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const themeState = useTheme();

    return (
        <ThemeContext.Provider value={themeState}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useThemeContext = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useThemeContext must be used within ThemeProvider');
    return ctx;
};

export default ThemeProvider;
