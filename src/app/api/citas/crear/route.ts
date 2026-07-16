import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { crearCitaSchema, zodError } from '@/lib/validations'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(request: Request) {
  try {
    // ── Rate limiting ──────────────────────────────────────
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    const { allowed } = await checkRateLimit(
      `citas:${ip}`,
      5,        // 5 citas por ventana
      60_000,   // ventana de 1 minuto
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' },
        { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } }
      )
    }

    // ── Validación con Zod ─────────────────────────────────
    const raw = await request.json().catch(() => null)
    if (!raw) {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    const parsed = crearCitaSchema.safeParse(raw)
    if (!parsed.success) return zodError(parsed.error)

    const {
      nombre_cliente,
      telefono_cliente,
      salon_id,
      servicio_id,
      fecha_hora,
      notas,
      origen,
      direccion_especial,
    } = parsed.data

    // El cliente ya no elige estilista: se asigna después desde el panel admin.
    const estilista_id: string | null = null

    // ── Validar que la fecha no sea en el pasado ───────────
    const fechaCita = new Date(fecha_hora)
    if (fechaCita < new Date()) {
      return NextResponse.json(
        { error: 'La fecha de la cita no puede ser en el pasado' },
        { status: 400 }
      )
    }

    // Cliente normal (RLS activo) para las lecturas públicas —
    // salones y servicios ya tienen políticas SELECT públicas correctas.
    const supabase = await createClient()

    // Cliente admin (bypassa RLS) — necesario porque clientes y citas
    // solo tienen política de INSERT pública, no de SELECT, y
    // insert().select() requiere ambas para devolver la fila creada.
    const supabaseAdmin = createAdminClient()

    // ── Verificar que el salón existe y está activo ────────
    const { data: salon, error: errSalon } = await supabase
      .from('salones')
      .select('id')
      .eq('id', salon_id)
      .eq('activo', true)
      .single()

    if (errSalon || !salon) {
      return NextResponse.json({ error: 'Salón no encontrado' }, { status: 404 })
    }

    // ── Verificar que el servicio existe y está activo ─────
    const { data: servicio, error: errServicio } = await supabase
      .from('servicios')
      .select('id, duracion_min')
      .eq('id', servicio_id)
      .eq('salon_id', salon_id)
      .eq('activo', true)
      .single()

    if (errServicio || !servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado o inactivo' }, { status: 404 })
    }

    // ── Verificar día festivo (cierre total) ───────────────
    const fechaSolo = fecha_hora.slice(0, 10) // 'YYYY-MM-DD'
    const { data: festivo } = await supabase
      .from('dias_festivos')
      .select('nombre, cerrado')
      .eq('salon_id', salon_id)
      .eq('fecha', fechaSolo)
      .eq('activo', true)
      .maybeSingle()

    if (festivo?.cerrado) {
      return NextResponse.json(
        { error: `No hay servicio el ${fechaSolo} (${festivo.nombre}). Elige otra fecha.` },
        { status: 400 }
      )
    }

    // ── Determinar tipo_cita real (nunca confiar solo en el cliente) ──
    // Si el horario elegido cae fuera de los bloques laborales activos
    // del día, la cita SIEMPRE es "especial", sin importar qué mandó el
    // formulario. Esto evita que alguien fuerce una cita normal a una
    // hora que en realidad requiere validación manual.
    const diaSemana = fechaCita.getDay() // 0=domingo … 6=sábado
    const horaHHMM = fecha_hora.slice(11, 16) // 'HH:MM'

    const { data: bloquesLaborales } = await supabase
      .from('horarios_laborales')
      .select('hora_inicio, hora_fin')
      .eq('salon_id', salon_id)
      .eq('dia_semana', diaSemana)
      .eq('activo', true)

    const dentroDeHorarioNormal = (bloquesLaborales ?? []).some(
      b => horaHHMM >= b.hora_inicio.slice(0, 5) && horaHHMM < b.hora_fin.slice(0, 5)
    )

    const esEspecial = !dentroDeHorarioNormal || parsed.data.tipo_cita === 'especial'

    if (esEspecial && !direccion_especial) {
      return NextResponse.json(
        { error: 'Este horario requiere Servicio Especial. Completa los datos de dirección.' },
        { status: 400 }
      )
    }

    // ── Validar municipio (solo si es especial) ────────────
    if (esEspecial && direccion_especial) {
      const { data: municipio, error: errMunicipio } = await supabase
        .from('municipios')
        .select('id')
        .eq('id', direccion_especial.municipio_id)
        .eq('salon_id', salon_id)
        .eq('activo', true)
        .single()

      if (errMunicipio || !municipio) {
        return NextResponse.json({ error: 'Municipio no válido o inactivo' }, { status: 400 })
      }
    }

    // ── Buscar o crear cliente ─────────────────────────────
    let clienteId: string

    // La búsqueda también usa admin: estilista_read_clientes_salon exige
    // sesión de estilista, y aquí no hay sesión (visitante público).
    const { data: clienteExistente } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('telefono', telefono_cliente.trim())
      .maybeSingle()

    if (clienteExistente) {
      clienteId = clienteExistente.id
      await supabaseAdmin
        .from('clientes')
        .update({ nombre: nombre_cliente })
        .eq('id', clienteId)
    } else {
      const { data: nuevoCliente, error: errCliente } = await supabaseAdmin
        .from('clientes')
        .insert({ salon_id, nombre: nombre_cliente, telefono: telefono_cliente.trim() })
        .select('id')
        .single()

      if (errCliente || !nuevoCliente) {
        console.error('Error al crear cliente:', errCliente)
        return NextResponse.json({ error: 'Error al registrar cliente' }, { status: 500 })
      }
      clienteId = nuevoCliente.id
    }

    // ── Crear cita ─────────────────────────────────────────
    const { data: cita, error: errCita } = await supabaseAdmin
      .from('citas')
      .insert({
        salon_id,
        cliente_id:   clienteId,
        estilista_id,
        servicio_id,
        fecha_hora,
        duracion_min: servicio.duracion_min,
        estado:       'confirmada',
        origen,
        notas:        notas ?? null,
        tipo_cita:         esEspecial ? 'especial' : 'normal',
        estado_cita:       esEspecial ? 'pendiente_validacion' : 'confirmada',
        requiere_traslado: esEspecial,
        municipio_id:      esEspecial ? direccion_especial?.municipio_id ?? null : null,
        calle:             esEspecial ? direccion_especial?.calle ?? null : null,
        numero_exterior:   esEspecial ? direccion_especial?.numero_exterior ?? null : null,
        numero_interior:   esEspecial ? direccion_especial?.numero_interior ?? null : null,
        codigo_postal:     esEspecial ? direccion_especial?.codigo_postal ?? null : null,
        referencias:       esEspecial ? direccion_especial?.referencias ?? null : null,
      })
      .select('id')
      .single()

    if (errCita || !cita) {
      console.error('Error al crear cita:', errCita)
      return NextResponse.json({ error: 'Error al crear la cita' }, { status: 500 })
    }

    return NextResponse.json(
      { ok: true, cita_id: cita.id, tipo_cita: esEspecial ? 'especial' : 'normal' },
      { status: 201 }
    )

  } catch (err) {
    console.error('POST /api/citas/crear:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
