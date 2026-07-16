'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Municipio, NuevoMunicipioForm } from '@/types'
import { formatPeso, cn } from '@/lib/utils'

interface Props {
  municipios: Municipio[]
  salonId: string
}

const EMPTY_FORM: NuevoMunicipioForm = { nombre: '', cargo_traslado: 0 }

export default function CoberturaTable({ municipios, salonId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Municipio>>({})
  const [showForm, setShowForm] = useState(false)
  const [newForm, setNewForm] = useState<NuevoMunicipioForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [reordenando, setReordenando] = useState(false)

  // ── Toggle activo ──────────────────────────────────────
  async function toggleActivo(m: Municipio) {
    const { error } = await supabase
      .from('municipios')
      .update({ activo: !m.activo })
      .eq('id', m.id)

    if (error) { toast.error('Error al actualizar'); return }
    toast.success(m.activo ? 'Municipio desactivado (ya no aparece en el wizard)' : 'Municipio activado')
    router.refresh()
  }

  // ── Edición inline ─────────────────────────────────────
  function startEdit(m: Municipio) {
    setEditId(m.id)
    setEditData({ nombre: m.nombre, cargo_traslado: m.cargo_traslado })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { error } = await supabase
      .from('municipios')
      .update({
        nombre:          editData.nombre,
        cargo_traslado:  Number(editData.cargo_traslado),
      })
      .eq('id', id)

    setSaving(false)
    if (error) { toast.error('Error al guardar'); return }
    toast.success('Municipio actualizado')
    setEditId(null)
    router.refresh()
  }

  // ── Reordenar (intercambia el "orden" con el vecino) ───
  async function mover(m: Municipio, direccion: -1 | 1) {
    const ordenados = [...municipios].sort((a, b) => a.orden - b.orden)
    const idx = ordenados.findIndex(x => x.id === m.id)
    const vecino = ordenados[idx + direccion]
    if (!vecino) return

    setReordenando(true)
    const [r1, r2] = await Promise.all([
      supabase.from('municipios').update({ orden: vecino.orden }).eq('id', m.id),
      supabase.from('municipios').update({ orden: m.orden }).eq('id', vecino.id),
    ])
    setReordenando(false)

    if (r1.error || r2.error) { toast.error('Error al reordenar'); return }
    router.refresh()
  }

  // ── Nuevo municipio ─────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.nombre.trim()) { toast.error('El nombre es obligatorio'); return }

    setSaving(true)
    const siguienteOrden = municipios.length > 0 ? Math.max(...municipios.map(m => m.orden)) + 1 : 0
    const { error } = await supabase.from('municipios').insert({
      salon_id:        salonId,
      nombre:          newForm.nombre.trim(),
      cargo_traslado:  Number(newForm.cargo_traslado),
      orden:           siguienteOrden,
      activo:          true,
    })

    setSaving(false)
    if (error) {
      toast.error(error.code === '23505' ? 'Ya existe un municipio con ese nombre' : 'Error al crear municipio')
      return
    }
    toast.success('Municipio agregado')
    setNewForm(EMPTY_FORM)
    setShowForm(false)
    router.refresh()
  }

  const ordenados = [...municipios].sort((a, b) => a.orden - b.orden)

  return (
    <div className="space-y-4">

      {/* Botón agregar */}
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Nuevo municipio'}
        </button>
      </div>

      {/* Formulario nuevo municipio */}
      {showForm && (
        <form onSubmit={handleAdd} className="card grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" required placeholder="Ej. Zapopan"
              value={newForm.nombre} onChange={e => setNewForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label">Cargo de traslado (MXN) *</label>
            <input className="input" type="number" min={0} step="0.01" required
              value={newForm.cargo_traslado} onChange={e => setNewForm(p => ({ ...p, cargo_traslado: +e.target.value }))} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Agregar municipio'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead style={{ background: 'var(--color-warm-100)' }}>
            <tr className="text-left">
              {['Orden', 'Municipio', 'Cargo de traslado', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 font-medium text-xs uppercase tracking-wide"
                    style={{ color: 'var(--color-warm-600)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
            {ordenados.map((m, idx) => (
              <tr key={m.id} className={cn('transition-colors', !m.activo && 'opacity-50')}>

                {/* Orden */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost text-xs px-2 py-1" disabled={idx === 0 || reordenando}
                      onClick={() => mover(m, -1)}>↑</button>
                    <button className="btn-ghost text-xs px-2 py-1" disabled={idx === ordenados.length - 1 || reordenando}
                      onClick={() => mover(m, 1)}>↓</button>
                  </div>
                </td>

                {/* Nombre */}
                <td className="px-4 py-3">
                  {editId === m.id
                    ? <input className="input" value={editData.nombre ?? ''}
                        onChange={e => setEditData(p => ({ ...p, nombre: e.target.value }))} />
                    : <span className="font-medium">{m.nombre}</span>
                  }
                </td>

                {/* Cargo de traslado */}
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-salon-700)' }}>
                  {editId === m.id
                    ? <input className="input w-28" type="number" min={0} step="0.01" value={editData.cargo_traslado ?? ''}
                        onChange={e => setEditData(p => ({ ...p, cargo_traslado: +e.target.value }))} />
                    : formatPeso(m.cargo_traslado)
                  }
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <span className={cn('badge', m.activo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-warm-200 text-warm-500')}>
                    {m.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editId === m.id ? (
                      <>
                        <button className="btn-primary text-xs px-3 py-1.5" onClick={() => saveEdit(m.id)} disabled={saving}>
                          {saving ? '…' : 'Guardar'}
                        </button>
                        <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => setEditId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => startEdit(m)}>
                          Editar
                        </button>
                        <button
                          className={cn('text-xs px-3 py-1.5 rounded-lg border font-medium transition-all', m.activo
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          )}
                          onClick={() => toggleActivo(m)}
                        >
                          {m.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {municipios.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: 'var(--color-warm-400)' }}>
            No hay municipios. Agrega el primero — los municipios inactivos no aparecen en el wizard de citas.
          </p>
        )}
      </div>
    </div>
  )
}