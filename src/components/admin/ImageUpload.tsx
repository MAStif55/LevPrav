'use client';

import { useState, useCallback, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Loader2, Upload, X, ImageIcon, Download, RefreshCw } from 'lucide-react';
import { ProductImage } from '@/types/product';

interface ImageUploadProps {
    value: Array<string | ProductImage>;
    onChange: (images: Array<string | ProductImage>) => void;
}

// ─── Variant Configuration ───────────────────────────────────────────────────

const IMAGE_VARIANTS = [
    { suffix: '',      maxDim: 1200, quality: 0.85, key: 'url'      as const },
    { suffix: '_card',  maxDim: 600,  quality: 0.82, key: 'cardUrl'  as const },
    { suffix: '_thumb', maxDim: 300,  quality: 0.75, key: 'thumbUrl' as const },
] as const;

// Cache headers for immutable assets (1 year)
const CACHE_METADATA = {
    cacheControl: 'public, max-age=31536000, immutable',
    contentType: 'image/webp',
};

// ─── Image Processing Helpers ────────────────────────────────────────────────

/**
 * Generates a single WebP variant at the specified max dimension and quality.
 */
async function generateVariant(
    sourceBlob: Blob,
    maxDim: number,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let { width, height } = img;

            // Scale down to fit within maxDim while maintaining aspect ratio
            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = (height * maxDim) / width;
                    width = maxDim;
                } else {
                    width = (width * maxDim) / height;
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;

            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert canvas to blob'));
                    }
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(sourceBlob);
    });
}

/**
 * Processes a file into all 3 WebP variants in parallel, uploads them,
 * and returns a ProductImage object.
 */
async function processAndUploadImage(file: File): Promise<ProductImage> {
    // First, create a source blob from the file
    const sourceBlob = new Blob([await file.arrayBuffer()], { type: file.type });

    // Generate a base filename
    const baseName = `${Date.now()}_${file.name.replace(/\.[^/.]+$/, '')}`;

    // Generate all 3 variants in parallel
    const variantBlobs = await Promise.all(
        IMAGE_VARIANTS.map((v) => generateVariant(sourceBlob, v.maxDim, v.quality))
    );

    // Upload all 3 variants in parallel
    const uploadResults = await Promise.all(
        IMAGE_VARIANTS.map(async (variant, idx) => {
            const filename = `uploads/${baseName}${variant.suffix}.webp`;
            const storageRef = ref(storage, filename);
            await uploadBytes(storageRef, variantBlobs[idx], CACHE_METADATA);
            const url = await getDownloadURL(storageRef);
            return { key: variant.key, url };
        })
    );

    // Build ProductImage object
    const result: ProductImage = { url: '' };
    for (const { key, url } of uploadResults) {
        (result as any)[key] = url;
    }

    return result;
}

// ─── Helper to get display URL from mixed image type ─────────────────────────

function getDisplayUrl(image: string | ProductImage): string {
    if (typeof image === 'string') return image;
    return image.thumbUrl || image.cardUrl || image.url;
}

function getFullUrl(image: string | ProductImage): string {
    if (typeof image === 'string') return image;
    return image.url;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
    const replaceInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        setUploading(true);
        try {
            // Process and upload all 3 variants
            const productImage = await processAndUploadImage(file);
            onChange([...value, productImage]);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed!");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await handleUpload(file);
    };

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) await handleUpload(file);
    }, [value, onChange]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);

    const removeImage = (index: number) => {
        const newImages = [...value];
        newImages.splice(index, 1);
        onChange(newImages);
    };

    const handleReplaceClick = (index: number) => {
        setReplacingIndex(index);
        // Trigger the hidden file input
        if (replaceInputRef.current) {
            replaceInputRef.current.value = '';
            replaceInputRef.current.click();
        }
    };

    const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || replacingIndex === null) {
            setReplacingIndex(null);
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            setReplacingIndex(null);
            return;
        }

        setUploading(true);
        try {
            // Process the new file into 3 WebP variants
            const newProductImage = await processAndUploadImage(file);

            // Merge: keep existing SEO metadata (alt, keywords), replace URLs
            const existingImage = value[replacingIndex];
            const mergedImage: ProductImage = {
                ...newProductImage,
            };

            // Preserve SEO metadata from the existing image
            if (typeof existingImage !== 'string') {
                if (existingImage.alt) mergedImage.alt = existingImage.alt;
                if (existingImage.keywords) mergedImage.keywords = existingImage.keywords;
            }

            const newImages = [...value];
            newImages[replacingIndex] = mergedImage;
            onChange(newImages);
        } catch (error) {
            console.error('Replace failed', error);
            alert('Failed to replace image!');
        } finally {
            setUploading(false);
            setReplacingIndex(null);
        }
    };

    const downloadImage = async (image: string | ProductImage, index: number) => {
        const url = getFullUrl(image);
        try {
            // Create a canvas to convert the image
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const downloadUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = downloadUrl;
                            link.download = `product-image-${index + 1}.webp`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(downloadUrl);
                        }
                    }, 'image/webp');
                }
            };

            img.onerror = () => {
                // Fallback: open in new tab with download hint
                const link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.download = `product-image-${index + 1}.webp`;
                link.click();
            };

            img.src = url;
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    return (
        <div className="space-y-4">
            {/* Hidden input for replace functionality */}
            <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleReplaceFileChange}
                disabled={uploading}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {value.map((image, idx) => (
                    <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border group">
                        <img src={getDisplayUrl(image)} alt="Product" className="w-full h-full object-cover" />

                        {/* Replacing overlay */}
                        {uploading && replacingIndex === idx && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                <Loader2 className="animate-spin text-white" size={32} />
                            </div>
                        )}

                        {/* Button container */}
                        <div className="absolute top-1 right-1 flex gap-1">
                            <button
                                type="button"
                                onClick={() => handleReplaceClick(idx)}
                                className="bg-amber-500 text-white p-1 rounded-full hover:bg-amber-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Заменить файл (SEO-данные сохранятся)"
                                disabled={uploading}
                            >
                                <RefreshCw size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadImage(image, idx)}
                                className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download"
                            >
                                <Download size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Удалить"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Upload Zone */}
                <label
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg transition-colors cursor-pointer ${dragOver
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-300 hover:border-primary hover:bg-primary/5'
                        }`}
                >
                    {uploading && replacingIndex === null ? (
                        <Loader2 className="animate-spin text-primary" size={32} />
                    ) : (
                        <>
                            <ImageIcon className={`mb-2 ${dragOver ? 'text-primary' : 'text-gray-400'}`} size={32} />
                            <span className="text-xs text-gray-500 text-center px-2">
                                {dragOver ? 'Отпустите для загрузки' : 'Перетащите или нажмите'}
                            </span>
                            <span className="text-xs text-gray-400 mt-1">WebP, до 1200px</span>
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
            </div>
        </div>
    );
}
