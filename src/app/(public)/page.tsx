'use client';

import { useEffect, useState } from 'react';
import { StaticLink } from '@/components/StaticLink';
import { ArrowRight } from 'lucide-react';
import { Features } from '@/components/home/Features';
import { PackCard } from '@/components/packs/PackCard';
import { PackCardSkeleton } from '@/components/packs/PackCardSkeleton';
import { getNewestProducts } from '@/lib/firestore-utils';
import { StickerPack } from '@/types/product';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const [featuredPacks, setFeaturedPacks] = useState<StickerPack[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, locale } = useLanguage();

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Get 4 newest products for the featured section
        const data = await getNewestProducts(4);
        setFeaturedPacks(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Premium Hero Section */}
      <section className="relative h-[70vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden md:animate-slide-in-right">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-new.png"
            alt="Cozy workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-forest-green/10 text-forest-green text-sm font-bold tracking-wider uppercase mb-6 animate-fade-in-up">
            Handmade & Exclusive
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 font-heading text-graphite drop-shadow-sm max-w-4xl mx-auto leading-tight">
            <span className="bg-gradient-to-r from-lion-amber-start to-lion-amber-end bg-clip-text text-transparent">
              {t('home.hero.title')}
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-10 font-heading max-w-2xl mx-auto">
            {t('home.hero.subtitle')}
          </p>

          <StaticLink
            href="/packs/"
            className="inline-flex items-center gap-3 bg-graphite text-white px-10 py-5 rounded-full text-lg font-bold shadow-xl hover:shadow-2xl hover:bg-black hover:scale-105 transition-all duration-300 group"
          >
            {t('home.hero.cta')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </StaticLink>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* Featured Collection Preview */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-graphite font-heading mb-2">{t('home.featured.title')}</h2>
              <p className="text-gray-500">{t('home.featured.description')}</p>
            </div>
            <StaticLink href="/packs/" className="hidden md:flex items-center text-forest-green font-bold hover:underline">
              {t('home.featured.view_all')} <ArrowRight className="w-4 h-4 ml-1" />
            </StaticLink>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {loading ? (
              <>
                <PackCardSkeleton />
                <PackCardSkeleton />
                <PackCardSkeleton />
                <PackCardSkeleton />
              </>
            ) : (
              featuredPacks.map(pack => (
                <PackCard key={pack.id} pack={pack} locale={locale} />
              ))
            )}
          </div>

          <div className="mt-12 text-center md:hidden">
            <StaticLink href="/packs/" className="inline-block border border-graphite text-graphite px-8 py-3 rounded-full font-bold hover:bg-graphite hover:text-white transition-colors">
              {t('home.featured.view_all_collections')}
            </StaticLink>
          </div>
        </div>
      </section>
    </div>
  );
}
