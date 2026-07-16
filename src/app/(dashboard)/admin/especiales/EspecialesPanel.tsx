'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Cita } from '@/types'
import { formatPeso, formatFecha, cn, ESTADO_CITA_FLUJO_LABELS, ESTADO_CITA_FLUJO_COLORS } from '@/lib/utils'

interface Props {
  citasIniciales: Cita[]
}

export default function EspecialesPanel({ citasIniciales }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [verId, setVerId] = useState<string | null>(null)
  const [aprobarId, setAprobarId] = useState<string | null>(null)
  const [precioTotal, setPrecioTotal] = useState(0)
  const [anticipo, setAnticipo] = useState(0)
  const [notasAdmin, setNotasAdmin] = useState('')
  const [editarNotasId, setEditarNotasId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function registrarHistorial(citaId: string, evento: string, detalle?: Record<string, unknown>) {
    await supabase.rpc('registrar_historial_cita', {
      p_cita_id: citaId,
      p_evento: evento,
      p_detalle: detalle ?? null,
    })
  }

  function abrirAprobar(c: Cita) {
    setAprobarId(c.id)
    setPrecioTotal(c.precio_total ?? 0)
    setAnticipo(c.anticipo ?? 0)
  }

  async function confirmarAprobar(citaId: string) {
    if (precioTotal <= 0) { toast.error('Captura el precio total'); return }
    if (anticipo > precioTotal) { toast.error('El anticipo no puede ser mayor al precio total'); return }

    setSaving(true)
    const { error } = await supabase
      .from('citas')
      .update({
        precio_total: precioTotal,
        anticipo,
        estado_cita: 'pendiente_anticipo',
      })
      .eq('id', citaId)

    if (!error) {
      await registrarHistorial(citaId, 'costo_asignado', { precio_total: precioTotal, anticipo })
    }

    setSaving(false)
    if (error) { toast.error('Error al aprobar'); return }
    toast.success('Servicio aprobado — anticipo pendiente')
    setAprobarId(null)
    router.refresh()
  }

  async function rechazar(c: Cita) {
    if (!confirm(`¿Rechazar la solicitud de ${c.cliente?.nombre ?? 'este cliente'}?`)) return

    setSaving(true)
    const { error } = await supabase
      .from('citas')
      .update({ estado_cita: 'cancelada' })
      .eq('id', c.id)

    if (!error) await registrarHistorial(c.id, 'solicitud_rechazada')

    setSaving(false)
    if (error) { toast.error('Error al rechazar'); return }
    toast.success('Solicitud rechazada')
    router.refresh()
  }

  async function marcarAnticipoRecibido(c: Cita) {
    setSaving(true)
    const { error } = await supabase
      .from('citas')
      .update({ estado_cita: 'confirmada' })
      .eq('id', c.id)

    if (!error) await registrarHistorial(c.id, 'anticipo_recibido')

    setSaving(false)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success('Anticipo marcado como recibido — cita confirmada')
    router.refresh()
  }

  function abrirEditarNotas(c: Cita) {
    setEditarNotasId(c.id)
    setNotasAdmin(c.notas_admin ?? '')
  }

  async function guardarNotas(citaId: string) {
    setSaving(true)
    const { error } = await supabase
      .from('citas')
      .update({ notas_admin: notasAdmin.trim() || null })
      .eq('id', citaId)

    setSaving(false)
    if (error) { toast.error('Error al guardar notas'); return }
    toast.success('Notas actualizadas')
    setEditarNotasId(null)
    router.refresh()
  }

  if (citasIniciales.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>
          No hay Servicios Especiales por revisar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {citasIniciales.map(c => (
        <div key={c.id} className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-salon-800)' }}>
                ✨ {c.cliente?.nombre ?? 'Cliente'}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-warm-600)' }}>
                {c.servicio?.nombre} · {c.municipio?.nombre ?? 'Sin municipio'}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>
                {formatFecha(c.fecha_hora)}
              </p>
            </div>
            <span className={cn('badge whitespace-nowrap', ESTADO_CITA_FLUJO_COLORS[c.estado_cita])}>
              {ESTADO_CITA_FLUJO_LABELS[c.estado_cita] ?? c.estado_cita}
            </span>
          </div>

          {/* Ver detalle */}
          {verId === c.id && (
            <div className="mt-4 pt-4 border-t text-sm space-y-1" style={{ borderColor: 'var(--color-warm-200)' }}>
              <p><strong>Teléfono:</strong> {c.cliente?.telefono ?? '—'}</p>
              <p><strong>Dirección:</strong> {c.calle ?? '—'} {c.numero_exterior ?? ''} {c.numero_interior ? `Int. ${c.numero_interior}` : ''}</p>
              <p><strong>Referencias:</strong> {c.referencias ?? '—'}</p>
              <p><strong>Notas del cliente:</strong> {c.notas ?? '—'}</p>
              <p><strong>Notas internas:</strong> {c.notas_admin ?? '—'}</p>
              {c.precio_total != null && (
                <p><strong>Precio:</strong> {formatPeso(c.precio_total)} · Anticipo: {formatPeso(c.anticipo)} · Saldo: {formatPeso(c.saldo_pendiente)}</p>
              )}
            </div>
          )}

          {/* Editar notas internas */}
          {editarNotasId === c.id && (
            <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: 'var(--color-warm-200)' }}>
              <label className="label">Notas internas</label>
              <textarea
                className="input"
                rows={2}
                style={{ resize: 'none' }}
                value={notasAdmin}
                onChange={e => setNotasAdmin(e.target.value)}
                placeholder="Solo visibles para el equipo"
              />
              <div className="flex gap-2 justify-end">
                <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => setEditarNotasId(null)}>Cancelar</button>
                <button className="btn-primary text-xs px-3 py-1.5" onClick={() => guardarNotas(c.id)} disabled={saving}>
                  {saving ? '…' : 'Guardar notas'}
                </button>
              </div>
            </div>
          )}

          {/* Aprobar */}
          {aprobarId === c.id && (
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4" style={{ borderColor: 'var(--color-warm-200)' }}>
              <div>
                <label className="label">Precio total *</label>
                <input className="input" type="number" min={0} step="0.01"
                  value={precioTotal} onChange={e => setPrecioTotal(+e.target.value)} />
              </div>
              <div>
                <label className="label">Anticipo</label>
                <input className="input" type="number" min={0} step="0.01"
                  value={anticipo} onChange={e => setAnticipo(+e.target.value)} />
              </div>
              <div className="col-span-2 flex gap-2 justify-end">
                <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => setAprobarId(null)}>Cancelar</button>
                <button className="btn-primary text-xs px-3 py-1.5" onClick={() => confirmarAprobar(c.id)} disabled={saving}>
                  {saving ? 'Guardando…' : 'Confirmar aprobación'}
                </button>
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2" style={{ borderColor: 'var(--color-warm-200)' }}>
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setVerId(verId === c.id ? null : c.id)}>
              {verId === c.id ? 'Ocultar' : 'Ver'}
            </button>
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => abrirEditarNotas(c)}>
              Editar
            </button>

            {c.estado_cita === 'pendiente_validacion' && (
              <>
                <button className="btn-primary text-xs px-3 py-1.5" onClick={() => abrirAprobar(c)}>
                  Aprobar
                </button>
                <button
                  className="text-xs px-3 py-1.5 rounded-lg border font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  onClick={() => rechazar(c)}
                  disabled={saving}
                >
                  Rechazar
                </button>
              </>
            )}

            {c.estado_cita === 'pendiente_anticipo' && (
              <button className="btn-primary text-xs px-3 py-1.5" onClick={() => marcarAnticipoRecibido(c)} disabled={saving}>
                Marcar anticipo recibido
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}