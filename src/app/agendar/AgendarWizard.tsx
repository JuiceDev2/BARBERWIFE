'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/browser'
import type { Salon, Servicio, Municipio, HorarioLaboral, DiaFestivo } from '@/types'
import { formatPeso } from '@/lib/utils'

interface Props {
  salonesIniciales: Salon[]
}

type Paso = 'salon' | 'servicio' | 'fecha' | 'hora' | 'especial' | 'datos' | 'confirmacion'

const TITULOS: Record<Paso, string> = {
  salon: 'Elige el salón',
  servicio: 'Elige el servicio',
  fecha: 'Elige la fecha',
  hora: 'Elige la hora',
  especial: '✨ Servicio Especial',
  datos: 'Tus datos',
  confirmacion: 'Confirma tu cita',
}

export default function AgendarWizard({ salonesIniciales }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loadingCatalogo, setLoadingCatalogo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)

  // ── Selecciones del wizard ────────────────────────────────
  const [salon, setSalon] = useState<Salon | null>(salonesIniciales.length === 1 ? salonesIniciales[0] : null)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [servicio, setServicio] = useState<Servicio | null>(null)
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [solicitarEspecial, setSolicitarEspecial] = useState(false)

  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [horarios, setHorarios] = useState<HorarioLaboral[]>([])
  const [festivos, setFestivos] = useState<DiaFestivo[]>([])

  const [municipioId, setMunicipioId] = useState('')
  const [calle, setCalle] = useState('')
  const [numeroExterior, setNumeroExterior] = useState('')
  const [numeroInterior, setNumeroInterior] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [referencias, setReferencias] = useState('')

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')

  const [paso, setPaso] = useState<Paso>(salon ? 'servicio' : 'salon')

  // ── Cargar catálogos del salón elegido (RLS público: solo activos) ──
  useEffect(() => {
    if (!salon) return
    let cancelado = false
    setLoadingCatalogo(true)

    Promise.all([
      supabase.from('servicios').select('*').eq('salon_id', salon.id).eq('activo', true).order('nombre'),
      supabase.from('horarios_laborales').select('*').eq('salon_id', salon.id).eq('activo', true),
      supabase.from('municipios').select('*').eq('salon_id', salon.id).eq('activo', true).order('orden'),
      supabase.from('dias_festivos').select('*').eq('salon_id', salon.id).eq('activo', true),
    ])
      .then(([resServicios, resHorarios, resMunicipios, resFestivos]) => {
        if (cancelado) return
        setServicios((resServicios.data as Servicio[]) ?? [])
        setHorarios((resHorarios.data as HorarioLaboral[]) ?? [])
        setMunicipios((resMunicipios.data as Municipio[]) ?? [])
        setFestivos((resFestivos.data as DiaFestivo[]) ?? [])
      })
      .catch(() => {
        if (!cancelado) toast.error('No pudimos cargar la información del salón')
      })
      .finally(() => {
        if (!cancelado) setLoadingCatalogo(false)
      })

    return () => { cancelado = true }
  }, [salon, supabase])

  // Mínimo seleccionable: mañana
  const minFecha = useMemo(() => {
    const hoy = new Date()
    hoy.setDate(hoy.getDate() + 1)
    return hoy.toISOString().split('T')[0]
  }, [])

  const festivoDeLaFecha = useMemo(
    () => festivos.find(f => f.fecha === fecha && f.cerrado),
    [festivos, fecha]
  )

  const diaSemana = fecha ? new Date(`${fecha}T00:00:00`).getDay() : null

  const bloquesDelDia = useMemo(
    () => (diaSemana === null ? [] : horarios.filter(h => h.dia_semana === diaSemana)),
    [horarios, diaSemana]
  )

  const horaDentroDeLoNormal = useMemo(() => {
    if (!hora || bloquesDelDia.length === 0) return false
    return bloquesDelDia.some(b => hora >= b.hora_inicio.slice(0, 5) && hora < b.hora_fin.slice(0, 5))
  }, [hora, bloquesDelDia])

  // Especial si: el cliente lo solicita explícitamente, o la hora elegida
  // cae fuera de todos los bloques laborales activos de ese día.
  const esEspecial = solicitarEspecial || (!!hora && !horaDentroDeLoNormal)

  const municipioForaneo = municipios.find(m => {
    const n = m.nombre.trim().toLowerCase()
    return n === 'foráneo' || n === 'foraneo'
  })
  const esForaneo = !!municipioId && municipioForaneo?.id === municipioId

  // ── Secuencia de pasos (el paso "especial" solo aparece si aplica) ──
  const secuencia: Paso[] = useMemo(() => {
    const base: Paso[] = ['salon', 'servicio', 'fecha', 'hora']
    if (esEspecial) base.push('especial')
    base.push('datos', 'confirmacion')
    return base
  }, [esEspecial])

  const indicePaso = secuencia.indexOf(paso)

  function avanzar() {
    if (paso === 'salon' && !salon) return toast.error('Selecciona un salón')
    if (paso === 'servicio' && !servicio) return toast.error('Selecciona un servicio')
    if (paso === 'fecha') {
      if (!fecha) return toast.error('Selecciona una fecha')
      if (festivoDeLaFecha) return toast.error(`Cerrado ese día: ${festivoDeLaFecha.nombre}`)
    }
    if (paso === 'hora' && !hora) return toast.error('Selecciona una hora')
    if (paso === 'especial') {
      if (!municipioId) return toast.error('Selecciona tu municipio')
      if (!esForaneo) {
        if (!calle.trim()) return toast.error('La calle es obligatoria')
        if (!numeroExterior.trim()) return toast.error('El número exterior es obligatorio')
        if (!referencias.trim()) return toast.error('Agrega una referencia para ubicar el domicilio')
      }
    }
    if (paso === 'datos') {
      if (!nombre.trim() || nombre.trim().length < 2) return toast.error('Escribe tu nombre completo')
      if (!telefono.trim() || telefono.trim().length < 10) return toast.error('Teléfono inválido (mínimo 10 dígitos)')
    }

    const siguiente = secuencia[indicePaso + 1]
    if (siguiente) setPaso(siguiente)
  }

  function retroceder() {
    const anterior = secuencia[indicePaso - 1]
    if (anterior) setPaso(anterior)
  }

  async function confirmar() {
    if (!salon || !servicio) return
    setEnviando(true)
    try {
      const body: Record<string, unknown> = {
        nombre_cliente: nombre.trim(),
        telefono_cliente: telefono.trim(),
        salon_id: salon.id,
        servicio_id: servicio.id,
        fecha_hora: `${fecha}T${hora}:00`,
        notas: notas.trim() || null,
        origen: 'internet',
        tipo_cita: esEspecial ? 'especial' : 'normal',
      }

      if (esEspecial) {
        body.direccion_especial = {
          municipio_id: municipioId,
          calle: esForaneo ? (calle.trim() || 'N/A') : calle.trim(),
          numero_exterior: esForaneo ? (numeroExterior.trim() || 'N/A') : numeroExterior.trim(),
          numero_interior: numeroInterior.trim() || undefined,
          codigo_postal: codigoPostal.trim() || undefined,
          referencias: esForaneo ? (referencias.trim() || 'Servicio foráneo, sin dirección local') : referencias.trim(),
        }
      }

      const res = await fetch('/api/citas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al agendar')

      setExito(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setEnviando(false)
    }
  }

  // ── Pantalla de éxito ──────────────────────────────────────
  if (exito) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-salon-800)' }}>
          ¡Solicitud recibida!
        </h2>
        {esEspecial ? (
          <p className="mb-1 max-w-sm mx-auto" style={{ color: 'var(--color-warm-600)' }}>
            Nuestro equipo se pondrá en contacto contigo para confirmar disponibilidad, logística y costo.
          </p>
        ) : (
          <p className="mb-1" style={{ color: 'var(--color-warm-600)' }}>
            Te esperamos el <strong>{fecha}</strong> a las <strong>{hora}</strong>
          </p>
        )}
        <p className="text-sm mb-6" style={{ color: 'var(--color-warm-500)' }}>
          Si necesitas cancelar, llámanos directamente.
        </p>
        <button className="btn-secondary" onClick={() => router.push('/')}>
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progreso */}
      <div>
        <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-warm-500)' }}>
          <span>Paso {indicePaso + 1} de {secuencia.length}</span>
          <span>{TITULOS[paso]}</span>
        </div>
        <div className="h-1.5 rounded-full bg-warm-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${((indicePaso + 1) / secuencia.length) * 100}%`,
              background: 'var(--color-salon-600)',
            }}
          />
        </div>
      </div>

      <div className="card space-y-5">
        {/* PASO 1: SALÓN */}
        {paso === 'salon' && (
          <div className="space-y-3">
            {salonesIniciales.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSalon(s); setServicio(null) }}
                className="w-full text-left rounded-lg p-4 border transition-colors"
                style={{
                  borderColor: salon?.id === s.id ? 'var(--color-salon-600)' : 'var(--color-warm-300)',
                  background: salon?.id === s.id ? 'var(--color-salon-50)' : 'white',
                }}
              >
                <p className="font-medium" style={{ color: 'var(--color-salon-800)' }}>{s.nombre}</p>
                {s.direccion && <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>{s.direccion}</p>}
              </button>
            ))}
            {salonesIniciales.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>
                No hay salones disponibles por el momento.
              </p>
            )}
          </div>
        )}

        {/* PASO 2: SERVICIO (solo del salón elegido) */}
        {paso === 'servicio' && (
          <div className="space-y-3">
            {loadingCatalogo && <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>Cargando servicios…</p>}
            {!loadingCatalogo && servicios.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServicio(s)}
                className="w-full text-left rounded-lg p-4 border transition-colors"
                style={{
                  borderColor: servicio?.id === s.id ? 'var(--color-salon-600)' : 'var(--color-warm-300)',
                  background: servicio?.id === s.id ? 'var(--color-salon-50)' : 'white',
                }}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium" style={{ color: 'var(--color-salon-800)' }}>{s.nombre}</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-salon-700)' }}>{formatPeso(s.precio)}</p>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-warm-500)' }}>{s.duracion_min} min</p>
              </button>
            ))}
            {!loadingCatalogo && servicios.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>
                Este salón no tiene servicios disponibles ahora.
              </p>
            )}
          </div>
        )}

        {/* PASO 3: FECHA */}
        {paso === 'fecha' && (
          <div>
            <label className="label">Fecha *</label>
            <input
              className="input"
              type="date"
              min={minFecha}
              value={fecha}
              onChange={e => setFecha(e.target.value)}
            />
            {festivoDeLaFecha && (
              <p className="text-sm mt-2" style={{ color: 'var(--color-error)' }}>
                Cerrado ese día: {festivoDeLaFecha.nombre}. Elige otra fecha.
              </p>
            )}
          </div>
        )}

        {/* PASO 4: HORA */}
        {paso === 'hora' && (
          <div className="space-y-4">
            <div>
              <label className="label">Hora *</label>
              <input
                className="input"
                type="time"
                value={hora}
                onChange={e => setHora(e.target.value)}
              />
              {bloquesDelDia.length > 0 && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-warm-500)' }}>
                  Horario normal ese día: {bloquesDelDia.map(b => `${b.hora_inicio.slice(0, 5)}–${b.hora_fin.slice(0, 5)}`).join(', ')}
                </p>
              )}
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-warm-600)' }}>
              <input
                type="checkbox"
                className="mt-0.5"
                checked={solicitarEspecial}
                onChange={e => setSolicitarEspecial(e.target.checked)}
              />
              <span>✨ Solicitar Servicio Especial (aunque el horario sea normal)</span>
            </label>

            {hora && !horaDentroDeLoNormal && !solicitarEspecial && (
              <p className="text-sm rounded-lg p-3" style={{ background: 'var(--color-salon-50)', color: 'var(--color-salon-700)' }}>
                ✨ Esa hora está fuera del horario normal. Se procesará como Servicio Especial.
              </p>
            )}
          </div>
        )}

        {/* PASO 4b: SERVICIO ESPECIAL (solo si aplica) */}
        {paso === 'especial' && (
          <div className="space-y-4">
            <p className="text-sm rounded-lg p-3" style={{ background: 'var(--color-salon-50)', color: 'var(--color-salon-700)' }}>
              Este tipo de servicio requiere validación por parte de nuestro equipo.
              Nos pondremos en contacto contigo para confirmar disponibilidad, logística y costo.
            </p>

            <div>
              <label className="label">Municipio *</label>
              <select className="input" value={municipioId} onChange={e => setMunicipioId(e.target.value)}>
                <option value="">Selecciona tu municipio…</option>
                {municipios.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </div>

            {municipioId && !esForaneo && (
              <>
                <div>
                  <label className="label">Calle *</label>
                  <input className="input" value={calle} onChange={e => setCalle(e.target.value)} placeholder="Ej. Av. Vallarta" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Número exterior *</label>
                    <input className="input" value={numeroExterior} onChange={e => setNumeroExterior(e.target.value)} placeholder="123" />
                  </div>
                  <div>
                    <label className="label">Número interior</label>
                    <input className="input" value={numeroInterior} onChange={e => setNumeroInterior(e.target.value)} placeholder="Opcional" />
                  </div>
                </div>
                <div>
                  <label className="label">Código postal</label>
                  <input className="input" value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} placeholder="Opcional" />
                </div>
                <div>
                  <label className="label">Referencias *</label>
                  <textarea
                    className="input"
                    rows={2}
                    style={{ resize: 'none' }}
                    value={referencias}
                    onChange={e => setReferencias(e.target.value)}
                    placeholder="Ej. Casa blanca con portón negro frente al parque"
                  />
                </div>
              </>
            )}

            {esForaneo && (
              <p className="text-sm rounded-lg p-3" style={{ background: 'var(--color-salon-50)', color: 'var(--color-salon-700)' }}>
                Nuestro equipo se pondrá en contacto contigo para revisar la disponibilidad, logística y costos antes de confirmar tu reserva.
              </p>
            )}
          </div>
        )}

        {/* PASO 5: DATOS DEL CLIENTE */}
        {paso === 'datos' && (
          <div className="space-y-4">
            <div>
              <label className="label">Nombre completo *</label>
              <input className="input" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. María González" />
            </div>
            <div>
              <label className="label">Teléfono *</label>
              <input className="input" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Ej. 3312345678" />
            </div>
            <div>
              <label className="label">Notas (opcional)</label>
              <textarea
                className="input"
                rows={3}
                style={{ resize: 'none' }}
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder="¿Algo que debamos saber?"
              />
            </div>
          </div>
        )}

        {/* PASO 6: CONFIRMACIÓN */}
        {paso === 'confirmacion' && salon && servicio && (
          <div className="space-y-3 text-sm" style={{ color: 'var(--color-warm-700)' }}>
            <Resumen label="Salón" valor={salon.nombre} />
            <Resumen label="Servicio" valor={`${servicio.nombre} — ${formatPeso(servicio.precio)}`} />
            <Resumen label="Fecha" valor={fecha} />
            <Resumen label="Hora" valor={hora} />
            {esEspecial && <Resumen label="✨ Tipo" valor="Servicio Especial (requiere validación)" />}
            {esEspecial && municipioId && (
              <Resumen
                label="Dirección"
                valor={
                  esForaneo
                    ? (municipioForaneo?.nombre ?? 'Foráneo')
                    : `${calle} ${numeroExterior}, ${municipios.find(m => m.id === municipioId)?.nombre ?? ''}`
                }
              />
            )}
            <Resumen label="Nombre" valor={nombre} />
            <Resumen label="Teléfono" valor={telefono} />
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex gap-3">
        {indicePaso > 0 && (
          <button type="button" className="btn-secondary flex-1 justify-center" onClick={retroceder} disabled={enviando}>
            Atrás
          </button>
        )}
        {paso !== 'confirmacion' ? (
          <button type="button" className="btn-primary flex-1 justify-center" onClick={avanzar}>
            Continuar
          </button>
        ) : (
          <button type="button" className="btn-primary flex-1 justify-center py-3" onClick={confirmar} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Confirmar cita'}
          </button>
        )}
      </div>
    </div>
  )
}

function Resumen({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--color-warm-200)' }}>
      <span style={{ color: 'var(--color-warm-500)' }}>{label}</span>
      <span className="font-medium">{valor}</span>
    </div>
  )
}
