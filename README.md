<div align="center">

# Bilex
### *Bilingual Document Ingestion, WebAssembly OCR Pipeline & Synchronized Dual-Stream Reading Engine*

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Production_Live-black?style=for-the-badge&logo=vercel)](https://bilex-tau.vercel.app)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6.x_Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8.x_ESM-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![WebAssembly OCR](https://img.shields.io/badge/OCR-Tesseract_WASM_v7-8A2BE2?style=for-the-badge)](https://tesseract.projectnaptha.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](https://opensource.org/licenses/MIT)

<p align="center">
  <b>An in-browser computational linguistic environment providing client-side optical character recognition, n-gram lexical classification, LLM translation dispatch, and dual-column AST-aligned parallel text visualization.</b>
</p>

[**Explore Live System**](https://bilex-tau.vercel.app) • [**Architecture**](#1-architectural-taxonomy) • [**Linguistic Engine**](#2-linguistic-processing--ast-alignment) • [**Deployment**](#5-deployment--serverless-orchestration)

---

</div>

## 1. Architectural Taxonomy

**Bilex** addresses the fundamental challenge of asymmetric cross-lingual document comprehension. Traditional translation workflows sever structural correspondence, discarding layout telemetry and paragraph cohesion. 

Bilex implements an end-to-end, browser-orchestrated pipeline where ingested documents—ranging from clean native vector PDFs to degraded multi-page raster scans—undergo optical rasterization, client-side WebAssembly character recognition, language inference, token chunking, and dual-pane parallel synchronization.

```
┌────────────────────────────────────────────────────────────────────────┐
│                     DOCUMENT INGESTION & PARSING                       │
│  [Vector PDF] ──────────► [pdfjs-dist TextStream]                      │
│  [Scanned Image/Photos] ─► [HTML5 Canvas Rasterizer] ─► [Tesseract WASM]│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                STATISTICAL INFERENCE & CHUNK DISPATCH                  │
│       • n-gram frequency classification via `franc-min`                │
│       • Paragraph segmentation & token boundary indexing               │
│       • Rate-limited LLM API batching (Gemini, Groq, DeepL, OpenAI)    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│            PARALLEL READ INTERFACE & VECTOR EXPORT                     │
│  Dual-pane synchronized scroll │ In-situ AST mutation │ B-Tree search  │
│  Export to dual-column A4 PDF (`jspdf-autotable`), Markdown, or JSON   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Linguistic Processing & AST Alignment

### 2.1. Client-Side WASM Optical Character Recognition (OCR)
For scanned inputs and multi-image raster uploads (PNG, JPEG, WebP), Bilex executes a zero-server-hop extraction pipeline:
- **Off-Screen Canvas Rasterization:** Images are normalized into strict DIN A4 aspect ratios without geometric distortion.
- **Tesseract WebAssembly Runtime:** Multithreaded neural network OCR executes entirely within browser workers, eliminating confidential document transit over public networks.

### 2.2. N-Gram Frequency Language Identification
Prior to translation dispatch, source text fragments undergo classification via trigram frequency profiling:
$$\mathcal{L}^* = \arg\max_{\mathcal{L}} \sum_{i=1}^{k} \omega_i \cdot \log P(\tau_i \mid \mathcal{L})$$
Executing client-side with minimal memory overhead ($\le 12 \text{ KB}$ runtime dictionary), guaranteeing sub-millisecond source language detection.

### 2.3. Resilient Token Chunking & API Gateways
To adhere to LLM context-window limits and rate allocations, large documents are partitioned using deterministic paragraph-boundary chunking:
- **Serverless Relay (`/api/translate`):** Eliminates CORS vulnerability and masks upstream credentials.
- **Pluggable Translation Adapters:**
  - **Google Gemini API** (`gemini-2.0-flash`, `gemini-1.5-flash`)
  - **Groq Llama Inference Engine** (`llama-3.3-70b-versatile`)
  - **DeepL Neural Engine**
  - **OpenAI Platform** (`gpt-4o-mini`, `gpt-4o`)
  - **Anthropic Claude Engine** (`claude-3-5-sonnet`)
  - **Deterministic Mock Runtime** (offline academic testing without external egress)

---

## 3. Parallel Dual-Stream Reader Subsystem

The presentation layer enforces isomorphic structural parity between source and target text:
- **1-to-1 Index Correlation:** Paragraph tokens maintain strict index preservation ($\text{Src}_i \iff \text{Dst}_i$).
- **Bidirectional Event Highlighting:** Hover and focus states synchronize bounding viewports, maintaining contextual visual grounding across languages.
- **In-Situ Mutation:** Immediate client-side re-editing with visual state demarcation (`Edited` audit tag).
- **Sub-Linear Search Filtering:** Real-time token search with instant occurrence counters across parallel panes.

---

## 4. Multi-Modal Export Subsystem

Synthesized bilingual corpora can be serialized into four academic and archival formats:

| Format | Engine | Structural Specification |
| :--- | :--- | :--- |
| **Bilingual Dual-Column PDF** | `jspdf` + `jspdf-autotable` | Formal A4 pagination with dual-column juxtaposed grid |
| **Normalized Unified PDF** | Native Canvas / PDF compilation | Reordered, non-distorted image compilation |
| **Comparative Markdown (`.md`)** | AST Table Serializer | Ready for knowledge graphs (Obsidian, Notion, GitHub) |
| **Interleaved Plaintext (`.txt`)**| Dynamic Streamer | Raw translation or alternating bilingual blocks |
| **State Snapshot (`.json`)** | JSON Serialization | Full project state persistence for zero-cost resumption |

---

## 5. Deployment & Serverless Orchestration

### Prerequisites
- **Node.js**: $\ge 20.x$
- **Vite Runtime Engine**: $\ge 8.x$

### Local Engineering Sandbox
```bash
# Clone the repository
git clone https://github.com/ExeDevCentral/Bilex.git
cd Bilex

# Install dependencies deterministically
npm install

# Launch development environment
npm run dev
```

### Serverless Environment Configuration
When orchestrating deployment via **Vercel**, inject designated environment variables according to provider selection:

```env
GEMINI_API_KEY="AIzaSy..."
GROQ_API_KEY="gsk_..."
DEEPL_API_KEY="..."
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## 6. Verification & Quality Metrics

The codebase enforces strict static type safety under TypeScript strict mode and automated code analysis with **Oxlint**:

```bash
# Execute static type validation
npx tsc -b

# Run static AST linting
npm run lint
```

---

## 7. License

Distributed under the **MIT License**. Engineered for privacy-preserving document comprehension.

<div align="center">
  <sub>Developed with linguistic rigor by <a href="https://github.com/ExeDevCentral">ExeDevCentral</a>.</sub>
</div>
