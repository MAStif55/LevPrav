import type { AppProps } from 'next/app';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <LanguageProvider defaultLocale="ru">
            <Component {...pageProps} />
        </LanguageProvider>
    );
}
