import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'mi_tutor_theme';

function getInitialTheme() {
    try {
        const persisted = localStorage.getItem(THEME_KEY);
        if (persisted === 'light' || persisted === 'dark') return persisted;
    } catch (e) {
        console.log(e)
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }

    return 'light';
}

export default function useTheme() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.log(e)
        }
    }, [theme]);

    const set = useCallback((value) => {
        if (value === 'dark' || value === 'light') {
            setTheme(value);
        } else {
            setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
        }
    }, []);

    const toggle = useCallback(() => set(), [set]);

    return { theme, setTheme: set, toggle };
}
