/**
 * Constantes de marca compartidas.
 *
 * El sistema de diseño "vivo" (usado en toda la UI) está en `src/app/globals.css`
 * como variables CSS (--color-salon-*, --color-gold-*). Ese archivo no puede
 * importarse desde metadata de Next.js (manifest.ts, layout.tsx viewport),
 * que se evalúa en build/servidor y necesita valores hex planos.
 *
 * Para evitar tener el mismo hex "hardcodeado" en varios archivos (y que se
 * desincronicen si el color de marca cambia), esos archivos importan estas
 * constantes en lugar de repetir el valor. Si cambia el verde principal en
 * globals.css, solo hay que actualizarlo también aquí.
 */
export const BRAND_COLOR = '#164534' // = --color-salon-800
export const BRAND_BACKGROUND = '#f5faf7' // = --color-salon-50
