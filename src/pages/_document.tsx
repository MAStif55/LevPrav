import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="ru">
            <Head />
            <body className="bg-canvas text-graphite antialiased">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
