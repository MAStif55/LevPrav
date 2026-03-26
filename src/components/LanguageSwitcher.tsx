'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
    const { locale, setLocale, t } = useLanguage();

    const toggleLocale = () => {
        setLocale(locale === 'ru' ? 'en' : 'ru');
    };

    return (
        <button
            onClick={toggleLocale}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-lion-amber-start to-lion-amber-end px-4 py-2 text-sm font-medium text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95"
            aria-label={t('common.language')}
        >
            <Languages className="h-4 w-4" />
            <span>{t('common.switchLanguage')}</span>
        </button>
    );
}
