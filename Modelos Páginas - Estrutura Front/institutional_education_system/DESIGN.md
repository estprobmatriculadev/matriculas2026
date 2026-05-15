---
name: Institutional Education System
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
  on-surface-variant: '#444650'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747782'
  outline-variant: '#c4c6d2'
  surface-tint: '#3f5ca1'
  primary: '#002666'
  on-primary: '#ffffff'
  primary-container: '#1d3d81'
  on-primary-container: '#8fabf6'
  inverse-primary: '#b2c5ff'
  secondary: '#3c6a00'
  on-secondary: '#ffffff'
  secondary-container: '#b1f669'
  on-secondary-container: '#407100'
  tertiary: '#481f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a3000'
  on-tertiary-container: '#ed9861'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001847'
  on-primary-fixed-variant: '#254488'
  secondary-fixed: '#b1f669'
  secondary-fixed-dim: '#96d950'
  on-secondary-fixed: '#0e2000'
  on-secondary-fixed-variant: '#2c5000'
  tertiary-fixed: '#ffdbc8'
  tertiary-fixed-dim: '#ffb689'
  on-tertiary-fixed: '#321300'
  on-tertiary-fixed-variant: '#723605'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-background: '#F8FAFC'
  surface-border: '#E2E8F0'
  status-success: '#166534'
  status-error: '#991B1B'
  status-warning: '#854D0E'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style

The brand personality is **authoritative, transparent, and efficient**. As a government education management tool, the UI must prioritize functional clarity and accessibility over aesthetic trends. The emotional response should be one of reliability and trust, ensuring that educators and administrators feel supported by a robust professional tool.

The chosen design style is **Corporate / Modern**. This approach utilizes a structured layout, a balanced color palette derived from institutional identity, and a focus on data density. It avoids unnecessary ornamentation, opting instead for clear typographic hierarchies and logical information architecture to facilitate complex administrative tasks.

**Design Principles:**
- **Accessibility First:** Contrast ratios must meet WCAG AA standards to ensure inclusivity for all government employees.
- **Predictability:** UI patterns remain consistent across public-facing portals and internal technical dashboards.
- **Data Integrity:** Visual emphasis is placed on structured information, using clear borders and distinct background tiers to separate content.

## Colors

The color palette is anchored by the **Deep Blue (#1D3D81)**, representing institutional stability and authority. This is used for primary actions, navigation headers, and core branding elements. The **Vibrant Green (#79B933)** serves as the secondary color, used for positive reinforcement, "Save" actions, and success states, symbolizing growth and educational progress.

The interface primarily utilizes a **light color mode** to maintain a paper-like familiarity for administrative work. Neutrals are cool-toned grays that provide sufficient contrast without causing eye strain during long periods of data entry.

**Color Usage Guidance:**
- **Primary Blue:** Navigation sidebars, primary buttons, and active state indicators.
- **Secondary Green:** Completion indicators, "Create New" buttons, and progress bars.
- **Surface Grays:** Used to differentiate between the global background (`#F8FAFC`) and white content cards (`#FFFFFF`).

## Typography

The design system utilizes **Inter** for all typographic levels. Inter is selected for its exceptional legibility on digital screens and its neutral, professional character. It excels in data-heavy environments, such as tables and complex forms, where clarity is paramount.

**Hierarchy Rules:**
- **Headlines:** Use Semi-Bold (600) weights to establish clear section breaks.
- **Body Text:** Standard administrative text uses `body-md` (14px) to balance readability with information density.
- **Labels:** Small caps or medium weights (500) are used for form labels and table headers to distinguish them from user-inputted data.
- **Mobile Scaling:** Large headlines scale down significantly on mobile to prevent awkward text wrapping in dashboard headers.

## Layout & Spacing

This design system employs a **Fixed Grid** approach for public-facing pages (like the login and landing screens) to ensure a controlled, editorial appearance. For the internal dashboard, a **Fluid Grid** is used to maximize the available screen real estate for data tables and multi-column forms.

**Grid Specifications:**
- **Desktop:** 12-column grid with 24px gutters. Content is housed in a 1280px max-width container for fixed layouts.
- **Tablet:** 8-column grid with 16px gutters.
- **Mobile:** 4-column grid with 16px margins.

**Spacing Logic:**
A 4px base unit drives all spacing. Elements are "stacked" using increments of 8px (`stack-sm`, `stack-md`, `stack-lg`) to create a consistent vertical rhythm. Internal card padding should always be at least 24px to provide "visual breathing room" amidst dense data.

## Elevation & Depth

To maintain a clean, institutional look, this design system avoids heavy shadows and skeuomorphism. Instead, it relies on **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** The base layer uses `#F8FAFC`.
- **Level 1 (Cards/Surface):** White surfaces (`#FFFFFF`) with a 1px border of `#E2E8F0`. This is the primary container for forms and tables.
- **Level 2 (Interaction):** Subtle, ambient shadows are reserved for floating elements like dropdown menus and tooltips. Use a soft 10% opacity black with a 12px blur and 4px offset.
- **Level 3 (Modals):** High-contrast overlays (40% opacity black) are used to dim the background, bringing focus to critical action dialogs.

Depth is primarily communicated through color shifts (e.g., a slightly darker gray for a hovered table row) rather than physical elevation.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern touch while retaining the structural "seriousness" required for a government system. 

- **Buttons & Inputs:** 4px (`rounded-sm`) corner radius.
- **Cards & Containers:** 8px (`rounded-lg`) corner radius to clearly define content areas.
- **Feedback Tags/Chips:** Fully rounded (pill-shaped) to distinguish them from interactive buttons.

This consistent use of soft corners helps the UI feel approachable without appearing overly casual or "playful."

## Components

### Buttons
- **Primary:** Solid Deep Blue (`#1D3D81`) with white text. High emphasis.
- **Secondary:** Solid Vibrant Green (`#79B933`) with white text. Reserved for "Success" or "Create" actions.
- **Outline:** 1px border of Blue or Gray for secondary navigation actions.

### Data Tables
- **Header:** Light gray background (`#F1F5F9`) with `label-md` bold text.
- **Rows:** Alternating "zebra" stripes are optional, but a 1px bottom border is required.
- **Density:** Rows should have a height of 48px to accommodate touch and improve legibility.

### Forms & Inputs
- **Inputs:** 1px border (`#E2E8F0`). On focus, the border shifts to Deep Blue with a subtle 2px outer glow.
- **Labels:** Always positioned above the field for maximum accessibility.
- **Error States:** Use `#991B1B` for both the border and the helper text below the field.

### Navigation
- **Sidebar (Internal):** Deep Blue background with white icons. Active states should use a high-contrast Green indicator or a light blue background tint.
- **Breadcrumbs:** Required on all internal pages to assist with deep hierarchical navigation in the education system.

### Cards
- Used for dashboard summaries (e.g., "Total Students," "Pending Evaluations"). Use large `headline-md` typography for the primary metric and a `label-md` for the description.