"use client";

import { useCalculatorStore } from "@/store/calculator-store";
import { MATERIALS, COATINGS, FORMATS } from "@/data/mock-products";

interface ConfiguratorProps {
    locale?: 'ru' | 'en';
}

export const Configurator = ({ locale = 'ru' }: ConfiguratorProps) => {
    const {
        selectedMaterialId,
        selectedCoatingId,
        selectedFormatId,
        setMaterial,
        setCoating,
        setFormat
    } = useCalculatorStore();

    return (
        <div className="space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            {/* Material Selection */}
            <div>
                <h4 className="mb-3 font-heading font-bold text-graphite">
                    {locale === 'ru' ? 'Материал' : 'Material'}
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {MATERIALS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMaterial(m.id)}
                            className={`flex flex-col items-center justify-center rounded-lg border p-3 text-sm transition-all
                ${selectedMaterialId === m.id
                                    ? 'border-lion-amber-start bg-orange-50 text-lion-amber-start ring-1 ring-lion-amber-start'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                        >
                            <span className="font-semibold">{m.label[locale]}</span>
                            {m.description && <span className="text-xs opacity-75 mt-1">{m.description[locale]}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Coating Selection */}
            <div>
                <h4 className="mb-3 font-heading font-bold text-graphite">
                    {locale === 'ru' ? 'Покрытие' : 'Coating'}
                </h4>
                <div className="flex flex-wrap gap-2">
                    {COATINGS.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setCoating(c.id)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all border
                ${selectedCoatingId === c.id
                                    ? 'border-forest-green bg-forest-green text-white'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {c.label[locale]}
                            {c.priceAddon > 0 && <span className="ml-1 opacity-80">(+{c.priceAddon})</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Format Selection */}
            <div>
                <h4 className="mb-3 font-heading font-bold text-graphite">
                    {locale === 'ru' ? 'Формат' : 'Format'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    {FORMATS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFormat(f.id)}
                            className={`flex items-center justify-between rounded-lg border p-3 transition-all
                        ${selectedFormatId === f.id
                                    ? 'border-lion-amber-start bg-orange-50'
                                    : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span className={`font-bold ${selectedFormatId === f.id ? 'text-lion-amber-start' : 'text-gray-700'}`}>
                                {f.label}
                            </span>
                            <span className="text-xs text-gray-500">
                                {f.width}x{f.height} mm
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
