'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

export interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');

    const applyTheme = useCallback((newTheme: Theme) => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
        root.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        setThemeState(newTheme);
    }, []);

    const toggleTheme = useCallback(() => {
        applyTheme(theme === 'light' ? 'dark' : 'light');
    }, [theme, applyTheme]);

    const setTheme = useCallback((newTheme: Theme) => {
        applyTheme(newTheme);
    }, [applyTheme]);

    useEffect(() => {
        // Initial sync
        const stored = localStorage.getItem('theme') as Theme | null;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = stored ?? (prefersDark ? 'dark' : 'light');

        setThemeState(initialTheme);
        document.documentElement.classList.add(initialTheme);
        document.documentElement.setAttribute('data-theme', initialTheme);

        // Listen for OS changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [applyTheme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
