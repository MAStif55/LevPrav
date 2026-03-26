import { StickerPack, MaterialOption, CoatingOption, FormatOption } from "@/types/product";

export const MATERIALS: MaterialOption[] = [
    {
        id: "paper_matte",
        label: { en: "Matte Paper", ru: "Матовая бумага" },
        priceMultiplier: 1.0,
        description: { en: "Best for journals", ru: "Идеально для дневников" },
    },
    {
        id: "vinyl_glossy",
        label: { en: "Glossy Vinyl", ru: "Глянцевый винил" },
        priceMultiplier: 1.3,
        description: { en: "Waterproof & durable", ru: "Водостойкий и прочный" },
    },
    {
        id: "vinyl_transparent",
        label: { en: "Transparent Vinyl", ru: "Прозрачный винил" },
        priceMultiplier: 1.4,
        description: { en: "For glass & tech", ru: "Для стекла и техники" },
    },
];

export const COATINGS: CoatingOption[] = [
    {
        id: "none",
        label: { en: "None", ru: "Без покрытия" },
        priceAddon: 0,
    },
    {
        id: "holographic",
        label: { en: "Holographic", ru: "Голография" },
        priceAddon: 50, // Fixed cost in base currency (RUB)
    },
    {
        id: "glitter",
        label: { en: "Glitter", ru: "Блёстки" },
        priceAddon: 60,
    },
];

export const FORMATS: FormatOption[] = [
    {
        id: "a5",
        label: "A5",
        width: 148,
        height: 210,
        basePriceModifier: 1.0,
    },
    {
        id: "a4",
        label: "A4",
        width: 210,
        height: 297,
        basePriceModifier: 1.8, // Slightly cheaper than 2x A5
    },
];

export const STICKER_PACKS: StickerPack[] = [
    {
        id: "pack_cyber_cats",
        type: "sticker_pack",
        slug: "cyber-cats",
        title: { en: "Cyber Cats", ru: "Кибер-Коты" },
        description: {
            en: "Neon-lit felines from the future.",
            ru: "Неоновые коты из будущего.",
        },
        basePrice: 350,
        images: ["/pack-cyber.png"],
        artist: "AlexNeo",
    },
    {
        id: "pack_forest_spirits",
        type: "sticker_pack",
        slug: "forest-spirits",
        title: { en: "Forest Spirits", ru: "Духи Леса" },
        description: {
            en: "Mystical creatures hiding in the moss.",
            ru: "Мистические существа, прячущиеся во мху.",
        },
        basePrice: 300,
        images: ["/pack-forest.png"],
        artist: "GreenLeaf",
    },
    {
        id: "pack_retro_vapour",
        type: "sticker_pack",
        slug: "retro-vapour",
        title: { en: "Retro Vapour", ru: "Ретро Вейпор" },
        description: {
            en: "Aesthetic statues and windows 95 errors.",
            ru: "Эстетичные статуи и ошибки Windows 95.",
        },
        basePrice: 320,
        images: ["/pack-retro.png"],
        artist: "VapeGod",
    },
    {
        id: "pack_space_explorers",
        type: "sticker_pack",
        slug: "space-explorers",
        title: { en: "Space Explorers", ru: "Исследователи Космоса" },
        description: {
            en: "Cute astronauts and distant planets.",
            ru: "Милые астронавты и далекие планеты.",
        },
        basePrice: 380,
        images: ["/pack-space.png"],
        artist: "StarWalker",
    },
    {
        id: "pack_dino_park",
        type: "sticker_pack",
        slug: "dino-park",
        title: { en: "Dino Park", ru: "Парк Динозавров" },
        description: {
            en: "Roaring fun with prehistoric friends.",
            ru: "Веселье с доисторическими друзьями.",
        },
        basePrice: 340,
        images: ["/pack-dino.png"],
        artist: "PaleoArt",
    },
    {
        id: "pack_pixel_lives",
        type: "sticker_pack",
        slug: "pixel-lives",
        title: { en: "Pixel Lives", ru: "Пиксельная Жизнь" },
        description: {
            en: "8-bit characters in a modern world.",
            ru: "8-битные персонажи в современном мире.",
        },
        basePrice: 300,
        images: ["/pack-pixel.png"],
        artist: "BitMaster",
    },
];
