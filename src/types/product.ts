export type PackType = 'sticker_pack';

export interface MaterialOption {
    id: string;
    label: { en: string; ru: string };
    priceMultiplier: number; // e.g., 1.0 for paper, 1.2 for vinyl
    description?: { en: string; ru: string };
}

export interface CoatingOption {
    id: string;
    label: { en: string; ru: string };
    priceAddon: number; // e.g., 0 for none, 50 for holographic
    description?: { en: string; ru: string };
}

export interface FormatOption {
    id: string;
    label: string; // e.g., "A5", "A4"
    width: number; // mm
    height: number; // mm
    basePriceModifier: number; // Multiplier on the pack's base price
}

// ─── Product Image (Structured) ──────────────────────────────────────────────

export interface ProductImage {
    url: string;          // Full-res (1200px) — always present
    cardUrl?: string;     // 600px medium variant
    thumbUrl?: string;    // 300px thumbnail variant
    alt?: { en: string; ru: string }; // SEO alt text
    keywords?: string[];  // SEO keywords
}

/**
 * Normalizes a mixed images array (legacy strings + structured ProductImage objects)
 * into a consistent array of ProductImage objects.
 */
export function normalizeImages(images: Array<string | ProductImage>): ProductImage[] {
    return images.map((img) => {
        if (typeof img === 'string') {
            return { url: img };
        }
        return img;
    });
}

/**
 * Extracts the display URL from a string or ProductImage.
 * Used for backward-compatible rendering.
 */
export function getImageUrl(image: string | ProductImage): string {
    if (typeof image === 'string') return image;
    return image.url;
}

/**
 * Extracts the card variant URL, falling back to the full URL.
 */
export function getCardUrl(image: string | ProductImage): string {
    if (typeof image === 'string') return image;
    return image.cardUrl || image.url;
}

/**
 * Extracts the thumbnail variant URL, falling back to the card or full URL.
 */
export function getThumbUrl(image: string | ProductImage): string {
    if (typeof image === 'string') return image;
    return image.thumbUrl || image.cardUrl || image.url;
}

// ─── Sticker Pack (Product) ──────────────────────────────────────────────────

export interface StickerPack {
    id: string;
    type: PackType;
    slug: string;
    title: { en: string; ru: string };
    description: { en: string; ru: string };
    basePrice: number; // Base price for the smallest/default format on standard material
    images: Array<string | ProductImage>; // Mixed legacy strings + structured objects
    artist?: string;
    category?: string; // e.g., "animals", "abstract", "retro", "cute"
    tags?: string[]; // e.g., ["new", "popular", "sale"]
    videoPreviewUrl?: string; // 480p compressed MP4
    videoUrl?: string;        // 720p high-quality MP4
    createdAt?: number; // Timestamp for sorting by newest
}

export interface PackConfiguration {
    packId: string;
    materialId: string;
    coatingId: string;
    formatId: string;
    dictId: string; // Helper for easy equality checks
}
