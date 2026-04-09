'use client';

import { useEffect, useState } from 'react';
import { PackCard } from "@/components/packs/PackCard";
import { PackGridSkeleton } from "@/components/packs/PackCardSkeleton";
import { ProductRepository } from "@/lib/data";
import { StickerPack } from "@/types/product";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PacksGalleryPage() {
    const [products, setProducts] = useState<StickerPack[]>([]);
    const [loading, setLoading] = useState(true);
    const { t, locale } = useLanguage();

    useEffect(() => {
        async function fetchProducts() {
            try {
                const data = await ProductRepository.getAll();
                setProducts(data);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-12 text-center">
                <h1 className="mb-4 font-heading text-4xl font-bold text-graphite">
                    {t('nav.catalog')}
                </h1>
                <p className="mx-auto max-w-2xl text-gray-600">
                    {t('home.hero.description')}
                </p>
            </div>

            {loading ? (
                <PackGridSkeleton />
            ) : (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.length > 0 ? (
                        products.map((pack) => (
                            <PackCard key={pack.id} pack={pack} locale={locale} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 text-gray-400">
                            {t('admin.no_products') || 'No products found'}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
