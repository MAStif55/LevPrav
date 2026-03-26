'use client';

import { useEffect, useState } from "react";
import { useCalculatorStore } from "@/store/calculator-store";
import { useCartStore } from "@/store/cart-store";
import { useTranslation } from "@/contexts/LanguageContext";
import { Configurator } from "@/components/calculator/Configurator";
import { PriceDisplay } from "@/components/calculator/PriceDisplay";
import { StickerPack, getImageUrl, getThumbUrl } from "@/types/product";
import { ImageLightbox } from "@/components/packs/ImageLightbox";
import { ZoomIn } from "lucide-react";

interface PackDetailsClientProps {
    pack: StickerPack;
}

export function PackDetailsClient({ pack }: PackDetailsClientProps) {
    const { t, locale } = useTranslation();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const initialize = useCalculatorStore((state) => state.initializeForPack);
    const getCurrentConfiguration = useCalculatorStore((state) => state.getCurrentConfiguration);
    const calculatedPrice = useCalculatorStore((state) => state.calculatedPrice);

    // Subscribe to cart store
    const { items, addItem, updateQuantity, removeItem } = useCartStore();

    useEffect(() => {
        if (pack) {
            initialize(pack.id, pack.basePrice);
        }
    }, [pack, initialize]);

    // Reset selected image when pack changes
    useEffect(() => {
        setSelectedImageIndex(0);
    }, [pack.id]);

    // Find existing item in cart
    const currentConfig = getCurrentConfiguration();
    const existingCartItem = currentConfig
        ? items.find(
            item =>
                item.packId === currentConfig.packId &&
                item.configuration.materialId === currentConfig.materialId &&
                item.configuration.coatingId === currentConfig.coatingId &&
                item.configuration.formatId === currentConfig.formatId
        )
        : undefined;

    const handleAddToCart = () => {
        if (!currentConfig) return;

        addItem({
            packId: currentConfig.packId,
            packTitle: pack.title,
            packImage: pack.images[0] ? getImageUrl(pack.images[0]) : '',
            configuration: currentConfig,
            price: calculatedPrice,
            quantity: 1,
        });
    };

    const currentImageRaw = pack.images[selectedImageIndex] || pack.images[0];
    const currentImage = currentImageRaw ? getImageUrl(currentImageRaw) : undefined;

    const openLightbox = (index: number) => {
        setSelectedImageIndex(index);
        setLightboxOpen(true);
    };

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Lightbox */}
            <ImageLightbox
                images={pack.images}
                initialIndex={selectedImageIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                alt={pack.title[locale]}
            />

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                {/* Left Column: Image Gallery */}
                <div className="space-y-4">
                    {/* Main Image */}
                    <div
                        className="overflow-hidden rounded-2xl bg-gray-100 flex items-center justify-center min-h-[300px] max-h-[600px] cursor-pointer group relative"
                        onClick={() => openLightbox(selectedImageIndex)}
                    >
                        {currentImage ? (
                            <>
                                <img
                                    src={currentImage!}
                                    alt={pack.title[locale]}
                                    className="max-w-full max-h-[600px] w-auto h-auto object-contain transition-opacity duration-300"
                                />
                                {/* Zoom hint overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
                                        <ZoomIn className="w-6 h-6 text-graphite" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-64 items-center justify-center text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {pack.images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {pack.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                                        ? 'border-primary ring-2 ring-primary/30'
                                        : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                >
                                    <img
                                        src={getThumbUrl(image)}
                                        alt={`${pack.title[locale]} - ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Info & Configurator */}
                <div>
                    <h1 className="mb-2 font-heading text-4xl font-bold text-graphite">
                        {pack.title[locale]}
                    </h1>
                    <p className="mb-6 text-lg text-gray-600">{pack.description[locale]}</p>

                    <div className="mb-8">
                        <div className="mb-2 text-sm font-medium text-gray-500">Цена / Price</div>
                        <PriceDisplay />
                    </div>

                    <Configurator locale={locale} />

                    {/* Contact Action (Catalog Mode) */}
                    <div className="mt-8 flex gap-4 border-t border-gray-100 pt-8">
                        <button
                            className="flex-1 rounded-full bg-graphite px-8 py-4 font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] h-[56px] shadow-xl"
                            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                        >
                            {locale === 'ru' ? 'Связаться для заказа' : 'Contact to Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
