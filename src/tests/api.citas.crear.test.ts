import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock genérico de query builder de Supabase ───────────────
// Cada llamada a `.from(tabla)` en el route consume el siguiente
// resultado de una cola ordenada, sin importar si termina en
// .single(), .maybeSingle() o se usa "bare" (sin terminal, como
// en la consulta de horarios_laborales que regresa un arreglo).
type QueryResult = { data: unknown; error: unknown }

function makeBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {}
  builder.select = vi.fn(() => builder)
  builder.eq = vi.fn(() => builder)
  builder.order = vi.fn(() => builder)
  builder.insert = vi.fn(() => builder)
  builder.update = vi.fn(() => builder)
  builder.single = vi.fn(() => Promise.resolve(result))
  builder.maybeSingle = vi.fn(() => Promise.resolve(result))
  // Permite `await supabase.from(...).select().eq()` sin terminal explícito
  builder.then = (resolve: (r: QueryResult) => void) => resolve(result)
  return builder
}

const { supabaseQueue, adminQueue } = vi.hoisted(() => {
  const supabaseQueue: QueryResult[] = []
  const adminQueue: QueryResult[] = []
  return { supabaseQueue, adminQueue }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => {
    let i = 0
    return { from: vi.fn(() => makeBuilder(supabaseQueue[i++] ?? { data: null, error: null })) }
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => {
    let i = 0
    return { from: vi.fn(() => makeBuilder(adminQueue[i++] ?? { data: null, error: null })) }
  }),
}))

vi.mock('@/lib/ratelimit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 4 })),
}))

// ── Helper para crear Request ────────────────────────────────
function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/citas/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Datos de prueba (fecha muy en el futuro para no volverse obsoleta) ──
const PAYLOAD_VALIDO = {
  nombre_cliente:   'María González',
  telefono_cliente: '3312345678',
  salon_id:         '11111111-1111-1111-1111-111111111111',
  servicio_id:      '22222222-2222-2222-2222-222222222222',
  fecha_hora:       '2099-08-01T10:00:00',
  notas:            null,
}

describe('POST /api/citas/crear — validación de campos', () => {
  it('retorna 400 si falta nombre_cliente', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, nombre_cliente: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('retorna 400 si falta telefono_cliente', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, telefono_cliente: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta salon_id', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, salon_id: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta servicio_id', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, servicio_id: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta fecha_hora', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, fecha_hora: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si el body es completamente vacío', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si tipo_cita es "especial" sin direccion_especial', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, tipo_cita: 'especial' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/citas/crear — cita normal, respuesta de éxito', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseQueue.length = 0
    adminQueue.length = 0

    // Orden real de llamadas en el route para una cita NORMAL:
    supabaseQueue.push({ data: { id: '11111111-1111-1111-1111-111111111111' }, error: null })                 // 1. salones
    supabaseQueue.push({ data: { id: '22222222-2222-2222-2222-222222222222', duracion_min: 60 }, error: null }) // 2. servicios
    supabaseQueue.push({ data: null, error: null })                                    // 3. dias_festivos (sin festivo)
    supabaseQueue.push({ data: [{ hora_inicio: '00:00:00', hora_fin: '23:59:00' }], error: null }) // 4. horarios_laborales (cubre todo el día)

    adminQueue.push({ data: null, error: null })                 // 5. clientes (no existe)
    adminQueue.push({ data: { id: 'cliente-nuevo' }, error: null }) // 6. clientes.insert
    adminQueue.push({ data: { id: 'cita-nueva' }, error: null })    // 7. citas.insert
  })

  it('retorna 201 con cita_id y tipo_cita "normal"', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest(PAYLOAD_VALIDO)
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.cita_id).toBe('cita-nueva')
    expect(body.tipo_cita).toBe('normal')
  })
})

describe('POST /api/citas/crear — cita especial (fuera de horario)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    supabaseQueue.length = 0
    adminQueue.length = 0

    supabaseQueue.push({ data: { id: '11111111-1111-1111-1111-111111111111' }, error: null })                 // salones
    supabaseQueue.push({ data: { id: '22222222-2222-2222-2222-222222222222', duracion_min: 60 }, error: null }) // servicios
    supabaseQueue.push({ data: null, error: null })                                    // dias_festivos
    supabaseQueue.push({ data: [{ hora_inicio: '09:00:00', hora_fin: '19:00:00' }], error: null }) // horario normal, la hora elegida (23:30) cae fuera
    supabaseQueue.push({ data: { id: '33333333-3333-3333-3333-333333333333' }, error: null })               // municipios (válido y activo)

    adminQueue.push({ data: null, error: null })
    adminQueue.push({ data: { id: 'cliente-nuevo' }, error: null })
    adminQueue.push({ data: { id: 'cita-nueva' }, error: null })
  })

  it('fuerza tipo_cita "especial" aunque el cliente mande "normal", si la hora está fuera de horario', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({
      ...PAYLOAD_VALIDO,
      fecha_hora: '2099-08-01T23:30:00',
      tipo_cita: 'normal', // intento de forzar "normal" a una hora fuera de horario
      direccion_especial: {
        municipio_id: '33333333-3333-3333-3333-333333333333',
        calle: 'Av. Vallarta',
        numero_exterior: '123',
        referencias: 'Casa blanca con portón negro',
      },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.tipo_cita).toBe('especial')
  })
})