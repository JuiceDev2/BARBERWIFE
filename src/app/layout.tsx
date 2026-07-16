import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import PwaRegister from '@/components/PwaRegister'
import InstallPwaButton from '@/components/InstallPwaButton'
import { BRAND_COLOR } from '@/lib/theme'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: { default: 'Estética Unisex Alejandra', template: '%s | Estética Unisex Alejandra' },
  description: 'Sistema de gestión profesional para estética unisex',
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Estética Unisex Alejandra',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: BRAND_COLOR,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
        <PwaRegister />
        <InstallPwaButton />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontFamily: 'var(--font-geist-sans)', fontSize: '14px' },
          }}
        />
      </body>
    </html>
  )
}
