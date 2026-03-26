# PROJECT IDENTITY: "LevPrav" (Лев прав) Art Studio

## Core Concept
- **Business Type:** E-commerce platform dedicated to selling **exclusive, author-designed stickers**.
- **Brand Identity:** Art Studio/Boutique specializing in handmade, premium-quality sticker products.
- **Vibe:** Handmade, Exclusive, Artistic. Pun: "The Lion is Right" (Lev Prav) / "Left Right".
- **Languages:** Russian (Default) & English.

## UI/UX Guidelines (Sticker E-Commerce Focus)
- **Product Galleries:** Showcase stickers with high-quality imagery; support zoom and detail views.
- **Filtering & Search:** Enable filtering by theme, style, size, and collection.
- **Product Cards:** Emphasize visual appeal; stickers should be the hero element.
- **Collections/Categories:** Organize by artistic themes (e.g., animals, quotes, abstract).
- **Cart & Checkout:** Streamlined flow optimized for multiple small-item purchases.
- **Mobile-First:** Prioritize touch-friendly interactions for browsing sticker galleries.

# TECH STACK
- **Framework:** Next.js 14+ (App Router).
- **Styling:** Tailwind CSS.
- **State:** Zustand (Cart & UI).
- **Backend:** Firebase (Auth, Firestore, Storage).
- **Icons:** Lucide-React.
- **i18n:** Use a lightweight solution (e.g., React Context or next-intl) for dictionaries.

# DESIGN SYSTEM (Tailwind Tokens)
- **Colors:**
  - `canvas`: '#FAF9F6' (Bone/Milk)
  - `lion-amber-start`: '#E67E22'
  - `lion-amber-end`: '#F1C40F'
  - `forest-green`: '#2D5A27'
  - `graphite`: '#333333'
- **Typography:**
  - Headings: 'Montserrat Alternates'
  - Body: 'Open Sans'
- **UI Style:** Rounded-full buttons (30px), Gradient BG, Soft shadows.

# ARCHITECTURE RULES
- **Localization:** All UI text must be extracted to locale files (`/locales/ru.json`, `/locales/en.json`). DO NOT hardcode text in components.
- **Admin Panel:** Protected route `/admin`.
- **Images:** Use config/constants for paths.
