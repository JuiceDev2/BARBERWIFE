import { z } from 'zod'

// ── Helpers ──────────────────────────────────────────────────
const uuid = z.string().uuid('ID inválido')

const telefono = z
  .string()
  .min(10, 'Teléfono mínimo 10 dígitos')
  .max(15, 'Teléfono máximo 15 dígitos')
  .regex(/^[\d\s\-+()]+$/, 'Teléfono contiene caracteres inválidos')

const nombre = z.string().min(2, 'Nombre mínimo 2 caracteres').max(100, 'Nombre demasiado largo').trim()

// 👇 local: true permite fechas sin sufijo de zona horaria (ej. "2026-07-05T14:30:00"),
// que es el formato que genera el formulario con `${fecha}T${hora}:00`.
// Sin esto, Zod exige el sufijo "Z" (UTC) y rechaza fechas locales válidas.
const fechaISO = z.string().datetime({
  message: 'Fecha inválida, usar formato ISO 8601',
  local: true,
})

// ── Citas ────────────────────────────────────────────────────

// Dirección requerida cuando la cita es de tipo "especial". Sin mapas,
// sin geolocalización, sin coordenadas: todo es texto libre.
const direccionEspecialSchema = z.object({
  municipio_id:      uuid,
  calle:             z.string().min(2, 'Calle requerida').max(200),
  numero_exterior:   z.string().min(1, 'Número exterior requerido').max(20),
  numero_interior:   z.string().max(20).optional(),
  codigo_postal:     z.string().max(10).optional(),
  referencias:       z.string().min(3, 'Agrega una referencia para ubicar el domicilio').max(300),
})

export const crearCitaSchema = z.object({
  nombre_cliente:      nombre,
  telefono_cliente:    telefono,
  salon_id:            uuid,
  servicio_id:         uuid,
  // El cliente ya no elige estilista: se asigna después desde el panel admin.
  estilista_id:        uuid.nullable().optional(),
  fecha_hora:          fechaISO,
  notas:               z.string().max(500).nullable().optional(),
  origen:              z.enum(['internet', 'local']).default('internet'),
  tipo_cita:           z.enum(['normal', 'especial']).default('normal'),
  direccion_especial:  direccionEspecialSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.tipo_cita === 'especial' && !data.direccion_especial) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La dirección es obligatoria para un Servicio Especial',
      path: ['direccion_especial'],
    })
  }
})
export type CrearCitaInput = z.infer<typeof crearCitaSchema>

// ── Usuarios ─────────────────────────────────────────────────
export const crearEstilistaSchema = z.object({
  nombre:    nombre,
  telefono:  telefono,
  email:     z.string().email('Email inválido'),
  password:  z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  salon_id:  uuid,
})
export type CrearEstilistaInput = z.infer<typeof crearEstilistaSchema>

export const crearAdminSchema = z.object({
  nombre:    nombre,
  email:     z.string().email('Email inválido'),
  telefono:  telefono.optional(),
  salon_id:  uuid,
})
export type CrearAdminInput = z.infer<typeof crearAdminSchema>

export const resetPasswordSchema = z.object({
  usuario_id:      uuid,
  nueva_password:  z.string().min(6, 'Contraseña mínimo 6 caracteres'),
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ── Servicios ─────────────────────────────────────────────────
export const crearServicioSchema = z.object({
  salon_id:     uuid,
  nombre:       nombre,
  descripcion:  z.string().max(300).nullable().optional(),
  duracion_min: z.number().int().min(5, 'Mínimo 5 minutos').max(480, 'Máximo 8 horas'),
  precio:       z.number().min(0, 'Precio no puede ser negativo').max(99999, 'Precio demasiado alto'),
})
export type CrearServicioInput = z.infer<typeof crearServicioSchema>

// ── Salones ──────────────────────────────────────────────────
export const crearSalonSchema = z.object({
  nombre:    nombre,
  direccion: z.string().max(200).nullable().optional(),
  telefono:  telefono.optional(),
})
export type CrearSalonInput = z.infer<typeof crearSalonSchema>

// ── Cobertura y Traslados (Municipios) ───────────────────────
export const crearMunicipioSchema = z.object({
  nombre:          z.string().min(2, 'Nombre mínimo 2 caracteres').max(80).trim(),
  cargo_traslado:  z.number().min(0, 'El cargo no puede ser negativo').max(99999),
  orden:           z.number().int().min(0).optional(),
})
export type CrearMunicipioInput = z.infer<typeof crearMunicipioSchema>

export const editarMunicipioSchema = z.object({
  id:              uuid,
  nombre:          z.string().min(2).max(80).trim().optional(),
  cargo_traslado:  z.number().min(0).max(99999).optional(),
  activo:          z.boolean().optional(),
  orden:           z.number().int().min(0).optional(),
})
export type EditarMunicipioInput = z.infer<typeof editarMunicipioSchema>

// ── Servicios Especiales — aprobación ────────────────────────
export const aprobarEspecialSchema = z.object({
  cita_id:      uuid,
  precio_total: z.number().min(0, 'El precio no puede ser negativo').max(999999),
  anticipo:     z.number().min(0, 'El anticipo no puede ser negativo').max(999999),
  notas_admin:  z.string().max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.anticipo > data.precio_total) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El anticipo no puede ser mayor al precio total',
      path: ['anticipo'],
    })
  }
})
export type AprobarEspecialInput = z.infer<typeof aprobarEspecialSchema>

export const rechazarEspecialSchema = z.object({
  cita_id:      uuid,
  notas_admin:  z.string().max(500).optional(),
})
export type RechazarEspecialInput = z.infer<typeof rechazarEspecialSchema>

// ── Configuración del negocio ────────────────────────────────
export const configuracionNegocioSchema = z.object({
  anticipo_minimo: z.number().min(0, 'No puede ser negativo').max(999999),
})
export type ConfiguracionNegocioInput = z.infer<typeof configuracionNegocioSchema>

const horaHHMM = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)')

export const horarioLaboralSchema = z.object({
  dia_semana:   z.number().int().min(0).max(6),
  hora_inicio:  horaHHMM,
  hora_fin:     horaHHMM,
  activo:       z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.hora_fin <= data.hora_inicio) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La hora de fin debe ser posterior a la hora de inicio',
      path: ['hora_fin'],
    })
  }
})
export type HorarioLaboralInput = z.infer<typeof horarioLaboralSchema>

export const horarioEspecialSchema = z.object({
  dia_semana:   z.number().int().min(0).max(6).nullable().optional(),
  fecha:        z.string().date().nullable().optional(),
  hora_inicio:  horaHHMM,
  hora_fin:     horaHHMM,
  motivo:       z.string().max(200).optional(),
  activo:       z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.hora_fin <= data.hora_inicio) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La hora de fin debe ser posterior a la hora de inicio', path: ['hora_fin'] })
  }
  if (data.dia_semana == null && !data.fecha) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Indica un día de la semana o una fecha específica', path: ['fecha'] })
  }
})
export type HorarioEspecialInput = z.infer<typeof horarioEspecialSchema>

export const diaFestivoSchema = z.object({
  fecha:    z.string().date(),
  nombre:   z.string().min(2).max(100).trim(),
  cerrado:  z.boolean().default(true),
})
export type DiaFestivoInput = z.infer<typeof diaFestivoSchema>

// ── Helper: parsear y responder errores de Zod ───────────────
import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export function zodError(err: ZodError): NextResponse {
  const mensaje = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  return NextResponse.json(
    { error: 'Datos inválidos', detalle: mensaje },
    { status: 400 }
  )
}