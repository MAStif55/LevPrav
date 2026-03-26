import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: '#E67E22', // lion-amber-start
                    dark: '#D35400',
                },
                'lion-amber': {
                    start: '#E67E22',
                    end: '#F1C40F'
                },
                'forest-green': '#2D5A27',
                graphite: '#333333',
                canvas: '#FAF9F6',
            },
            fontFamily: {
                heading: ['"Montserrat Alternates"', 'sans-serif'],
                body: ['"Open Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
