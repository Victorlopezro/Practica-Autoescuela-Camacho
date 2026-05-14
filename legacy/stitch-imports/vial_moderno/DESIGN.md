---
name: Vial Moderno
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3e4850'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6f7881'
  outline-variant: '#bec8d1'
  surface-tint: '#006590'
  primary: '#00628c'
  on-primary: '#ffffff'
  primary-container: '#007cb0'
  on-primary-container: '#fcfcff'
  inverse-primary: '#87ceff'
  secondary: '#4558ae'
  on-secondary: '#ffffff'
  secondary-container: '#90a3ff'
  on-secondary-container: '#20358b'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a36700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c8e6ff'
  primary-fixed-dim: '#87ceff'
  on-primary-fixed: '#001e2e'
  on-primary-fixed-variant: '#004c6d'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#b9c3ff'
  on-secondary-fixed: '#001256'
  on-secondary-fixed-variant: '#2b3f94'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2.5rem
  xl: 4rem
  gutter: 1.5rem
  container-max: 1280px
---

## Brand & Style

This design system translates the established local presence of Autoescuela Camacho into a high-performance SaaS environment. The personality is **Reliable**, **Instructional**, and **Efficient**. It moves away from the traditional, static "driving school" aesthetic toward an enterprise-grade digital experience that feels as fluid as Stripe and as organized as Linear.

The core style is **Corporate / Modern** with a strong emphasis on functional minimalism. It utilizes generous whitespace to reduce cognitive load—crucial for students studying complex traffic laws—and employs subtle depth through soft shadows to create a clear interactive hierarchy. The UI evokes a sense of progress and clarity, ensuring that the journey from enrollment to licensing is visually frictionless.

## Colors

The palette is anchored by the corporate blue (#0099D8), used specifically for primary actions and brand recognition. We introduce a deep navy (#182E84) from the legacy brand for high-contrast typography and sidebars, providing an "enterprise-grade" weight to the interface.

- **Primary:** Driving actions, progress indicators, and active states.
- **Secondary (Navy):** Used for structural elements like navigation sidebars and headers to provide grounding.
- **Accents (Orange/Yellow):** Reserved strictly for warnings, pending states, and critical progress alerts (e.g., upcoming exam dates).
- **Neutrals:** A scale of cool grays derived from `#64748B` to handle borders, secondary text, and subtle backgrounds.
- **Semantic:** Success (Green) for passed tests; Error (Red) for failed modules or missing documentation.

## Typography

This design system utilizes **Inter** across all levels to ensure maximum legibility and a modern, "system-app" feel. 

- **Headlines:** Use tighter letter-spacing and heavier weights (600-700) to create a strong visual anchor. 
- **Body Text:** Optimized for long-form reading in the "Aula Virtual," using a 1.5x line-height ratio.
- **Labels:** Small, uppercase labels are used for metadata, category tags (e.g., "Permit B"), and table headers to distinguish them from interactive content.
- **Mobile Scaling:** Large display titles scale down significantly on mobile to prevent awkward word wrapping, while body sizes remain constant (16px) for accessibility.

## Layout & Spacing

The system follows a **8pt grid** for consistent spatial relationships. The layout philosophy is a **fixed-fluid hybrid**:
- **Desktop:** A 12-column grid within a max-width container (1280px). 
- **Navigation:** A persistent left sidebar (280px) for the student dashboard, transitioning to a bottom-tab bar or hamburger menu on mobile.
- **Margins:** Generous page margins (40px desktop / 16px mobile) create the "Modern SaaS" breathing room seen in Stripe and Notion.
- **Rhythm:** Vertical spacing between sections should be at least `lg` (40px) to clearly demarcate learning modules and user data.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and **Ambient Shadows**:

- **Level 0 (Background):** `#F9FAFB` for the main app canvas.
- **Level 1 (Cards/Surface):** Pure white `#FFFFFF` with a subtle 1px border (#E2E8F0) and a very soft, diffused shadow (Y: 2, Blur: 4, Opacity: 0.05).
- **Level 2 (Modals/Popovers):** Pure white with a more pronounced shadow (Y: 10, Blur: 20, Opacity: 0.1) and a backdrop blur of 8px on the overlay.
- **Interactions:** Buttons use a slight "press" effect (downward Y-shift) rather than traditional skeuomorphism to maintain the clean aesthetic.

## Shapes

The shape language is consistently **Rounded**, reflecting the approachable nature of a school while maintaining professional rigor.

- **Standard Elements:** Buttons, inputs, and small cards use a **8px** (0.5rem) radius.
- **Large Containers:** Dashboard cards and modals use a **16px** (1rem) radius.
- **Selection States:** Active menu items in the sidebar use a 6px radius to fit within the padding of the parent container.
- **Badges:** Use a fully rounded "pill" shape (999px) for status indicators like "Passed" or "In Progress."

## Components

### Buttons
- **Primary:** Solid `#0099D8` with white text. High emphasis.
- **Secondary:** Subtle light blue background with `#0099D8` text or a light gray border.
- **Ghost:** No background, only text. Used for "Cancel" or secondary navigation actions.

### Inputs
- **Style:** 1px border (#E2E8F0), 8px radius, white background.
- **Focus State:** 2px ring of `#0099D8` with a 4px outer soft blue glow.

### Cards & Tables
- **Cards:** Used for course modules. Must include a clear progress bar at the bottom using the Accent color.
- **Tables:** No vertical lines. Minimalist horizontal separators (#F1F5F9). Headers are `label-caps` in gray.

### Sidebars & Topbar
- **Sidebar:** Dark theme variant using `#182E84` for a professional "command center" feel, or Light theme with subtle gray backgrounds.
- **Topbar:** Glassmorphic (blurred white background) to keep the focus on the content underneath as the user scrolls.

### Alerts & Badges
- **Alerts:** Soft-filled banners at the top of pages for system messages (e.g., "Your next driving lesson is tomorrow").
- **Status Badges:** Small, high-contrast pills for "Theoretical," "Practical," and "Exam" statuses.