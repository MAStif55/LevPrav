import { create } from 'zustand';
import { PackConfiguration } from '@/types/product';
import { MaterialOption, CoatingOption, FormatOption } from '@/types/product';

interface CalculatorState {
    // Current Configuration
    selectedPackId: string | null;
    selectedMaterialId: string;
    selectedCoatingId: string;
    selectedFormatId: string;

    // Derived
    basePrice: number;
    calculatedPrice: number;

    // Data
    materials: MaterialOption[];
    coatings: CoatingOption[];
    formats: FormatOption[];

    // Actions
    fetchOptions: () => Promise<void>;
    initializeForPack: (packId: string, basePrice: number) => void;
    setMaterial: (id: string) => void;
    setCoating: (id: string) => void;
    setFormat: (id: string) => void;
    getCurrentConfiguration: () => PackConfiguration | null;
    recalculatePrice: () => void;
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
    selectedPackId: null,
    selectedMaterialId: '',
    selectedCoatingId: '',
    selectedFormatId: '',
    basePrice: 0,
    calculatedPrice: 0,

    materials: [],
    coatings: [],
    formats: [],

    fetchOptions: async () => {
        try {
            const { getCalculatorOptions } = await import('@/lib/firestore-utils');
            const data = await getCalculatorOptions();

            // Validate data exists
            if (!data.materials.length || !data.formats.length) {
                console.error("Calculator options missing!");
                return;
            }

            set({
                materials: data.materials,
                coatings: data.coatings,
                formats: data.formats,
                // Set defaults if not set already
                selectedMaterialId: get().selectedMaterialId || data.materials[0].id,
                selectedCoatingId: get().selectedCoatingId || data.coatings[0].id,
                selectedFormatId: get().selectedFormatId || data.formats[0].id
            });
            get().recalculatePrice();
        } catch (err) {
            console.error("Failed to fetch calculator options", err);
        }
    },

    initializeForPack: (packId: string, basePrice: number) => {
        set({
            selectedPackId: packId,
            basePrice: basePrice
        });

        // If options empty, fetch them
        if (get().materials.length === 0) {
            get().fetchOptions();
        } else {
            get().recalculatePrice();
        }
    },

    setMaterial: (id) => {
        set({ selectedMaterialId: id });
        get().recalculatePrice();
    },

    setCoating: (id) => {
        set({ selectedCoatingId: id });
        get().recalculatePrice();
    },

    setFormat: (id) => {
        set({ selectedFormatId: id });
        get().recalculatePrice();
    },

    recalculatePrice: () => {
        const { basePrice, selectedMaterialId, selectedCoatingId, selectedFormatId, materials, coatings, formats } = get();

        const material = materials.find(m => m.id === selectedMaterialId);
        const coating = coatings.find(c => c.id === selectedCoatingId);
        const format = formats.find(f => f.id === selectedFormatId);

        if (!material || !coating || !format) return;

        // Pricing Logic:
        // (Base Price * Format Multiplier * Material Multiplier) + Coating Addon
        let price = basePrice * (format.basePriceModifier || 1) * (material.priceMultiplier || 1);
        price += (coating.priceAddon || 0);

        set({ calculatedPrice: Math.ceil(price) });
    },

    getCurrentConfiguration: () => {
        const { selectedPackId, selectedMaterialId, selectedCoatingId, selectedFormatId } = get();
        if (!selectedPackId) return null;

        return {
            packId: selectedPackId,
            materialId: selectedMaterialId,
            coatingId: selectedCoatingId,
            formatId: selectedFormatId,
            dictId: `${selectedPackId}-${selectedMaterialId}-${selectedCoatingId}-${selectedFormatId}`
        };
    }
}));
