'use client';

import { useEffect, useState } from 'react';
import { StaticLink } from '@/components/StaticLink';
import { useTranslation } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/cart-store';
import { getCalculatorOptions } from '@/lib/firestore-utils';
import { formatCurrency } from '@/utils/currency';
import { Trash2 } from 'lucide-react';
import { MaterialOption, CoatingOption, FormatOption } from '@/types/product';
import Link from 'next/link';

export default function CartPage() {
    const { t, locale } = useTranslation();
    const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();

    // Config Options
    const [materials, setMaterials] = useState<MaterialOption[]>([]);
    const [coatings, setCoatings] = useState<CoatingOption[]>([]);
    const [formats, setFormats] = useState<FormatOption[]>([]);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const data = await getCalculatorOptions();
                setMaterials(data.materials);
                setCoatings(data.coatings);
                setFormats(data.formats);
            } catch (err) {
                console.error(err);
            }
        };
        loadOptions();
    }, []);

    const getMaterialLabel = (id: string) => materials.find(m => m.id === id)?.label[locale] || id;
    const getCoatingLabel = (id: string) => coatings.find(c => c.id === id)?.label[locale] || id;
    const getFormatLabel = (id: string) => formats.find(f => f.id === id)?.label || id;

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
                <h1 className="text-3xl font-heading font-bold mb-4 text-graphite">{t('cart.empty_title')}</h1>
                <p className="text-gray-500 mb-8">{t('cart.empty_text')}</p>
                <StaticLink
                    href="/packs/"
                    className="bg-forest-green text-white px-8 py-3 rounded-full hover:bg-forest-green/90 transition-colors"
                >
                    {t('cart.go_to_catalog')}
                </StaticLink>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 relative">
            <h1 className="text-3xl font-heading font-bold mb-8 text-graphite">{t('cart.title')}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Cart Items List */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                            {/* Thumbnail */}
                            <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.packImage && (
                                    <img
                                        src={item.packImage}
                                        alt={item.packTitle[locale]}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-graphite text-lg">{item.packTitle[locale]}</h3>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="mt-1 text-sm text-gray-500 space-y-1">
                                    <p>{t('cart.material')}: {getMaterialLabel(item.configuration.materialId)}</p>
                                    <p>{t('cart.coating')}: {getCoatingLabel(item.configuration.coatingId)}</p>
                                    <p>{t('cart.format')}: {getFormatLabel(item.configuration.formatId)}</p>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-graphite disabled:opacity-50"
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-bold text-graphite">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-graphite"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="font-bold text-forest-green text-lg">
                                        {formatCurrency(item.price * item.quantity)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary & Checkout */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-6 rounded-2xl sticky top-24">
                        <h3 className="text-xl font-bold mb-4">{t('cart.summary_title')}</h3>
                        <div className="flex justify-between items-center mb-6 text-lg font-bold">
                            <span>{t('cart.summary_total')}:</span>
                            <span>{formatCurrency(getTotalPrice())}</span>
                        </div>
                        <Link
                            href="/checkout"
                            className="block w-full bg-lion-amber-start text-white py-4 rounded-xl font-bold hover:brightness-95 transition-all shadow-md active:scale-[0.98] text-center"
                        >
                            {t('cart.checkout')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
