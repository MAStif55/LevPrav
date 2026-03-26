import { create } from 'zustand';
import { StickerPack } from '@/types/product';
import { getAllProducts } from '@/lib/firestore-utils';

interface ProductCacheState {
    products: StickerPack[];
    lastFetched: number | null;
    loading: boolean;
    error: string | null;
    fetchProducts: (forceRefresh?: boolean) => Promise<StickerPack[]>;
    invalidateCache: () => void;
}

// Cache TTL: 5 minutes (in milliseconds)
const CACHE_TTL = 5 * 60 * 1000;

export const useProductCache = create<ProductCacheState>((set, get) => ({
    products: [],
    lastFetched: null,
    loading: false,
    error: null,

    fetchProducts: async (forceRefresh = false) => {
        const state = get();
        const now = Date.now();

        // Return cached data if valid and not forcing refresh
        if (
            !forceRefresh &&
            state.products.length > 0 &&
            state.lastFetched &&
            now - state.lastFetched < CACHE_TTL
        ) {
            return state.products;
        }

        // If already loading, wait for it
        if (state.loading) {
            // Return existing products while loading
            return state.products;
        }

        set({ loading: true, error: null });

        try {
            const products = await getAllProducts();
            set({
                products,
                lastFetched: now,
                loading: false,
                error: null,
            });
            return products;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch products';
            set({ loading: false, error: errorMessage });
            return state.products; // Return stale data on error
        }
    },

    invalidateCache: () => {
        set({ lastFetched: null });
    },
}));
