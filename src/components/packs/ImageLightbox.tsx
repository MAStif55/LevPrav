'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { ProductImage, getImageUrl, getThumbUrl } from '@/types/product';

interface ImageLightboxProps {
    images: Array<string | ProductImage>;
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
    alt?: string;
}

export function ImageLightbox({ images, initialIndex, isOpen, onClose, alt = 'Image' }: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setIsZoomed(false);
        }
    }, [isOpen, initialIndex]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    goToPrevious();
                    break;
                case 'ArrowRight':
                    goToNext();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden'; // Prevent scrolling

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, currentIndex]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        setIsZoomed(false);
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setIsZoomed(false);
    }, [images.length]);

    const toggleZoom = () => {
        setIsZoomed(!isZoomed);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close"
            >
                <X className="w-8 h-8 text-white" />
            </button>

            {/* Zoom Button */}
            <button
                onClick={toggleZoom}
                className="absolute top-4 left-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
            >
                {isZoomed ? (
                    <ZoomOut className="w-8 h-8 text-white" />
                ) : (
                    <ZoomIn className="w-8 h-8 text-white" />
                )}
            </button>

            {/* Previous Button */}
            {images.length > 1 && (
                <button
                    onClick={goToPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Previous image"
                >
                    <ChevronLeft className="w-8 h-8 text-white" />
                </button>
            )}

            {/* Next Button */}
            {images.length > 1 && (
                <button
                    onClick={goToNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    aria-label="Next image"
                >
                    <ChevronRight className="w-8 h-8 text-white" />
                </button>
            )}

            {/* Main Image */}
            <div
                className={`w-full h-full flex items-center justify-center p-4 ${isZoomed ? 'overflow-auto' : ''}`}
                onClick={(e) => {
                    // Close if clicking the background (not the image)
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <img
                    src={getImageUrl(images[currentIndex])}
                    alt={`${alt} - ${currentIndex + 1}`}
                    className={`transition-transform duration-300 ${isZoomed
                            ? 'max-w-none cursor-zoom-out'
                            : 'max-w-full max-h-full object-contain cursor-zoom-in'
                        }`}
                    style={isZoomed ? { width: '150%', height: 'auto' } : {}}
                    onClick={toggleZoom}
                />
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-2 rounded-full text-white text-sm">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/10 rounded-lg">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                setCurrentIndex(index);
                                setIsZoomed(false);
                            }}
                            className={`w-12 h-12 rounded overflow-hidden border-2 transition-all ${currentIndex === index
                                    ? 'border-white scale-110'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                        >
                            <img
                                src={getThumbUrl(image)}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
