// import 'server-only'; // Skipped due to environment restrictions

const dictionaries = {
    en: () => import('@/locales/en.json').then((module) => module.default),
    ru: () => import('@/locales/ru.json').then((module) => module.default),
};

export const getDictionary = async (locale: 'en' | 'ru') => {
    if (!dictionaries[locale]) {
        console.warn(`Dictionary not found for locale: ${locale}, falling back to 'ru'`);
        return dictionaries['ru']();
    }
    return dictionaries[locale]();
};
