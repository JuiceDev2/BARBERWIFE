'use client'

import { useEffect, useRef, useState } from 'react'
import type { FaqCategoria } from '@/lib/chatbot/faq-data'

interface ChatMessage {
  id: string
  from: 'bot' | 'user'
  text: string
}

interface ChatbotFAQProps {
  nombreSalon: string
  telefono?: string | null
  faqData: FaqCategoria[]
}

type Modo = { tipo: 'categorias' } | { tipo: 'preguntas'; categoriaId: string }

let contador = 0
function nuevoId() {
  contador += 1
  return `msg-${Date.now()}-${contador}`
}

export default function ChatbotFAQ({ nombreSalon, telefono, faqData }: ChatbotFAQProps) {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState<ChatMessage[]>([])
  const [modo, setModo] = useState<Modo>({ tipo: 'categorias' })
  const finRef = useRef<HTMLDivElement>(null)

  // Mensaje de bienvenida al abrir por primera vez
  useEffect(() => {
    if (abierto && mensajes.length === 0) {
      setMensajes([
        {
          id: nuevoId(),
          from: 'bot',
          text: `¡Hola! 👋 Soy el asistente virtual de ${nombreSalon}. Elige un tema para ver las preguntas frecuentes.`,
        },
      ])
    }
  }, [abierto, mensajes.length, nombreSalon])

  // Auto-scroll al final cada vez que hay mensajes nuevos
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes, modo])

  function agregarMensaje(msg: Omit<ChatMessage, 'id'>) {
    setMensajes(prev => [...prev, { ...msg, id: nuevoId() }])
  }

  function elegirCategoria(cat: FaqCategoria) {
    agregarMensaje({ from: 'user', text: `${cat.emoji} ${cat.etiqueta}` })
    setTimeout(() => {
      agregarMensaje({ from: 'bot', text: '¿Cuál de estas preguntas quieres ver?' })
    }, 150)
    setModo({ tipo: 'preguntas', categoriaId: cat.id })
  }

  function elegirPregunta(categoria: FaqCategoria, itemId: string) {
    const item = categoria.items.find(i => i.id === itemId)
    if (!item) return
    agregarMensaje({ from: 'user', text: item.pregunta })
    setTimeout(() => {
      agregarMensaje({ from: 'bot', text: item.respuesta })
      setTimeout(() => {
        agregarMensaje({ from: 'bot', text: '¿Te ayudo con algo más?' })
      }, 300)
    }, 150)
  }

  function volverACategorias() {
    setModo({ tipo: 'categorias' })
  }

  function reiniciar() {
    setMensajes([])
    setModo({ tipo: 'categorias' })
  }

  const categoriaActiva =
    modo.tipo === 'preguntas' ? faqData.find(c => c.id === modo.categoriaId) ?? null : null

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierto(v => !v)}
        aria-label={abierto ? 'Cerrar chat de ayuda' : 'Abrir chat de ayuda'}
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{
          width: 58,
          height: 58,
          background: 'var(--color-salon-700)',
          color: 'white',
        }}
      >
        <span style={{ fontSize: 26 }}>{abierto ? '✕' : '💬'}</span>
      </button>

      {/* Ventana del chat */}
      {abierto && (
        <div
          className="fixed z-50 flex flex-col bg-white shadow-2xl"
          style={{
            bottom: 88,
            right: 20,
            width: 'min(360px, calc(100vw - 40px))',
            height: 'min(520px, calc(100vh - 140px))',
            borderRadius: 16,
            border: '1px solid var(--color-warm-300)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: 'var(--color-salon-700)', color: 'white' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>✂</span>
              <div>
                <p className="text-sm font-semibold leading-tight">{nombreSalon}</p>
                <p className="text-xs opacity-80 leading-tight">Asistente de preguntas frecuentes</p>
              </div>
            </div>
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar chat"
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Mensajes */}
          <div
            className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2"
            style={{ background: 'var(--color-warm-100)' }}
          >
            {mensajes.map(m => (
              <div
                key={m.id}
                className="max-w-[85%] px-3 py-2 text-sm whitespace-pre-line"
                style={{
                  alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
                  background: m.from === 'user' ? 'var(--color-salon-700)' : 'white',
                  color: m.from === 'user' ? 'white' : 'var(--color-warm-900)',
                  border: m.from === 'user' ? 'none' : '1px solid var(--color-warm-300)',
                  borderRadius: 12,
                  borderBottomRightRadius: m.from === 'user' ? 2 : 12,
                  borderBottomLeftRadius: m.from === 'bot' ? 2 : 12,
                }}
              >
                {m.text}
              </div>
            ))}
            <div ref={finRef} />
          </div>

          {/* Opciones rápidas */}
          <div
            className="px-3 py-3 border-t flex flex-col gap-2"
            style={{ borderColor: 'var(--color-warm-300)', background: 'white', maxHeight: 190, overflowY: 'auto' }}
          >
            {modo.tipo === 'categorias' && (
              <>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-warm-500)' }}>
                  Temas disponibles
                </p>
                <div className="flex flex-wrap gap-2">
                  {faqData.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => elegirCategoria(cat)}
                      className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      style={{
                        border: '1px solid var(--color-salon-300)',
                        color: 'var(--color-salon-800)',
                        background: 'var(--color-salon-50)',
                      }}
                    >
                      {cat.emoji} {cat.etiqueta}
                    </button>
                  ))}
                </div>
              </>
            )}

            {modo.tipo === 'preguntas' && categoriaActiva && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium" style={{ color: 'var(--color-warm-500)' }}>
                    {categoriaActiva.emoji} {categoriaActiva.etiqueta}
                  </p>
                  <button
                    onClick={volverACategorias}
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-salon-700)' }}
                  >
                    ← Ver todos los temas
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {categoriaActiva.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => elegirPregunta(categoriaActiva, item.id)}
                      className="text-left text-xs font-medium px-3 py-2 rounded-lg transition-colors"
                      style={{
                        border: '1px solid var(--color-warm-300)',
                        color: 'var(--color-warm-800)',
                        background: 'var(--color-warm-100)',
                      }}
                    >
                      {item.pregunta}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div
              className="flex items-center justify-between pt-2 mt-1"
              style={{ borderTop: '1px solid var(--color-warm-200)' }}
            >
              <button onClick={reiniciar} className="text-xs" style={{ color: 'var(--color-warm-500)' }}>
                Reiniciar chat
              </button>
              {telefono && (
                <a href={`tel:${telefono}`} className="text-xs font-medium" style={{ color: 'var(--color-salon-700)' }}>
                  📞 Llamar al salón
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
