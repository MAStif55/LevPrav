'use client';

import { StaticLink } from '@/components/StaticLink';
import { useTranslation } from '@/contexts/LanguageContext';

export function Footer() {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-4">
                        <StaticLink href="/" className="inline-block">
                            <span className="text-2xl font-bold bg-gradient-to-r from-lion-amber-start to-lion-amber-end bg-clip-text text-transparent font-heading">
                                LevPrav
                            </span>
                        </StaticLink>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t('common.tagline')}
                        </p>
                    </div>

                    {/* Links 1 */}
                    <div>
                        <h4 className="font-bold text-graphite mb-4">{t('footer.shop')}</h4>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><StaticLink href="/packs/" className="hover:text-lion-amber-start transition-colors">{t('footer.catalog')}</StaticLink></li>
                        </ul>
                    </div>

                    {/* Links 2 */}
                    <div>
                        <h4 className="font-bold text-graphite mb-4">{t('footer.info')}</h4>
                        <ul className="space-y-3 text-sm text-gray-600">
                            <li><StaticLink href="/about/" className="hover:text-lion-amber-start transition-colors">{t('footer.about')}</StaticLink></li>
                            <li><StaticLink href="#" className="hover:text-lion-amber-start transition-colors">{t('footer.shipping')}</StaticLink></li>
                            <li><StaticLink href="#" className="hover:text-lion-amber-start transition-colors">{t('footer.contacts')}</StaticLink></li>
                        </ul>
                    </div>

                    {/* Newsletter (Stub) */}
                    <div>
                        <h4 className="font-bold text-graphite mb-4">{t('footer.subscribe')}</h4>
                        <p className="text-sm text-gray-500 mb-4">
                            {t('footer.news_text')}
                        </p>
                        <div className="flex">
                            <input
                                type="email"
                                placeholder={t('footer.email_placeholder')}
                                className="w-full px-4 py-2 rounded-l-full bg-gray-50 border border-gray-200 focus:outline-none focus:border-lion-amber-start text-sm"
                            />
                            <button className="bg-graphite text-white px-4 py-2 rounded-r-full hover:bg-black transition-colors">
                                {t('footer.subscribe_button')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                    <p>© {currentYear} LevPrav Art Studio. {t('footer.rights')}.</p>
                    <div className="flex gap-6">
                        <StaticLink href="#" className="hover:text-lion-amber-start transition-colors">{t('footer.privacy')}</StaticLink>
                        <StaticLink href="#" className="hover:text-lion-amber-start transition-colors">{t('footer.terms')}</StaticLink>
                    </div>
                </div>
            </div>
        </footer>
    );
}
