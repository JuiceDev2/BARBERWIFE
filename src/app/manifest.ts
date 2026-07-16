import type { MetadataRoute } from 'next'
import { BRAND_COLOR, BRAND_BACKGROUND } from '@/lib/theme'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Estética Unisex Alejandra',
    short_name: 'Estética Alejandra',
    description: 'Agenda tu cita en segundos. Sin registro, sin complicaciones.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: BRAND_BACKGROUND,
    theme_color: BRAND_COLOR,
    lang: 'es-MX',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
