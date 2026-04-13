import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧', ethiopic: false },
    { code: 'am', label: 'አማርኛ', flag: '🇪🇹', ethiopic: true },
    { code: 'ti', label: 'ትግርኛ', flag: '🇪🇹', ethiopic: true },
    { code: 'om', label: 'Afaan Oromoo', flag: '🇪🇹', ethiopic: false },
    { code: 'so', label: 'Soomaali', flag: '🇸🇴', ethiopic: false },
];

export default function LanguageSwitcher({ variant = 'light' }) {
    const { i18n } = useTranslation();
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const activeIndex = useRef(0);

    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code) => {
        i18n.changeLanguage(code);
        setOpen(false);
    };

    const handleKeyDown = (e) => {
        if (!open) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpen(true);
            }
            return;
        }
        if (e.key === 'Escape') {
            setOpen(false);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex.current = Math.min(activeIndex.current + 1, LANGUAGES.length - 1);
            document.getElementById(`lang-opt-${activeIndex.current}`)?.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex.current = Math.max(activeIndex.current - 1, 0);
            document.getElementById(`lang-opt-${activeIndex.current}`)?.focus();
        }
    };

    const isDark = variant === 'dark';

    return (
        <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(!open)}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isDark
                        ? 'text-white/70 hover:bg-white/10 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
                <Globe size={15} />
                <span
                    className={currentLang.ethiopic ? 'font-ethiopic' : ''}
                    style={currentLang.ethiopic ? { fontFamily: "'Noto Serif Ethiopic', serif" } : {}}
                >
                    {currentLang.label}
                </span>
                <svg
                    className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    role="listbox"
                    aria-label="Select language"
                    className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-900/10 overflow-hidden z-[100]"
                >
                    {LANGUAGES.map((lang, idx) => {
                        const isActive = lang.code === i18n.language;
                        return (
                            <button
                                key={lang.code}
                                id={`lang-opt-${idx}`}
                                role="option"
                                aria-selected={isActive}
                                onClick={() => handleSelect(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                                    isActive
                                        ? 'bg-teal-50 text-teal-700 font-bold'
                                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                                }`}
                            >
                                <span className="text-base">{lang.flag}</span>
                                <span
                                    className={lang.ethiopic ? 'font-ethiopic' : ''}
                                    style={lang.ethiopic ? { fontFamily: "'Noto Serif Ethiopic', serif" } : {}}
                                >
                                    {lang.label}
                                </span>
                                {isActive && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-teal-500" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
