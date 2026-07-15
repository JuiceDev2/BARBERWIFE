'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { bookingSchema } from '@/lib/schemas/booking'
import type { z } from 'zod'

export async function getAvailableTimeSlots(date: string, durationMinutes: number) {
  // TODO: Implement full logic with existing appointments
  const slots: { time: string; available: boolean }[] = []
  const startHour = 9
  const endHour = 19

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      slots.push({ time, available: true })
    }
  }

  if (durationMinutes > 240) {
    throw new Error('Duración máxima de 4 horas')
  }

  return slots
}

type GuestAppointmentInput = Omit<z.input<typeof bookingSchema>, 'clientData'> & {
  clientData: Omit<z.input<typeof bookingSchema>['clientData'], 'type'>
}

export async function createGuestAppointment(input: GuestAppointmentInput) {
  const parsed = bookingSchema.parse({
    ...input,
    clientData: { type: 'guest', ...input.clientData },
  })

  const supabase = await createServerSupabaseClient()

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      guest_name: parsed.clientData.name,
      guest_phone: parsed.clientData.phone,
      scheduled_at: parsed.selectedDate,
      start_time: parsed.selectedTimeSlot,
      // Calculate end_time etc.
      status: 'pending',
      total_price: 100, // placeholder
    })
    .select()
    .single()

  if (error) throw error

  // TODO: WhatsApp
  console.log(`[TODO] Enviar confirmación WhatsApp a ${parsed.clientData.phone}`)

  revalidatePath('/agendar')
  return appointment
}

export async function createClientAppointment(
  input: Omit<z.input<typeof bookingSchema>, 'clientData'>
) {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Debes iniciar sesión para agendar como cliente registrado')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, phone')
    .eq('id', user.id)
    .single()

  const parsed = bookingSchema.parse({
    ...input,
    clientData: {
      type: 'registered',
      name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      email: user.email,
    },
  })

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_id: user.id,
      scheduled_at: parsed.selectedDate,
      start_time: parsed.selectedTimeSlot,
      // Calculate end_time etc.
      status: 'pending',
      total_price: 100, // placeholder
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/')
  return appointment
}
