# Keypoint Design System (The Micro-Details)

This document outlines the exact visual rules to transition from a standard clean layout to a **premium, modern B2B SaaS interface** (resembling FlowAI / CloseCRM). 

To get this exact look, you must execute the smallest details perfectly.

---

## 1. The Surface & Color Palette (The "Layer" Effect)

The UI relies on separating the background from the interactive surfaces. Never use pure black or pure white for everything.

*   **App Background (Canvas):** `#F9FAFB` (Very light gray with a hint of blue). This is the base layer.
*   **Card/Surface Background:** `#FFFFFF` (Pure white). All data tables, metrics, and content blocks sit on white cards above the canvas.
*   **Primary Text:** `#111827` (Charcoal/Dark Gray). *Never use `#000000`.*
*   **Muted Text (Secondary):** `#6B7280` (Gray). Used for timestamps, subtitles, table headers, and placeholders.
*   **Primary Brand Color:** `#6366F1` (Indigo/Purple) or similar. Used for primary buttons, active navigation states, and primary chart lines.
*   **Semantic Colors (Soft/Pastel):**
    *   **Success/Active:** Text `#16A34A`, Background `#DCFCE7`
    *   **Warning/Pending:** Text `#CA8A04`, Background `#FEF08A`
    *   **Danger/Error:** Text `#DC2626`, Background `#FEE2E2`
    *   **Info/In Progress:** Text `#2563EB`, Background `#DBEAFE`

## 2. Typography (The Hierarchy)

*   **Font Family:** `Inter`, `SF Pro Display`, or `Roboto`. 
*   **Page Titles:** `24px` to `28px`, Font Weight `600` (Semi-Bold), tracking-tight (slightly condensed).
*   **Card/Section Titles:** `16px` to `18px`, Font Weight `600`.
*   **Table Headers:** `12px` to `13px`, Font Weight `500`, Color `#6B7280` (Muted). *Do not use bold black for table headers.*
*   **Body/Table Data:** `14px`, Font Weight `400`. Color `#111827`.
*   **Small Helper Text / Badges:** `12px`, Font Weight `500`.

## 3. Spacing & Geometry (The Breathing Room)

If the UI feels cramped, it will look cheap. Be generous with space.

*   **Border Radius:** 
    *   Buttons & Inputs: `6px` to `8px`.
    *   Cards & Modals: `12px` to `16px`.
    *   Badges/Pills: `9999px` (Fully rounded).
*   **Padding:**
    *   Inside Cards: Minimum `20px` to `24px` padding on all sides.
    *   Table Rows: `12px` to `16px` vertical padding, `16px` horizontal padding.
    *   Sidebar Items: `8px` to `10px` vertical, `12px` horizontal.
*   **Gaps:** Use an `8px` grid system. The space between cards in a row should be `24px`.

## 4. Borders & Shadows (The Depth)

This is the most critical part. The shadows must be barely visible but present.

*   **Borders:** Use a very faint, cool gray border for cards and dividers: `1px solid #E5E7EB` or `1px solid #F3F4F6`. 
*   **Card Shadows:** Do not use heavy black shadows. Use an ultra-soft, diffused shadow:
    *   `box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);`
*   **Input Fields:** Background `#FFFFFF` or `#F9FAFB`, with a `1px solid #D1D5DB` border.
    *   *Focus State:* `border-color: #6366F1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);`

## 5. Component Specifics

### Sidebar Navigation
*   **Inactive Items:** Muted text (`#6B7280`), no background.
*   **Hover State:** Very light gray background (`#F3F4F6`), text darkens.
*   **Active State:** Background `#F3F4F6` (or brand color with white text), text becomes primary color or charcoal, bold font weight. Include a small icon for every item.

### Data Tables (The Core of the App)
*   **Row Lines:** Only use horizontal dividing lines (`1px solid #E5E7EB`). Do not use vertical lines between columns.
*   **Hover State:** When hovering over a row, apply a very light gray background (`#F9FAFB`).
*   **Status Badges (Pills):** Use the soft semantic colors mentioned above. Add a tiny colored dot (`6px` diameter) to the left of the text inside the badge.
*   **Action Menus:** Use a `...` (kebab menu) icon on the far right of the row. Make it only appear on hover to reduce visual clutter.

### Buttons
*   **Primary:** Solid brand color (`#6366F1`), white text, no border. Slight hover darkening.
*   **Secondary/Outline:** White background, gray border (`#D1D5DB`), charcoal text.
*   **Sizing:** Standard height is `36px` to `40px` with `12px` to `16px` horizontal padding.

### Charts & Analytics
*   **Chart Lines:** Smooth curves (spline interpolation), not jagged lines.
*   **Chart Gridlines:** Keep them incredibly faint (`#F3F4F6`). Do not draw vertical gridlines.
*   **Legends:** Use small colored dots next to text, placed above or to the side of the chart.

## 6. Micro-Interactions (The "Feel")

*   **Transitions:** Every hover state (buttons, table rows, nav items) must have a CSS transition: `transition: all 0.2s ease-in-out;`. 
*   **Modals:** When a modal opens, use a dark backdrop overlay (`rgba(0,0,0,0.4)`) and a very subtle scale-up animation for the modal card itself (e.g., scaling from 95% to 100% opacity/size).
*   **Avatars:** Always circular. If a user doesn't have an image, use their initials on a soft, randomly assigned pastel background color.

## 7. Icons
*   Use a single, consistent icon library (e.g., **Lucide Icons, Phosphor, or Heroicons**). 
*   **Style:** Outlined, not filled (except for rare active states).
*   **Size:** `16px` or `18px`. Keep them vertically centered with text.
*   **Color:** Usually inherit the text color. In buttons, match the button text color.

---

### Final "Squint Test" Checklist:
Before finalizing any page, squint your eyes. 
1. Is the hierarchy clear? (Can you distinguish the main title from the table data?)
2. Is it breathing? (Is there enough white space between elements?)
3. Is the color restrained? (Are there only a few pops of color, or is it a rainbow?)
4. Are the alignments perfect? (Are the left edges of cards, tables, and titles perfectly aligned vertically?)