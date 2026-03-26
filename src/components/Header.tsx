'use client';

import { StaticLink } from '@/components/StaticLink';
import { useTranslation } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export function Header() {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-sm shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <StaticLink href="/" className="flex items-center gap-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-lion-amber-start to-lion-amber-end bg-clip-text text-transparent font-[family-name:var(--font-heading)]">
                                {t('common.siteName')}
                            </span>
                            <span className="hidden sm:inline text-sm text-graphite/60 font-medium">
                                {t('common.tagline')}
                            </span>
                        </StaticLink>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <StaticLink href="/" className="text-graphite hover:text-lion-amber-start transition-colors font-medium">
                                {t('nav.home')}
                            </StaticLink>
                            <StaticLink href="/packs/" className="text-graphite hover:text-lion-amber-start transition-colors font-medium">
                                {t('nav.catalog')}
                            </StaticLink>
                            <StaticLink href="/about/" className="text-graphite hover:text-lion-amber-start transition-colors font-medium">
                                {t('nav.about')}
                            </StaticLink>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {/* Language Switcher */}
                            <LanguageSwitcher />



                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2 rounded-full hover:bg-graphite/5 transition-colors"
                                aria-label="Menu"
                            >
                                <Menu className="h-5 w-5 text-graphite" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                        <nav className="md:hidden py-4 border-t border-graphite/10">
                            <div className="flex flex-col gap-2">
                                <StaticLink
                                    href="/"
                                    className="px-4 py-2 text-graphite hover:text-lion-amber-start hover:bg-graphite/5 rounded-lg transition-colors font-medium"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {t('nav.home')}
                                </StaticLink>
                                <StaticLink
                                    href="/packs/"
                                    className="px-4 py-2 text-graphite hover:text-lion-amber-start hover:bg-graphite/5 rounded-lg transition-colors font-medium"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {t('nav.catalog')}
                                </StaticLink>
                                <StaticLink
                                    href="/about/"
                                    className="px-4 py-2 text-graphite hover:text-lion-amber-start hover:bg-graphite/5 rounded-lg transition-colors font-medium"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {t('nav.about')}
                                </StaticLink>
                            </div>
                        </nav>
                    )}
                </div>
            </header>

        </>
    );
}
