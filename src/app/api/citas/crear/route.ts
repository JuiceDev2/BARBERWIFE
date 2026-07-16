import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => null)
    if (!rawBody) {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    console.log('📥 Datos recibidos:', rawBody)

    const supabaseAdmin = createAdminClient()

    // Crear o buscar cliente
    const { data: clienteExistente } = await supabaseAdmin
      .from('clientes')
      .select('id')
      .eq('salon_id', rawBody.salon_id)
      .eq('telefono', rawBody.telefono_cliente?.trim())
      .maybeSingle()

    let clienteId = clienteExistente?.id

    if (!clienteId) {
      const { data: nuevoCliente, error: errCliente } = await supabaseAdmin
        .from('clientes')
        .insert({
          salon_id: rawBody.salon_id,
          nombre: rawBody.nombre_cliente,
          telefono: rawBody.telefono_cliente?.trim(),
        })
        .select('id')
        .single()

      if (errCliente || !nuevoCliente) {
        console.error('Error creando cliente:', errCliente)
        return NextResponse.json({ error: 'Error al registrar cliente' }, { status: 500 })
      }
      clienteId = nuevoCliente.id
    }

    // Crear la cita
    const esEspecial = rawBody.tipo_cita === 'especial'

    const { data: cita, error: errCita } = await supabaseAdmin
      .from('citas')
      .insert({
        salon_id: rawBody.salon_id,
        cliente_id: clienteId,
        servicio_id: rawBody.servicio_id,
        fecha_hora: rawBody.fecha_hora,
        duracion_min: rawBody.duracion_min || 60,
        origen: rawBody.origen || 'internet',
        estado: 'confirmada',
        notas: rawBody.notas || null,
        tipo_cita: esEspecial ? 'especial' : 'normal',
        estado_cita: esEspecial ? 'pendiente_validacion' : 'confirmada',
        requiere_traslado: esEspecial,
        // Dirección especial
        municipio_id: esEspecial ? rawBody.direccion_especial?.municipio_id : null,
        calle: esEspecial ? rawBody.direccion_especial?.calle : null,
        numero_exterior: esEspecial ? rawBody.direccion_especial?.numero_exterior : null,
        numero_interior: esEspecial ? rawBody.direccion_especial?.numero_interior : null,
        codigo_postal: esEspecial ? rawBody.direccion_especial?.codigo_postal : null,
        referencias: esEspecial ? rawBody.direccion_especial?.referencias : null,
      })
      .select('id')
      .single()

    if (errCita || !cita) {
      console.error('Error al crear cita:', errCita)
      return NextResponse.json({ error: errCita?.message || 'Error al crear la cita' }, { status: 500 })
    }

    console.log('✅ Cita creada exitosamente:', cita.id)

    return NextResponse.json({
      ok: true,
      cita_id: cita.id,
      mensaje: esEspecial 
        ? 'Cita especial enviada. Te contactaremos pronto.' 
        : '¡Cita agendada correctamente!'
    }, { status: 201 })

  } catch (err: any) {
    console.error('💥 Error inesperado en /api/citas/crear:', err)
    return NextResponse.json({ 
      error: err.message || 'Error interno del servidor' 
    }, { status: 500 })
  }
}