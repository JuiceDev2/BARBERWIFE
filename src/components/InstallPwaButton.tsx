'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

/**
 * Botón flotante "Instalar app". Solo se muestra en navegadores que
 * soportan el evento beforeinstallprompt (Chrome/Edge/Android) y cuando
 * la app aún no está instalada. En iOS/Safari no existe este evento;
 * ahí la instalación se hace manualmente con "Compartir → Agregar a inicio".
 */
export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [instalando, setInstalando] = useState(false)

  useEffect(() => {
    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    function onAppInstalled() {
      setVisible(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalando(true)
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
    } finally {
      setDeferredPrompt(null)
      setVisible(false)
      setInstalando(false)
    }
  }

  if (!visible) return null

  return (
    <button
      onClick={handleInstall}
      disabled={instalando}
      aria-label="Instalar aplicación"
      className="fixed bottom-5 left-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-sm font-semibold transition-transform hover:scale-105 active:scale-95 disabled:opacity-70"
      style={{ background: 'var(--color-salon-700)', color: 'white' }}
    >
      <span aria-hidden="true">⬇</span>
      {instalando ? 'Instalando…' : 'Instalar app'}
    </button>
  )
}
