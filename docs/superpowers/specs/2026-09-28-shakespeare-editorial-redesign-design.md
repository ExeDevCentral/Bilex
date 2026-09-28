# Especificación de Diseño: Rediseño Editorial Shakespeariano y Preparación para Producción

**Proyecto:** Bilex — Traductor de Documentos y Lector Bilingüe  
**Fecha:** 28 de septiembre de 2026  
**Rama:** `main` (con repositorio remoto en GitHub: `https://github.com/ExeDevCentral/Bilex.git`)  
**Autor:** Antigravity & ExeDevCentral  

---

## 1. Resumen Ejecutivo y Objetivos

El objetivo de esta intervención es transformar Bilex en una aplicación web de alta calidad estética con temática **Editorial Shakespeariana / Renacentista Clásica ("First Folio")**, optimizando al mismo tiempo su arquitectura para salida a producción:
1. **Identidad Visual Renacentista:** Sustituir la interfaz genérica de software por una estética inspirada en el *First Folio* de 1623, incunables y pergaminos históricos, con tipografías serif de alta legibilidad, filetes de pan de oro, detalles de sellos de cera y paletas duales (*Pergamino Real* y *Cuarto de Medianoche*).
2. **Experiencia de Usuario (UX) Móvil y Responsive:** Convertir el lector dual en una experiencia agradable e inmersiva tanto en pantallas grandes de escritorio como en smartphones y tablets, permitiendo cambiar ágilmente entre el texto original (*Acto I*), la traducción (*Acto II*) o vista intercalada.
3. **Optimización de Producción:** Configurar *code splitting* en Vite para librerías pesadas (PDF.js, Tesseract.js, jsPDF, html2canvas), resolver advertencias de linting, asegurar metadata SEO y garantizar despliegue impecable en Vercel y GitHub.

---

## 2. Sistema de Diseño Shakespeariano (Tokens & Tipografías)

### 2.1 Tipografías (Google Fonts)
- **Títulos y Frontispicios:** `Cinzel` (pesos 600, 700, 800) y `Cinzel Decorative` para sellos y encabezados ceremoniales.
- **Texto Principal y Lectura Bilingüe:** `Cormorant Garamond` (pesos 400, 500, 600) y `EB Garamond` para lectura inmersiva con proporciones áureas renacentistas.
- **Detalles Técnicos y Monospace:** `JetBrains Mono` con acentos de color sepia/dorado para contadores, porcentaje de OCR y botones de herramientas.

### 2.2 Paleta de Colores Dual (`src/styles/variables.css`)

#### A. Modo "Pergamino Real" (Tema de Luz / Pergamino Clásico)
- `--bg-primary`: `#f6f1e5` (tono pergamino con sutil textura de trama vegetal).
- `--bg-secondary`: `#eee7d5` (papel verjurado envejecido).
- `--bg-surface`: `#fffdf9` (superficie de manuscrito iluminada).
- `--bg-surface-elevated`: `#fcf9f2`.
- `--border-subtle`: `#d9c8aa` (filete sepia tenue).
- `--border-focus`: `#b38235` (pan de oro bruñido).
- `--border-gold`: `#c5a059`.
- `--text-main`: `#1e1814` (tinta ferrogálica profunda, contraste óptimo WCAG AAA).
- `--text-muted`: `#5e4f43` (tinta sepia atenuada para anotaciones).
- `--text-dim`: `#857466`.
- `--accent-primary`: `#852230` (carmesí de lacre real).
- `--accent-primary-hover`: `#6b1a26`.
- `--accent-gold`: `#b88a38` (oro renacentista).
- `--pair-active-bg`: `rgba(197, 160, 89, 0.22)` (resaltado dorado sutil de lectura activa).
- `--pair-active-border`: `#b88a38`.

#### B. Modo "Cuarto de Medianoche" (Tema Nocturno / Biblioteca Shakespeariana)
- `--bg-primary`: `#120f0d` (cuero de encuadernación oscuro, madera de roble).
- `--bg-secondary`: `#1a1613` (interior de biblioteca iluminada por candil).
- `--bg-surface`: `#221d19` (tarjeta de madera noble con filete dorado).
- `--bg-surface-elevated`: `#2c2520`.
- `--border-subtle`: `#42372e`.
- `--border-focus`: `#dfb86c`.
- `--border-gold`: `#9b7c3d`.
- `--text-main`: `#f5ede2` (marfil cálido bajo luz de vela).
- `--text-muted`: `#b8a999`.
- `--text-dim`: `#8c7d6e`.
- `--accent-primary`: `#9c2838` (terciopelo carmesí teatral).
- `--accent-gold`: `#dfb86c` (pan de oro iluminado).
- `--pair-active-bg`: `rgba(223, 184, 108, 0.18)` (halo dorado de lectura).
- `--pair-active-border`: `#dfb86c`.

### 2.3 Elementos Gráficos y Motivos Shakespearianos
- **Doble fileteado:** Marcos de lectura y tarjetas rodeados por un borde exterior fino y una línea interior dorada tenue.
- **Orlas decorativas:** Iconos temáticos (pluma de ave *quill*, libro encuadernado, pergamino, candelabro).
- **Sellos de cera:** Insignias de procesamiento, estado y etiquetas de idioma presentadas como lacres medievales.

---

## 3. Rediseño de Componentes

### 3.1 Encabezado (`src/components/Header.tsx`)
- Logo: **BILEX** en mayúsculas clásicas con tipografía *Cinzel* y florón renacentista sutil.
- Subtítulo editorial: *"Traductor Bilingüe de Tomos y Códices"*.
- Selector de tema conmutador (*Pergamino Real* vs *Cuarto de Medianoche*) con iconos alegóricos (Sol de Alquimista / Lámpara de Aceite).
- Menú de acciones con estilo de botones de encuadernador con relieve y bordes de latón antiguo.

### 3.2 Umbral de Carga (`src/components/DropzoneUpload.tsx`)
- Diseño de tomo encuadernado en piel con cantos dorados y esquinas metálicas.
- Selector de proveedor (Gemini, Groq, Ollama, LibreTranslate, DeepL) presentado como scriptorium / escriba asignado.
- Píldoras de configuración rápida con textura de pergamino y sellos de aprobación.

### 3.3 El Escenario Bilingüe (`src/components/DualReader.tsx`)
- Estructura visual de dos páginas abiertas de un mismo códice:
  - Lado Izquierdo: *Acto I — Texto Original*.
  - Lado Derecho: *Acto II — Traducción al Español*.
- Párrafos sincronizados con números de estrofa/verso clásicos en números romanos o serif discreto.
- Barra de herramientas editorial flotante:
  - Selector de tamaño de letra tipográfico (Corpus: 14px, 16px, 18px, 20px, 22px).
  - Selector de fuente de lectura (`Cormorant Garamond` vs `Inter` moderno).
  - Botón de pantalla completa y modo teatro.
  - Indicador de página con numeración editorial (*Folio IV de XXIV*).

### 3.4 Modales (`SettingsModal.tsx` & `ExportModal.tsx`)
- Formato de compendio / pliego oficial con sello de lacre en la cabecera.
- Pestañas de configuración como separadores de libro con cinta de tela.
- Previsualización de exportación a PDF bilingüe con estilo de maquetación clásica.

---

## 4. Experiencia Responsive & Lectura en Móviles y Tablets

1. **Segmented Switch para Móviles:**
   - En pantallas menores a `768px`, las dos columnas no se comprimen de forma ilegible; se activa una barra de navegación fija superior o flotante con tres vistas:
     - **Original (Acto I):** Vista completa del documento fuente con paginación fluida.
     - **Traducción (Acto II):** Vista completa traducida para lectura continua.
     - **Intercalado:** Cada párrafo original inmediatamente seguido por su traducción en un pliego unificado.
2. **Controles Táctiles Adaptados:**
   - Botones de tamaño mínimo de 44x44px según directrices de accesibilidad móvil.
   - Paginador inferior estilo cinta de pergamino flotante con gestos táctiles y botones grandes.
3. **Modales a Pantalla Completa:**
   - En móviles, los modales se abren como *Bottom Sheets* o pliegos completos con barra de cierre accesible.

---

## 5. Optimizaciones de Producción & Despliegue

1. **Code Splitting Inteligente (`vite.config.ts`):**
   - Agrupar `pdfjs-dist` en un chunk aislado (`vendor-pdfjs`).
   - Agrupar `tesseract.js` en un chunk aislado (`vendor-tesseract`).
   - Agrupar `jspdf`, `jspdf-autotable` y `html2canvas` en un chunk de exportación (`vendor-export`).
   - Reducir el chunk principal de más de 1.1 MB a menos de 200 kB para una carga inicial ultrarrápida.
2. **Corrección de Linter:**
   - Corregir los escapes innecesarios de expresiones regulares en `src/services/paragraphParser.ts` detectados por `oxlint`.
3. **Configuración Vercel & PWA:**
   - Verificar `vercel.json` con encabezados de seguridad (CSP, X-Content-Type-Options, Cache-Control para assets inmutables).
   - Comprobar que los assets de OCR y workers de PDF carguen sin problemas de CORS en producción.

---

## 6. Plan de Verificación

1. **Compilación de Producción:** Ejecutar `npm run build` y comprobar que no existan advertencias de chunks gigantes o errores de TypeScript.
2. **Validación de Linter:** Ejecutar `npm run lint` asegurando 0 errores y 0 advertencias.
3. **Prueba Visual en Navegador:** Validar con el navegador la alternancia fluida entre el modo *Pergamino Real* y *Cuarto de Medianoche*, la alineación del lector dual, y la vista móvil en anchos de pantalla reducidos (390px, 768px, 1280px).
4. **Git Remote Sync:** Comprobar que todos los cambios se versionen limpiamente para ser desplegados en el repositorio GitHub `ExeDevCentral/Bilex`.
