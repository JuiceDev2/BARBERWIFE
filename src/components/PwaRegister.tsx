'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker (public/sw.js) al cargar la app.
 * No renderiza nada visible.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    // Registrar cuando la página termine de cargar, para no competir
    // por ancho de banda/CPU con el primer render.
    const registrar = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Si falla el registro (ej. navegador sin soporte real), la app
        // sigue funcionando normalmente, solo sin capacidades offline.
      })
    }

    if (document.readyState === 'complete') {
      registrar()
    } else {
      window.addEventListener('load', registrar)
      return () => window.removeEventListener('load', registrar)
    }
  }, [])

  return null
}
