# RUSH Design System & Handoff Specs
**Project:** Sports Activity App
**Style:** Cyberpunk / High-Contrast Dark Mode
**Version:** 2.0

## 1. Color Palette (Dark Mode Optimized)
The palette relies on a true black background to maximize contrast with the primary "Neon Green" accent. Greys are used for surfaces and hierarchy.

| Color Token | Hex Value | Usage |
|:---|:---|:---|
| **Primary Neon** | `#39E079` | Brand, CTAs, Active States |
| **True Black** | `#000000` | Main Background |
| **Surface Dark** | `#1A1A1A` | Inputs, Secondary Cards |
| **Card Surface** | `#1C1C1E` | Primary Cards, Modals |
| **Text Primary** | `#FFFFFF` | Headings, Body |
| **Text Muted** | `#9CA3AF` | Subtitles, Hints |

## 2. Typography
**Font Family:** `Lexend`
Used for Headings, Buttons, and UI Elements to give a geometric, sporty feel.

| Role | Style | Size/Line-Height | Example |
|:---|:---|:---|:---|
| **Display XL (Splash / Hero)** | Lexend Black (900) | 36px/40px | "Unleash Potential" |
| **Heading L (Page Titles)** | Lexend Bold (700) | 24px/32px | "Find Matches" |
| **Body (Default)** | Lexend Regular (400) | 16px/24px | "Access premium workouts..." |
| **Label (Navigation / Chips)** | Lexend Bold (700) | 12px (Tracking 0.05em) | "BOOK NOW" |

## 3. Spacing & Radius
**Corner Radius**
*   **Standard Card:** `rounded-2xl` (16px)
*   **Large Card / Sheet:** `rounded-3xl` (24px)
*   **Button / Icon:** `rounded-full` (999px)

**Padding System**
*   **Page Container:** `p-6` (24px)
*   **Card Inner:** `p-4` (16px) or `p-5` (20px)

**Layout Gaps**
*   **Section Gap:** 32px (`mb-8`)
*   **Item Gap:** 16px (`gap-4`)
*   **Tight Gap:** 8px (`gap-2`)

## 4. Components Breakdown
**A. Buttons**
*   **Join Match:** Height 56px (h-14), Fill `#39E079`, Text Black (900)
*   **View Details:** Height 40px, Border 1px Solid `#39E079`, Text `#39E079`
*   **Icon Button (bolt):** Size 56x56, Bg `#1A1A1A`, Icon 24px

**B. Inputs / Search**
*   **Search for games...**: Height 52px (py-3.5), Bg `#1A1A1A`, Radius Full

**C. Cards (Venues/Matches)**
*   **Container:** Bg `#1C1C1E`, Border 1px Solid White/10, Radius 24px
*   **Icon Box:** Size 48px, Bg Primary/10, Radius 12px

## 5. Iconography
Using Material Symbols Outlined from Google Fonts. Active states often use the "Filled" variation.
*   `home` (Navigation)
*   `sports_soccer` (Sports)
*   `bolt` (Brand/AI)
*   `location_on` (Map/Place)
*   `calendar_today` (Date)
*   `fitness_center` (Training)
