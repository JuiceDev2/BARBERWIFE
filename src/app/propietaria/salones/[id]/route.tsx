import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const { id } = Object.fromEntries(new URL(request.url).searchParams) || 
                   // Alternativa: extraer desde pathname si es necesario
                   { id: request.url.split('/').pop() }

    if (!id) {
      return NextResponse.json({ error: 'ID de salón requerido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'propietaria') {
      return NextResponse.json({ error: 'Solo la propietaria puede editar salones' }, { status: 403 })
    }

    const body = await request.json()

    const { error } = await supabase
      .from('salones')
      .update({
        nombre: body.nombre,
        direccion: body.direccion || null,
        telefono: body.telefono || null,
        activo: body.activo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, message: 'Sucursal actualizada correctamente' })

  } catch (err: any) {
    console.error('Error en PATCH /api/salones/[id]:', err)
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 })
  }
}