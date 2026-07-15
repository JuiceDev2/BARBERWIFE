import { z } from 'zod'

export const clientDataSchema = z.object({
  type: z.enum(['guest', 'registered']),
  name: z.string().min(2, 'Nombre requerido'),
  phone: z.string().min(10, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional(),
})

export const bookingSchema = z.object({
  selectedServices: z.array(z.string()).min(1, 'Selecciona al menos un servicio'),
  selectedDate: z.string(),
  selectedTimeSlot: z.string(),
  clientData: clientDataSchema,
})
