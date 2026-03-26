export const formatCurrency = (amount: number, currency: 'RUB' | 'USD' = 'RUB'): string => {
    return new Intl.NumberFormat(currency === 'RUB' ? 'ru-RU' : 'en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};
