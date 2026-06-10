'use client';

import { useEffect, useState } from 'react';
import { CiDark } from "react-icons/ci";
import { CiLight } from "react-icons/ci";


export function DarkModeToggle() {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    // On mount: read saved preference or OS preference
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = saved === 'dark' || (!saved && prefersDark);

        setIsDark(shouldBeDark);
        if (shouldBeDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    // Avoid hydration mismatch by not rendering the icon until mounted
    if (!mounted) {
        return (
            <button
                aria-label="Toggle dark mode"
                className="
          fixed top-4 right-4 z-[9999]
          w-10 h-10 rounded-full
          flex items-center justify-center
          bg-gray-200 dark:bg-gray-700
          border border-gray-300 dark:border-gray-600
          shadow-lg
          transition-all duration-200
        "
            />
        );
    }

    return (
        <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="
    
        w-8 h-8 rounded-full
        flex items-center justify-center
        bg-gray-200 dark:bg-gray-700
        text-gray-800 dark:text-yellow-300
        border border-gray-300 dark:border-gray-600
        shadow-lg hover:shadow-xl
       active:scale-95
        transition-all duration-200
      "
        >
            <span
                className="text-lg transition-transform duration-300"
                style={{ transform: isDark ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block' }}
            >
                {isDark ? <CiLight /> : <CiDark />}
            </span>
        </button>
    );
}
