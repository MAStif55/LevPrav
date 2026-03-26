import Head from 'next/head';
import { useTranslation } from '@/contexts/LanguageContext';
import { Leaf, Heart, PenTool } from 'lucide-react';
import { PublicLayout } from '@/components/layouts/PublicLayout';

export default function AboutPage() {
    const { t } = useTranslation();

    return (
        <PublicLayout>
            <Head>
                <title>{t('nav.about')} | ЛевПрав</title>
            </Head>

            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading text-graphite mb-6">
                        {t('about.title')}
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        {t('about.subtitle')}
                    </p>
                </div>

                {/* Story Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
                    <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden shadow-lg md:order-2">
                        {/* Placeholder for About Us Image */}
                        <div className="w-full h-full bg-lion-amber-start/10 flex items-center justify-center text-lion-amber-start">
                            <span className="text-6xl font-heading font-bold opacity-20">L/P</span>
                        </div>
                    </div>
                    <div className="space-y-6 md:order-1">
                        <h2 className="text-3xl font-bold font-heading text-graphite">
                            {t('about.story_title')}
                        </h2>
                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p>{t('about.story_p1')}</p>
                            <p>{t('about.story_p2')}</p>
                        </div>
                    </div>
                </div>

                {/* Values Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-forest-green/10 rounded-full flex items-center justify-center text-forest-green mb-6">
                            <Leaf className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold font-heading text-graphite mb-3">{t('about.values.eco_title')}</h3>
                        <p className="text-gray-500">{t('about.values.eco_desc')}</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-lion-amber-start/10 rounded-full flex items-center justify-center text-lion-amber-start mb-6">
                            <PenTool className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold font-heading text-graphite mb-3">{t('about.values.art_title')}</h3>
                        <p className="text-gray-500">{t('about.values.art_desc')}</p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
                            <Heart className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold font-heading text-graphite mb-3">{t('about.values.love_title')}</h3>
                        <p className="text-gray-500">{t('about.values.love_desc')}</p>
                    </div>
                </div>

                {/* Mission Statement */}
                <div className="bg-gray-50 rounded-3xl p-12 text-center">
                    <h2 className="text-3xl font-bold font-heading text-graphite mb-6">{t('about.mission_title')}</h2>
                    <p className="text-xl text-gray-600 font-medium italic max-w-3xl mx-auto">
                        &quot;{t('about.mission_text')}&quot;
                    </p>
                </div>
            </div>
        </PublicLayout>
    );
}
