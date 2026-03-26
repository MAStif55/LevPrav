"use client";

import { useCalculatorStore } from "@/store/calculator-store";
import { formatCurrency } from "@/utils/currency";

export const PriceDisplay = () => {
    const price = useCalculatorStore((state) => state.calculatedPrice);

    return (
        <div className="text-3xl font-bold text-forest-green">
            {formatCurrency(price)}
        </div>
    );
};
