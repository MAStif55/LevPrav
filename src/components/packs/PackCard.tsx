'use client';

import { useRef, useState, useEffect } from 'react';
import { StaticLink } from '@/components/StaticLink';
import { StickerPack, getCardUrl } from '@/types/product';
import { formatCurrency } from '@/utils/currency';
import { useLiveVideoContext } from '@/contexts/LiveVideoContext';

interface PackCardProps {
    pack: StickerPack;
    locale?: 'ru' | 'en';
}

export const PackCard = ({ pack, locale = 'ru' }: PackCardProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const { activeHeroId, registerCard, unregisterCard } = useLiveVideoContext();

    useEffect(() => {
        if (pack.videoPreviewUrl && containerRef.current) {
            registerCard(pack.id, containerRef.current);
            return () => unregisterCard(pack.id);
        }
    }, [pack.id, pack.videoPreviewUrl, registerCard, unregisterCard]);

    useEffect(() => {
        if (!videoRef.current) return;

        const isHero = activeHeroId === pack.id;
        const shouldPlay = isHero || isHovered;

        if (shouldPlay) {
            videoRef.current.play().catch(() => { });
        } else {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [activeHeroId, isHovered, pack.id]);

    return (
        <StaticLink href={`/pack/?id=${pack.id}`} className="group block">
            <div
                ref={containerRef}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="relative aspect-square overflow-hidden rounded-xl bg-gray-100"
            >
                {/* Placeholder for actual Next.js Image */}
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400 group-hover:bg-gray-300 transition-colors">
                    {/* simple image placeholder if no image */}
                    {pack.images[0] ? (
                        <img src={getCardUrl(pack.images[0])} alt={pack.title[locale]} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                        <span>No Image</span>
                    )}
                    {pack.videoPreviewUrl && (
                        <video
                            ref={videoRef}
                            src={pack.videoPreviewUrl}
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            muted
                            playsInline
                            loop
                        />
                    )}
                </div>
            </div>
            <div className="mt-4 space-y-1">
                <h3 className="font-heading text-lg font-bold text-graphite group-hover:text-lion-amber-start transition-colors">
                    {pack.title[locale]}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                    {pack.description[locale]}
                </p>
                <div className="font-bold text-forest-green">
                    {locale === 'ru' ? 'от ' : 'from '}
                    {formatCurrency(pack.basePrice)}
                </div>
            </div>
        </StaticLink>
    );
};
