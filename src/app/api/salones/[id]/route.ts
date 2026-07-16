import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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
        direccion: body.direccion,
        telefono: body.telefono,
        activo: body.activo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}