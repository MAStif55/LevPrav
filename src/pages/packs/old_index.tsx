import { useEffect, useState } from "react";
import Head from 'next/head';
import { PackCard } from "@/components/packs/PackCard";
import { PackGridSkeleton } from "@/components/packs/PackCardSkeleton";
import { useTranslation } from "@/contexts/LanguageContext";
import { useProductCache } from "@/store/product-cache";
import { PublicLayout } from "@/components/layouts/PublicLayout";

export default function PacksGalleryPage() {
    const { t, locale } = useTranslation();
    const { products, loading, fetchProducts } = useProductCache();
    const [initialLoad, setInitialLoad] = useState(true);

    useEffect(() => {
        fetchProducts().finally(() => setInitialLoad(false));
    }, [fetchProducts]);

    // Show skeleton only on initial load when we have no cached data
    const showSkeleton = initialLoad && products.length === 0;

    return (
        <PublicLayout>
            <Head>
                <title>{t('nav.catalog')} | ЛевПрав</title>
            </Head>

            <div className="container mx-auto px-4 py-12">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 font-heading text-4xl font-bold text-graphite">
                        {t('nav.catalog')}
                    </h1>
                    <p className="mx-auto max-w-2xl text-gray-600">
                        {t('home.hero.description')}
                    </p>
                </div>

                {showSkeleton ? (
                    <PackGridSkeleton count={8} />
                ) : (
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.map((pack) => (
                            <PackCard key={pack.id} pack={pack} locale={locale} />
                        ))}
                    </div>
                )}

                {/* Show subtle loading indicator when refreshing cached data */}
                {loading && products.length > 0 && (
                    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-lion-amber-start"></div>
                        {t('common.loading')}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
