import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PackConfiguration, StickerPack } from '@/types/product';

export interface CartItem {
    id: string; // unique ID for the cart entry (e.g. timestamp + random)
    packId: string;
    packTitle: { en: string; ru: string }; // Snapshot
    packImage: string;
    configuration: PackConfiguration;
    price: number;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'id'>) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                const id = Math.random().toString(36).substring(2, 9);
                set((state) => ({
                    items: [...state.items, { ...newItem, id }]
                }));
            },

            removeItem: (itemId) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== itemId)
                }));
            },

            updateQuantity: (itemId, quantity) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === itemId
                            ? { ...item, quantity: Math.max(1, quantity) }
                            : item
                    )
                }));
            },

            clearCart: () => {
                set({ items: [] });
            },

            getTotalPrice: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
            }
        }),
        {
            name: 'levprav-cart',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
