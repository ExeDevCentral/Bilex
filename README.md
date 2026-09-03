# 📖 Bilex — Traductor de PDFs e Imágenes con Lectura Bilingüe

[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://dualdoc-translate.vercel.app)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?style=for-the-badge&logo=vite)](https://vite.dev/)
[![Tesseract.js](https://img.shields.io/badge/OCR-Tesseract_WASM-blueviolet?style=for-the-badge)](https://tesseract.projectnaptha.com/)

**Bilex** es una aplicación web personal diseñada para traducir documentos completos (PDFs e imágenes) con una **vista dual tipo lectura bilingüe** (original a la izquierda, traducción a la derecha, alineados párrafo a párrafo con scroll sincronizado).

👉 **Live Demo:** [https://dualdoc-translate.vercel.app](https://dualdoc-translate.vercel.app)

---

## ✨ Características Principales

### 1. 📄 Extracción Universal de Documentos
- **PDFs Digitales**: Extracción directa y estructuración de texto con `pdfjs-dist`.
- **PDFs Escaneados**: Detección automática de páginas sin texto, renderizado en alta definición y OCR mediante `tesseract.js` (WebAssembly corriendo 100% en el navegador).
- **Múltiples Fotos / Imágenes (JPG, PNG, WebP)**:
  - Subida simultánea de varias páginas o fotos.
  - Galería interactiva con miniaturas para reordenar páginas (⬅️ / ➡️) antes de procesar.
  - **Compilador Fotos → PDF**: ajusta cada imagen a formato A4 sin distorsión.
  - Opción para descargar directamente el PDF ordenado de fotos sin necesidad de traducir.

### 2. 🌐 Auto-Detección de Idioma
- Detección offline instantánea en el cliente basada en n-gramas usando `franc-min`.
- Muestra el idioma detectado con selector rápido para ajustes manuales.

### 3. 🤖 Motores de Traducción Modulares & Serverless
- Función Serverless en `/api/translate` para proteger las API Keys y evitar bloqueos de CORS.
- Soporte para múltiples proveedores:
  - **Google Gemini API** *(100% Gratis sin tarjeta en Google AI Studio con Gemini 2.0 / 1.5 Flash)*
  - **Groq API** *(100% Gratis ultra-rápido en console.groq.com con Llama 3.3)*
  - **DeepL API** *(500k caracteres/mes)*
  - **OpenAI API** (`gpt-4o-mini`, `gpt-4o`)
  - **Anthropic Claude API** (`claude-3-5-haiku`, `claude-3-5-sonnet`)
  - **LibreTranslate** (instancia pública u hospedada)
  - **Modo Demo / Mock** (traducciones simuladas offline sin costo ni keys)
- Procesamiento en lotes (chunks) para respetar límites de caracteres y cuotas de API.

### 4. 📖 Lector Bilingüe Dual Sincronizado
- Cuadrícula 50/50 responsiva (adaptable a 1 columna en móviles).
- Alineación estricta párrafo a párrafo (`#1`, `#2`, `#3`...).
- Resaltado interactivo simultáneo al hacer clic o pasar el cursor sobre cualquier párrafo.
- Búsqueda y filtrado en tiempo real con contador de coincidencias.
- Controles de zoom de tipografía (12px a 22px).
- **Edición in-situ**: corregí cualquier párrafo traducido a mano y guardalo al instante (badge `Editado`).
- Botones para copiar párrafos individuales o el documento completo.

### 5. 💾 Exportación Multi-Formato
- **PDF Bilingüe a 2 Columnas**: documento A4 listo para imprimir o leer, con encabezado y tabla alineada (`jspdf` + `jspdf-autotable`).
- **PDF Original de Fotos**: descarga el PDF unificado de las imágenes escaneadas.
- **Texto Plano (.txt)**: opciones para solo traducción o intercalado bilingüe.
- **Markdown Bilingüe (.md)**: tabla comparativa para Obsidian, Notion o GitHub.
- **Sesión JSON**: guardá y reanudá tu proyecto en cualquier momento sin volver a traducir.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 19, TypeScript, Vite.
- **Estilos**: Vanilla CSS modular con tema oscuro/claro, tipografía Google Fonts (Inter / Outfit) y micro-interacciones.
- **Iconos**: Lucide React.
- **Extracción de PDF**: `pdfjs-dist` (Mozilla PDF.js).
- **OCR WebAssembly**: `tesseract.js`.
- **Generación de PDFs**: `jspdf` y `jspdf-autotable`.
- **Detección de Idioma**: `franc-min`.
- **Backend Serverless**: Vercel Serverless Functions (`/api/translate`).

---

## 🚀 Inicio Rápido Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/ExeDevCentral/Bilex.git
cd Bilex
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar servidor de desarrollo
```bash
npm run dev
```
Abrí [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## ☁️ Despliegue en Vercel

1. Subí el proyecto a GitHub.
2. Importalo en tu cuenta de [Vercel](https://vercel.com).
3. En **Settings > Environment Variables**, agregá tus claves según el motor que desees:
   - `GEMINI_API_KEY`: Clave de Google AI Studio (gratis).
   - `GROQ_API_KEY`: Clave de Groq (gratis).
   - `DEEPL_API_KEY`: Clave de DeepL API.
   - `OPENAI_API_KEY`: Clave de OpenAI.
   - `ANTHROPIC_API_KEY`: Clave de Anthropic.
4. Desplegá el proyecto. Vercel configurará automáticamente el frontend Vite y el endpoint serverless `/api/translate`.

---

## 🖥️ Crear Acceso Directo de Escritorio (App Nativa en Windows)

Para usar Bilex como si fuera una aplicación instalada (sin barras de navegador ni pestañas):

1. Creá un acceso directo en tu Escritorio.
2. En la ubicación ingresá:
   ```cmd
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=https://dualdoc-translate.vercel.app
   ```
   *(O reemplazá con la ruta a `msedge.exe` si usás Edge)*.
3. Nombralo **Bilex** o **Traductor PDF**.
4. ¡Al hacer doble clic se abrirá directamente en modo ventana limpia!

---

## 📄 Licencia

Desarrollado para uso personal. Distribuido bajo licencia MIT.
