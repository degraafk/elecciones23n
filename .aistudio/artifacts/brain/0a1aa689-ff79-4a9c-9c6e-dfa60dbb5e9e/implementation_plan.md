# Elecciones Generales: Optimizador & Simulador de Escaños

High-performance, fluid redesign and optimization of the Spanish General Election simulator (Congreso de los Diputados and Senado) built for zero-lag 60fps execution and seamless deployment on Vercel.

## User Review & Critical Decisions

> [!IMPORTANT]
> The confirmed choices from user clarification:
> - **Visual Style & Theme**: Preserve the exact existing editorial aesthetic (warm minimal off-white background `#fafaf8`, `#17171a` typography, refined borders, and authentic party color accents).
> - **Table Arrangement**: Fluid, responsive table layout with instant search filtering and optimized virtualized/memoized rendering to guarantee zero frame drops.
> - **Presets**: Focus purely on the official default scenario and blank reset as requested.

---

### 1. Overview & Core Concept

- **What It Does**: An interactive political simulator for the Spanish Parliament (*Congreso de los Diputados* - 350 seats across 52 provinces) and Senate (*Senado* - 209 direct seats across 60 constituencies). Users can customize seat distributions, test pacts and coalitions against constitutional majorities (176 and 133 seats), and inspect province winners rendered visually on a detailed vector map.
- **Root Cause of Existing Lag**:
  1. The original HTML recomputed and manually queried 780+ DOM input elements and 350+ SVG circles on every input keystroke, destroying and rebuilding innerHTML repeatedly.
  2. Unthrottled DOM reflows and unmemoized SVG polygon fills caused heavy paint stalls.
  3. Lack of React component boundaries meant every single button click recalculated the entire document.
- **Optimization Strategy**: Rebuilding with React 19 + TypeScript + Vite + Tailwind CSS. All mathematical calculations (totals, unassigned seats, province winners, majority checks) are memoized via `useMemo`. Interactive components use targeted local state and requestAnimationFrame batching, achieving buttery 60fps responsiveness on Vercel.

---

### 2. User Experience & Visual Design

- **Design System & Palette (Exact Preservation)**:
  - Base background: `#ffffff` & `#fafaf8`
  - Text & ink: `#17171a` (deep charcoal), `#77756d` (neutral muted)
  - Borders & hairlines: `#e9e7e0`
  - Map land fill: `#eeeae1` with crisp white province boundaries
  - Party tokens: PP (`#0b5ea8`), PSOE (`#e30613`), Vox (`#5fb02e`), Sumar/FA (`#85739a`), Podemos (`#8f63f0`), ERC (`#f5a623`), Junts (`#1ec1b0`), EH Bildu (`#c8d82a`), PNV (`#0f6b3a`), BNG (`#7fb2e5`), CC (`#ffd800`), UPN (`#7b4f2c`), Compromís (`#ef8a4f`), Adelante Andalucía (`#8fdb98`), AHI (`#7a4fa3`), ASG (`#d9528a`), Otros (`#8a8a80`).
- **Interactive Feedback & Fluid Motion**:
  - **Animated Majority Bar**: Smooth transitions (`cubic-bezier(0.16, 1, 0.3, 1)`) for party width changes and majority marker tick.
  - **Coalition Chips**: Clickable interactive chips with scale micro-feedback (`active:scale-95`), dynamic party badge tints, and real-time gap-to-majority indicators.
  - **Victory State**: Dynamic celebration trigger when a coalition reaches 176 (Congreso) or 133 (Senado), featuring lightweight CSS particle bursts without canvas frame drops.
  - **Map & Table Bidirectional Hover**: Hovering a province in the map or in the table instantly highlights the corresponding province polygon and seat dots with zero delay.
  - **Excel Clipboard Pasting**: Smooth multi-cell paste (Ctrl+V / Cmd+V) directly from desktop spreadsheet software.

---

### 3. Key Technical Decisions & Trade-Offs

- **Framework**: Modern React 19 on Vite. Compiles to static output (`dist/`) that deploys with instant edge latency on Vercel without requiring complex server runtimes.
- **State Architecture**:
  - Normalized scenario store containing seats per province by party code.
  - Granular province row rendering: only rows modified by an edit re-render; totals and coalition meters use memoized derived state.
  - `localStorage` persistence with debounced sync prevents disk thrashing while preserving user work across sessions.
- **Export & Import Engine**:
  - Modern client-side `xlsx` bundle for `.xlsx` export/import.
  - Lightweight pure RFC-4180 CSV serializer for `.csv` export.
  - Clean standalone SVG vector exporter with embedded styles and metadata for graphic design workflows.

---

### 4. Technical Architecture & System Diagram

```
┌───────────────────────────────────────────────────────────┐
│                       App Container                       │
│  - Mode Switch (Congreso 350 / Senado 209)               │
│  - Scenario State (Base, Custom, Empty, LocalStorage)     │
└───────────────┬───────────────────────────┬───────────────┘
                │                           │
    ┌───────────▼──────────┐    ┌───────────▼───────────┐
    │     SVG Vector Map   │    │  Coalition & Overview │
    │ - 52/60 Provinces    │    │ - Majority Bar (176)  │
    │ - Province Win Tint  │    │ - Selected Party Chips│
    │ - Seat Circles Grid  │    │ - Real-time Sum Count │
    │ - Ceuta/Melilla/Can. │    │ - Victory State FX    │
    └───────────┬──────────┘    └───────────┬───────────┘
                │                           │
                └─────────────┬─────────────┘
                              │
                ┌─────────────▼─────────────┐
                │   High-Speed Data Grid    │
                │ - Quick Search & Filter   │
                │ - Stepper Controls (+ / -)│
                │ - Direct Numeric Input    │
                │ - Excel Paste Listener    │
                │ - Full / Over Allocation  │
                └───────────────────────────┘
```

### 5. Step-by-Step Execution Plan

1. **Project Configuration & Dependencies**:
   - Ensure `xlsx` is installed for seamless Excel export/import.
   - Configure Tailwind and metadata for Vercel deployment.
2. **Data & Geometry Modeling**:
   - Extract and organize the exact SVG province paths, seat coordinates, party definitions, and baseline figures into strongly-typed TypeScript modules (`src/data/parliament.ts`).
3. **Core Reactive Simulator Components**:
   - Build `ParliamentMap.tsx`: Vector SVG renderer with memoized province tinting and seat dot fill.
   - Build `CoalitionBuilder.tsx`: Pact calculator with animated threshold progress bar and celebratory particles.
   - Build `SeatsTable.tsx`: Optimized high-density table with search filter, keyboard paste parser, and stepper inputs.
   - Build `ExportToolbar.tsx`: Excel (.xlsx), CSV, and SVG download handlers, file upload reader, and reset triggers.
4. **Integration & Performance Verification**:
   - Verify 60fps fluidity during rapid typing, bulk pastes, and switching modes.
   - Test build with `compile_applet`.
