'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { ConfiguracionNegocio, HorarioLaboral, HorarioEspecial, DiaFestivo } from '@/types'
import { formatPeso, cn } from '@/lib/utils'

interface Props {
  salonId: string
  configuracionInicial: ConfiguracionNegocio | null
  horariosLaboralesIniciales: HorarioLaboral[]
  horariosEspecialesIniciales: HorarioEspecial[]
  diasFestivosIniciales: DiaFestivo[]
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function ConfiguracionPanel({
  salonId,
  configuracionInicial,
  horariosLaboralesIniciales,
  horariosEspecialesIniciales,
  diasFestivosIniciales,
}: Props) {
  return (
    <div className="space-y-8">
      <SeccionAnticipo salonId={salonId} configuracionInicial={configuracionInicial} />
      <SeccionHorariosLaborales salonId={salonId} horarios={horariosLaboralesIniciales} />
      <SeccionHorariosEspeciales salonId={salonId} horarios={horariosEspecialesIniciales} />
      <SeccionDiasFestivos salonId={salonId} festivos={diasFestivosIniciales} />
    </div>
  )
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold mb-1" style={{ color: 'var(--color-warm-800)' }}>{title}</h2>
      {subtitle && <p className="text-sm mb-3" style={{ color: 'var(--color-warm-500)' }}>{subtitle}</p>}
      <div className="card space-y-4">{children}</div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════
// ANTICIPO MÍNIMO
// ══════════════════════════════════════════════════════════════
function SeccionAnticipo({ salonId, configuracionInicial }: { salonId: string; configuracionInicial: ConfiguracionNegocio | null }) {
  const router = useRouter()
  const supabase = createClient()
  const [anticipoMinimo, setAnticipoMinimo] = useState(configuracionInicial?.anticipo_minimo ?? 0)
  const [saving, setSaving] = useState(false)

  async function guardar() {
    if (anticipoMinimo < 0) { toast.error('No puede ser negativo'); return }
    setSaving(true)
    const { error } = await supabase
      .from('configuracion_negocio')
      .upsert({ salon_id: salonId, anticipo_minimo: anticipoMinimo }, { onConflict: 'salon_id' })

    setSaving(false)
    if (error) { toast.error('Error al guardar'); return }
    toast.success('Anticipo mínimo actualizado')
    router.refresh()
  }

  return (
    <Card title="Anticipo mínimo" subtitle="Referencia para aprobar Servicios Especiales">
      <div className="flex items-end gap-4">
        <div>
          <label className="label">Anticipo mínimo (MXN)</label>
          <input className="input w-40" type="number" min={0} step="0.01"
            value={anticipoMinimo} onChange={e => setAnticipoMinimo(+e.target.value)} />
        </div>
        <button className="btn-primary" onClick={guardar} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════
// HORARIOS LABORALES
// ══════════════════════════════════════════════════════════════
function SeccionHorariosLaborales({ salonId, horarios }: { salonId: string; horarios: HorarioLaboral[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [dia, setDia] = useState(1)
  const [horaInicio, setHoraInicio] = useState('09:00')
  const [horaFin, setHoraFin] = useState('19:00')
  const [saving, setSaving] = useState(false)

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (horaFin <= horaInicio) { toast.error('La hora de fin debe ser posterior a la de inicio'); return }
    setSaving(true)
    const { error } = await supabase.from('horarios_laborales').insert({
      salon_id: salonId, dia_semana: dia, hora_inicio: horaInicio, hora_fin: horaFin, activo: true,
    })
    setSaving(false)
    if (error) { toast.error('Error al agregar bloque'); return }
    toast.success('Bloque agregado')
    setShowForm(false)
    router.refresh()
  }

  async function toggleActivo(h: HorarioLaboral) {
    const { error } = await supabase.from('horarios_laborales').update({ activo: !h.activo }).eq('id', h.id)
    if (error) { toast.error('Error al actualizar'); return }
    router.refresh()
  }

  async function eliminar(h: HorarioLaboral) {
    if (!confirm('¿Eliminar este bloque de horario?')) return
    const { error } = await supabase.from('horarios_laborales').delete().eq('id', h.id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Bloque eliminado')
    router.refresh()
  }

  return (
    <Card title="Horarios laborales" subtitle="Bloques normales por día de la semana">
      <div className="flex justify-end">
        <button className="btn-secondary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Agregar bloque'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={agregar} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end p-3 rounded-lg" style={{ background: 'var(--color-warm-100)' }}>
          <div>
            <label className="label">Día</label>
            <select className="input" value={dia} onChange={e => setDia(+e.target.value)}>
              {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Hora inicio</label>
            <input className="input" type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
          </div>
          <div>
            <label className="label">Hora fin</label>
            <input className="input" type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? '…' : 'Agregar'}</button>
        </form>
      )}

      <div className="space-y-2">
        {horarios.map(h => (
          <div key={h.id} className={cn('flex items-center justify-between p-3 rounded-lg border', !h.activo && 'opacity-50')}
               style={{ borderColor: 'var(--color-warm-300)' }}>
            <span className="text-sm">
              <strong>{DIAS_SEMANA[h.dia_semana]}</strong> · {h.hora_inicio.slice(0, 5)}–{h.hora_fin.slice(0, 5)}
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => toggleActivo(h)}>
                {h.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button className="text-xs px-3 py-1.5 rounded-lg border font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                onClick={() => eliminar(h)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {horarios.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-warm-400)' }}>
            Sin bloques configurados. El wizard tratará cualquier hora como fuera de horario.
          </p>
        )}
      </div>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════
// HORARIOS ESPECIALES
// ══════════════════════════════════════════════════════════════
function SeccionHorariosEspeciales({ salonId, horarios }: { salonId: string; horarios: HorarioEspecial[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [modo, setModo] = useState<'dia' | 'fecha'>('dia')
  const [dia, setDia] = useState(5)
  const [fecha, setFecha] = useState('')
  const [horaInicio, setHoraInicio] = useState('20:00')
  const [horaFin, setHoraFin] = useState('23:59')
  const [motivo, setMotivo] = useState('')
  const [saving, setSaving] = useState(false)

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (horaFin <= horaInicio) { toast.error('La hora de fin debe ser posterior a la de inicio'); return }
    if (modo === 'fecha' && !fecha) { toast.error('Selecciona una fecha'); return }

    setSaving(true)
    const { error } = await supabase.from('horarios_especiales').insert({
      salon_id:   salonId,
      dia_semana: modo === 'dia' ? dia : null,
      fecha:      modo === 'fecha' ? fecha : null,
      hora_inicio: horaInicio,
      hora_fin:    horaFin,
      motivo:      motivo.trim() || null,
      activo:      true,
    })
    setSaving(false)
    if (error) { toast.error('Error al agregar'); return }
    toast.success('Horario especial agregado')
    setShowForm(false)
    setMotivo('')
    router.refresh()
  }

  async function toggleActivo(h: HorarioEspecial) {
    const { error } = await supabase.from('horarios_especiales').update({ activo: !h.activo }).eq('id', h.id)
    if (error) { toast.error('Error al actualizar'); return }
    router.refresh()
  }

  async function eliminar(h: HorarioEspecial) {
    if (!confirm('¿Eliminar este horario especial?')) return
    const { error } = await supabase.from('horarios_especiales').delete().eq('id', h.id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Eliminado')
    router.refresh()
  }

  return (
    <Card title="Horarios especiales" subtitle="Franjas que siempre disparan el formulario de Servicio Especial, aunque estén habilitadas para reservar">
      <div className="flex justify-end">
        <button className="btn-secondary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Agregar franja'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={agregar} className="space-y-3 p-3 rounded-lg" style={{ background: 'var(--color-warm-100)' }}>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={modo === 'dia'} onChange={() => setModo('dia')} /> Día de la semana (recurrente)
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={modo === 'fecha'} onChange={() => setModo('fecha')} /> Fecha específica
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            {modo === 'dia' ? (
              <div>
                <label className="label">Día</label>
                <select className="input" value={dia} onChange={e => setDia(+e.target.value)}>
                  {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="label">Fecha</label>
                <input className="input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
              </div>
            )}
            <div>
              <label className="label">Hora inicio</label>
              <input className="input" type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)} />
            </div>
            <div>
              <label className="label">Hora fin</label>
              <input className="input" type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} />
            </div>
            <div>
              <label className="label">Motivo (opcional)</label>
              <input className="input" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ej. Madrugada" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? '…' : 'Agregar'}</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {horarios.map(h => (
          <div key={h.id} className={cn('flex items-center justify-between p-3 rounded-lg border', !h.activo && 'opacity-50')}
               style={{ borderColor: 'var(--color-warm-300)' }}>
            <span className="text-sm">
              <strong>{h.fecha ?? DIAS_SEMANA[h.dia_semana ?? 0]}</strong> · {h.hora_inicio.slice(0, 5)}–{h.hora_fin.slice(0, 5)}
              {h.motivo && <span style={{ color: 'var(--color-warm-500)' }}> · {h.motivo}</span>}
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => toggleActivo(h)}>
                {h.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button className="text-xs px-3 py-1.5 rounded-lg border font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                onClick={() => eliminar(h)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {horarios.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-warm-400)' }}>
            Sin franjas especiales configuradas.
          </p>
        )}
      </div>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════
// DÍAS FESTIVOS
// ══════════════════════════════════════════════════════════════
function SeccionDiasFestivos({ salonId, festivos }: { salonId: string; festivos: DiaFestivo[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [fecha, setFecha] = useState('')
  const [nombre, setNombre] = useState('')
  const [cerrado, setCerrado] = useState(true)
  const [saving, setSaving] = useState(false)

  async function agregar(e: React.FormEvent) {
    e.preventDefault()
    if (!fecha || !nombre.trim()) { toast.error('Fecha y nombre son obligatorios'); return }
    setSaving(true)
    const { error } = await supabase.from('dias_festivos').insert({
      salon_id: salonId, fecha, nombre: nombre.trim(), cerrado, activo: true,
    })
    setSaving(false)
    if (error) {
      toast.error(error.code === '23505' ? 'Ya existe un festivo en esa fecha' : 'Error al agregar')
      return
    }
    toast.success('Día festivo agregado')
    setShowForm(false)
    setFecha('')
    setNombre('')
    router.refresh()
  }

  async function toggleActivo(f: DiaFestivo) {
    const { error } = await supabase.from('dias_festivos').update({ activo: !f.activo }).eq('id', f.id)
    if (error) { toast.error('Error al actualizar'); return }
    router.refresh()
  }

  async function eliminar(f: DiaFestivo) {
    if (!confirm(`¿Eliminar "${f.nombre}"?`)) return
    const { error } = await supabase.from('dias_festivos').delete().eq('id', f.id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Eliminado')
    router.refresh()
  }

  return (
    <Card title="Días festivos" subtitle="Cierres totales o parciales que bloquean el wizard de citas">
      <div className="flex justify-end">
        <button className="btn-secondary text-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Agregar festivo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={agregar} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end p-3 rounded-lg" style={{ background: 'var(--color-warm-100)' }}>
          <div>
            <label className="label">Fecha</label>
            <input className="input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Nombre</label>
            <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Navidad" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cerrado} onChange={e => setCerrado(e.target.checked)} /> Cierre total
          </label>
          <div className="col-span-4 flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? '…' : 'Agregar'}</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {festivos.map(f => (
          <div key={f.id} className={cn('flex items-center justify-between p-3 rounded-lg border', !f.activo && 'opacity-50')}
               style={{ borderColor: 'var(--color-warm-300)' }}>
            <span className="text-sm">
              <strong>{f.fecha}</strong> · {f.nombre} {f.cerrado && <span className="badge bg-red-100 text-red-700 ml-1">Cerrado</span>}
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => toggleActivo(f)}>
                {f.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button className="text-xs px-3 py-1.5 rounded-lg border font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                onClick={() => eliminar(f)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {festivos.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-warm-400)' }}>
            Sin días festivos configurados.
          </p>
        )}
      </div>
    </Card>
  )
}