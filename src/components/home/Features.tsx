'use client';

import { Star, Droplets, Palette } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';

export function Features() {
    const { t } = useTranslation();

    const features = [
        {
            icon: <Star className="w-6 h-6 text-lion-amber-start" />,
            title: t('home.features.quality.title'),
            description: t('home.features.quality.description'),
        },
        {
            icon: <Droplets className="w-6 h-6 text-lion-amber-start" />,
            title: t('home.features.waterproof.title'),
            description: t('home.features.waterproof.description'),
        },
        {
            icon: <Palette className="w-6 h-6 text-lion-amber-start" />,
            title: t('home.features.art.title'),
            description: t('home.features.art.description'),
        },
    ];

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-col items-center group cursor-default">
                            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-graphite mb-3 font-heading">
                                {feature.title}
                            </h3>
                            <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
