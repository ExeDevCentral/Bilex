# Shakespearean Editorial Redesign and Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Bilex into a high-end Shakespearean / Renaissance classical editorial reading and translation web application ("First Folio Dual"), optimize responsive UX for mobile/tablet devices, and configure production-ready code-splitting and linting.

**Architecture:** Refactor CSS design tokens into an authentic dual Renaissance palette (Pergamino Real as warm parchment and Cuarto de Medianoche as dark leather library); introduce Google Fonts (`Cinzel`, `Cormorant Garamond`, `EB Garamond`); upgrade the DualReader with a responsive segmented switch for mobile (Act I: Original, Act II: Translation, Interleaved: Bilingual); isolate heavy libraries (PDF.js, Tesseract.js, jsPDF) using Vite code-splitting chunks.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Google Fonts, Vanilla CSS with custom tokens, oxlint, PDF.js, Tesseract.js, jsPDF.

**Spec:** `docs/superpowers/specs/2026-09-28-shakespeare-editorial-redesign-design.md`

## Global Constraints

- Must preserve all existing translation and OCR functionalities (Gemini, Groq, Ollama, LibreTranslate, DeepL, Tesseract OCR, PDF export).
- Must adhere to WCAG AAA/AA text contrast standards in both Pergamino Real (light) and Cuarto de Medianoche (dark) themes.
- Touch targets on mobile must be at least 44x44px.
- Zero oxlint errors and zero warnings across the codebase.
- No single client JS chunk in Vite production build over 500 kB (except specialized Web Workers).

## Review Focus

1. Mobile viewport (< 768px): DualReader must not horizontally overflow or compress text into unreadable narrow columns; segmented switch must allow seamless toggling between Act I, Act II, and Interleaved views.
2. Theme switching: Toggle between Pergamino Real and Cuarto de Medianoche must immediately update all background, text, borders, and modal styles without flickering.
3. Bundle size & code-splitting: Heavy dependencies (`pdfjs-dist`, `tesseract.js`, `jspdf`, `html2canvas`) must be grouped into dedicated chunks so the initial page load bundle is lean.
4. Linter clean: Unnecessary regex escapes in `paragraphParser.ts` must be eliminated so `oxlint` returns 0 warnings.
5. Contrast & readability: Garamond font sizes and line heights must feel spacious, elegant, and readable during long reading sessions.

---

### Task 1: Fix Linter Warnings & Configure Vite Production Code-Splitting

**Files:**
- Modify: `src/services/paragraphParser.ts:40-45`
- Modify: `vite.config.ts:1-25`
- Test: Run `npm run lint` and `npm run build`

**Interfaces:**
- Consumes: Existing regex patterns in `paragraphParser.ts` and default Vite build config.
- Produces: 0 lint warnings; chunked production output with `vendor-pdfjs`, `vendor-tesseract`, `vendor-export`.

- [ ] **Step 1: Fix regex escape warnings in `src/services/paragraphParser.ts`**
Remove unnecessary escapes `\.` and `\)` inside character classes `[\.\)]`.
Line 42 should become:
```typescript
const isListItem = /^(\d+[.)]|[-*•–—]|[a-zA-Z][.)])\s+/.test(line);
```

- [ ] **Step 2: Run `npm run lint` to verify 0 warnings**
Run: `npm run lint`
Expected: `0 warnings and 0 errors`

- [ ] **Step 3: Configure Vite manualChunks in `vite.config.ts`**
Configure `build.rollupOptions.output.manualChunks` (or Rolldown equivalent for Vite 8):
```typescript
manualChunks(id) {
  if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
  if (id.includes('tesseract.js')) return 'vendor-tesseract';
  if (id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-export';
  if (id.includes('node_modules')) return 'vendor-core';
}
```

- [ ] **Step 4: Run `npm run build` to verify chunk splitting**
Run: `npm run build`
Expected: Chunks split cleanly, no warning about chunks > 500 kB.

- [ ] **Step 5: Commit**
```bash
git add src/services/paragraphParser.ts vite.config.ts
git commit -m "perf: configure Vite code-splitting and fix linter regex warnings"
```

---

### Task 2: Renaissance Typography & Shakespearean Design System (Tokens & Fonts)

**Files:**
- Modify: `index.html:1-18`
- Modify: `src/styles/variables.css:1-114`
- Modify: `src/styles/main.css:1-150`
- Test: Visual check and browser inspector verifying computed font families and color variables.

**Interfaces:**
- Consumes: Google Fonts links (`Cinzel`, `Cinzel Decorative`, `Cormorant Garamond`, `EB Garamond`).
- Produces: CSS custom properties for `--font-heading`, `--font-reading`, `--bg-primary`, `--bg-surface`, `--border-gold`, `--accent-primary` for both `[data-theme="dark"]` and `[data-theme="light"]`.

- [ ] **Step 1: Update `index.html` with Renaissance Google Fonts & Shakespearean Title**
Update `<head>` in `index.html` to load:
```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```
Title: `Bilex — Traductor Shakespeariano de Documentos y Lector Bilingüe`

- [ ] **Step 2: Redesign `src/styles/variables.css`**
Define complete tokens:
- Light theme (`[data-theme="light"]` / Pergamino Real): `#f7f2e7` bg, `#fffdf9` surface, `#1e1814` ink text, `#852230` wax seal crimson, `#b88a38` / `#c5a059` gold filigree.
- Dark theme (`:root` / Cuarto de Medianoche): `#120f0d` bg, `#1c1814` surface, `#f5ede2` candlelight text, `#9c2838` crimson accent, `#dfb86c` gold accents.
- Typography: `--font-heading: 'Cinzel', serif;`, `--font-reading: 'Cormorant Garamond', 'EB Garamond', Georgia, serif;`, `--font-mono: 'JetBrains Mono', monospace;`.
- Add double-border, paper-texture, and wax-seal shadow tokens.

- [ ] **Step 3: Update `src/styles/main.css` with Renaissance ornamental patterns**
Add utility styles:
- `.fleuron-divider`: classic renaissance typographic leaf/fleuron divider (`❧` / `❦`).
- `.filigree-border`: subtle double-line gold leaf border.
- `.wax-seal-badge`: crimson circular badge with embossed gold rim.
- Ensure body uses `--font-reading` with refined 1.65 line-height and smooth scroll.

- [ ] **Step 4: Verify styles and build**
Run: `npm run build`
Expected: Build passes without CSS errors.

- [ ] **Step 5: Commit**
```bash
git add index.html src/styles/variables.css src/styles/main.css
git commit -m "style: implement Shakespearean Renaissance design system and typography tokens"
```

---

### Task 3: Header & Navigation Frontispiece Redesign

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/styles/components.css`
- Test: Responsive header rendering in desktop and mobile viewports.

**Interfaces:**
- Consumes: `theme`, `onToggleTheme`, `onOpenSettings`, `onOpenExport`, `hasDocument`, `onReset`.
- Produces: Refined Renaissance Frontispiece header with classical typography, responsive action triggers, and theme toggle (Sun of Knowledge vs Midnight Candle).

- [ ] **Step 1: Update `src/components/Header.tsx` markup and icons**
- Brand title: `BILEX` with `Cinzel` serif, subtitle: `TRADUCTOR BILINGÜE & LECTOR DE CÓDICES`.
- Theme toggle with Latin/Classic labels: `Pergamino Real` (Sol) / `Cuarto de Medianoche` (Candil).
- Responsive collapsing buttons on mobile (`< 640px` shows compact icon buttons with tooltips, desktop shows full gilded buttons).

- [ ] **Step 2: Update Header CSS in `src/styles/components.css`**
- Apply `.app-header` with double-border bottom in gold leaf (`--border-gold`), subtle aged paper backdrop filter.
- Buttons styled as antique brass/bookbinder clasps with hover glow and focus rings.

- [ ] **Step 3: Test and Verify**
Run: `npm run build`
Expected: Build passes.

- [ ] **Step 4: Commit**
```bash
git add src/components/Header.tsx src/styles/components.css
git commit -m "feat(header): redesign header as Renaissance frontispiece with classic theme toggle"
```

---

### Task 4: Dropzone & Upload Area ("El Umbral del Manuscrito")

**Files:**
- Modify: `src/components/DropzoneUpload.tsx`
- Modify: `src/styles/components.css`
- Test: Upload area presentation, drag & drop state, provider select pill rendering.

**Interfaces:**
- Consumes: Translation options, provider configuration, drag & drop handlers.
- Produces: Illuminated book cover aesthetics, quill icon, wax seal badges for settings pills.

- [ ] **Step 1: Update `src/components/DropzoneUpload.tsx`**
- Main prompt: *"Deposita aquí tu manuscrito o códice"* (Soporta PDF o Imágenes).
- Subtext: *"Traducción verso a verso y párrafo a párrafo con lectura bilingüe sincronizada"*.
- Provider selector styled with quill (`Feather` / `BookOpen` icons) and classical labels (*"Escriba / Motor de Traducción"*).

- [ ] **Step 2: Update Dropzone CSS in `src/styles/components.css`**
- `.dropzone-container` with leather book border, ornate gold corners (`box-shadow` or pseudo-elements).
- Hover state: glowing amber parchment effect.
- Options pills: styled as wax seals and parchment labels with warm tactile feedback.

- [ ] **Step 3: Test and Verify**
Run: `npm run build`
Expected: Build passes.

- [ ] **Step 4: Commit**
```bash
git add src/components/DropzoneUpload.tsx src/styles/components.css
git commit -m "feat(dropzone): style upload portal as an illuminated manuscript with antique touches"
```

---

### Task 5: DualReader Responsive & Immersive Mobile/Desktop Experience

**Files:**
- Modify: `src/components/DualReader.tsx`
- Modify: `src/styles/components.css`
- Test: Dual-column desktop reading, responsive segmented switch in mobile viewport, font size resizing.

**Interfaces:**
- Consumes: `DocumentPair`, active paragraph sync, translation updates.
- Produces:
  - Mobile view selector: `Acto I: Original` | `Acto II: Traducción` | `Intercalado: Bilingüe`.
  - Reading toolbar with font size scaler (14px, 16px, 18px, 20px, 22px), font toggle, and roman numeral page indicators.
  - Scriptorium illuminated paragraph active highlights in gold leaf.

- [ ] **Step 1: Add mobile view state and reading customization to `src/components/DualReader.tsx`**
- Introduce `mobileView: 'original' | 'translated' | 'interleaved'` state.
- Introduce `readingFontSize: number` (default 17) and `readingFontFamily: 'serif' | 'sans'` state.
- Render mobile tab selector on screens `< 768px`.
- Render Interleaved layout when `mobileView === 'interleaved'`: pairing original paragraph and translated paragraph in consecutive gilded cards.
- Add Roman numeral formatter for page display (*Folio I, Folio II, ...*).

- [ ] **Step 2: Style DualReader & Reading Toolbar in `src/styles/components.css`**
- Reading columns: book gutter divider with ornamental fleuron or double line.
- Paragraph cards: classic typography, indentation or dropped capital on opening paragraph, gold active halo on hover/scroll.
- Mobile segmented bar: sticky, parchment pill design with wax-seal highlight.
- Smooth mobile scroll synchronization.

- [ ] **Step 3: Test and Verify**
Run: `npm run build`
Expected: Clean build.

- [ ] **Step 4: Commit**
```bash
git add src/components/DualReader.tsx src/styles/components.css
git commit -m "feat(reader): implement mobile responsive segmented reader, typography controls and folio numbering"
```

---

### Task 6: Modals & Settings Overhaul (SettingsModal & ExportModal)

**Files:**
- Modify: `src/components/SettingsModal.tsx`
- Modify: `src/components/ExportModal.tsx`
- Modify: `src/styles/components.css`
- Test: Modals open smoothly, responsive full screen on mobile, inputs and buttons styled with antique brass and parchment.

**Interfaces:**
- Consumes: Modal props, provider API configurations, PDF export configurations.
- Produces: Renaissance decree / pliego modal cards with ribbon tabs and accessible mobile sheets.

- [ ] **Step 1: Update modal structures in `SettingsModal.tsx` and `ExportModal.tsx`**
- Modal headers with wax seal emblem and classic typography.
- Tab bar as bookmark ribbons.
- Add responsive touch-friendly dismiss buttons.

- [ ] **Step 2: Update modal CSS in `src/styles/components.css`**
- `.modal-backdrop` with deep theater shadow.
- `.modal-card` with double gold filigree borders and parchment background.
- Responsive mobile sheet (`@media (max-width: 640px)`: slides up as full-height parchment sheet with sticky actions).

- [ ] **Step 3: Test and Verify**
Run: `npm run build`
Expected: Build passes.

- [ ] **Step 4: Commit**
```bash
git add src/components/SettingsModal.tsx src/components/ExportModal.tsx src/styles/components.css
git commit -m "style(modals): style settings and export compendiums with antique parchment and mobile sheets"
```

---

### Task 7: End-to-End Build, Lint & Visual Browser Verification

**Files:**
- Test across all modified files.
- Command checks: `npm run lint`, `npm run build`.
- Visual check: verify desktop, tablet, and mobile layouts in browser.

- [ ] **Step 1: Run complete lint check**
Run: `npm run lint`
Expected: 0 errors, 0 warnings.

- [ ] **Step 2: Run complete production build**
Run: `npm run build`
Expected: Success, optimized chunk sizes, zero TypeScript errors.

- [ ] **Step 3: Verify in browser**
Launch preview or dev server, open browser, inspect:
- Theme toggle between Pergamino Real and Cuarto de Medianoche.
- Typography rendering of `Cinzel` and `Cormorant Garamond`.
- Responsive layout at 375px (mobile), 768px (tablet), and 1280px (desktop).
- Upload dropzone and DualReader controls.

- [ ] **Step 4: Commit final verification and clean tree**
```bash
git status
git commit -am "chore: finalize Shakespearean editorial redesign and production verification"
```
