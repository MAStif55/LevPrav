'use client';

import { useCartStore } from '@/store/cart-store';
import { useTranslation } from '@/contexts/LanguageContext';
import { X, Trash2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { STICKER_PACKS, MATERIALS, COATINGS, FORMATS } from '@/data/mock-products';
import { getThumbUrl } from '@/types/product';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartDrawer = ({ isOpen, onClose }: CartDrawerProps) => {
    const { t, locale } = useTranslation();
    const { items, removeItem, updateQuantity, getTotalPrice } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent scrolling when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted) return null;

    const getPackDetails = (id: string) => STICKER_PACKS.find(p => p.id === id);
    const getMaterialLabel = (id: string) =>
        MATERIALS.find(m => m.id === id)?.label[locale as keyof typeof MATERIALS[0]['label']] || id;
    const getCoatingLabel = (id: string) =>
        COATINGS.find(c => c.id === id)?.label[locale as keyof typeof COATINGS[0]['label']] || id;
    const getFormatLabel = (id: string) => FORMATS.find(f => f.id === id)?.label || id;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full md:w-[50%] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold font-heading text-graphite flex items-center gap-3">
                        <ShoppingCart className="w-6 h-6" />
                        {t('cart.title')}
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {items.length}
                        </span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <ShoppingCart className="w-16 h-16 text-gray-200 mb-4" />
                            <h3 className="text-xl font-bold text-gray-400 mb-2">{t('cart.empty_title')}</h3>
                            <button
                                onClick={onClose}
                                className="text-lion-amber-start font-bold hover:underline"
                            >
                                {t('cart.go_to_catalog')}
                            </button>
                        </div>
                    ) : (
                        items.map((item) => {
                            const pack = getPackDetails(item.packId);
                            if (!pack) return null;

                            return (
                                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    {/* Image */}
                                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                        {pack.images[0] && (
                                            <img
                                                src={getThumbUrl(pack.images[0])}
                                                alt={pack.title[locale]}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-graphite truncate pr-2">{pack.title[locale]}</h4>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="text-xs text-gray-500 space-y-0.5 mb-3">
                                            <p>{getMaterialLabel(item.configuration.materialId)} • {getCoatingLabel(item.configuration.coatingId)}</p>
                                            <p>{getFormatLabel(item.configuration.formatId)}</p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 bg-white rounded-lg p-0.5 border border-gray-200">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-600 rounded-md disabled:opacity-50"
                                                    disabled={item.quantity <= 1}
                                                >
                                                    -
                                                </button>
                                                <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-600 rounded-md"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="font-bold text-forest-green">
                                                {formatCurrency(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-gray-500">{t('cart.summary_total')}</span>
                            <span className="text-2xl font-bold text-graphite">{formatCurrency(getTotalPrice())}</span>
                        </div>
                        <Link
                            href="/checkout"
                            onClick={onClose}
                            className="block w-full bg-graphite text-white py-4 rounded-xl font-bold hover:bg-black transition-colors shadow-lg active:scale-[0.98] text-center"
                        >
                            {t('cart.checkout')}
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
};
