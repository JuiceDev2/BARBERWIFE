export type Rol = 'propietaria' | 'admin' | 'estilista'
export type EstadoCita = 'confirmada' | 'en_curso' | 'completada' | 'cancelada'
export type OrigenCita = 'internet' | 'local'
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'

// ── Wizard de citas / Servicios Especiales ───────────────────
export type TipoCita = 'normal' | 'especial'

// Flujo de validación/anticipo (columna `estado_cita`). Distinto del
// campo legacy `estado`, que sigue usando el panel de cobro/estilista.
export type EstadoCitaFlujo =
  | 'pendiente_validacion'
  | 'pendiente_anticipo'
  | 'confirmada'
  | 'en_proceso'
  | 'finalizada'
  | 'cancelada'

export interface Salon {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Perfil {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: Rol
  salon_id: string | null
  activo: boolean
  created_at: string
  updated_at: string
  salon?: Salon
}

export interface Servicio {
  id: string
  salon_id: string
  nombre: string
  descripcion: string | null
  duracion_min: number
  precio: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Municipio {
  id: string
  salon_id: string
  nombre: string
  cargo_traslado: number
  activo: boolean
  orden: number
  created_at: string
  updated_at: string
}

export interface ConfiguracionNegocio {
  salon_id: string
  anticipo_minimo: number
  updated_at: string
}

export interface HorarioLaboral {
  id: string
  salon_id: string
  dia_semana: number // 0=domingo … 6=sábado
  hora_inicio: string // 'HH:MM:SS'
  hora_fin: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface HorarioEspecial {
  id: string
  salon_id: string
  dia_semana: number | null
  fecha: string | null
  hora_inicio: string
  hora_fin: string
  motivo: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface DiaFestivo {
  id: string
  salon_id: string
  fecha: string
  nombre: string
  cerrado: boolean
  activo: boolean
  created_at: string
}

export interface CitaHistorial {
  id: string
  cita_id: string
  salon_id: string
  evento: string
  detalle: Record<string, unknown> | null
  usuario_id: string | null
  rol_usuario: string | null
  created_at: string
  usuario?: Perfil
}

export interface Cliente {
  id: string
  salon_id: string
  nombre: string
  telefono: string
  notas: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Cita {
  id: string
  salon_id: string
  cliente_id: string
  estilista_id: string | null
  servicio_id: string
  fecha_hora: string
  duracion_min: number
  origen: OrigenCita
  estado: EstadoCita
  notas: string | null
  activo: boolean
  created_at: string
  updated_at: string
  // Servicios Especiales (V2)
  tipo_cita: TipoCita
  estado_cita: EstadoCitaFlujo
  municipio_id: string | null
  calle: string | null
  numero_exterior: string | null
  numero_interior: string | null
  codigo_postal: string | null
  referencias: string | null
  precio_total: number | null
  anticipo: number
  saldo_pendiente: number
  requiere_traslado: boolean
  notas_admin: string | null
  // joins
  cliente?: Cliente
  estilista?: Perfil
  servicio?: Servicio
  municipio?: Municipio
  historial?: CitaHistorial[]
}

export interface Cobro {
  id: string
  salon_id: string
  cita_id: string | null
  estilista_id: string | null
  cliente_id: string | null
  servicio_id: string | null
  monto: number
  metodo_pago: MetodoPago
  notas: string | null
  activo: boolean
  fecha: string
  created_at: string
  // joins
  cita?: Cita
  estilista?: Perfil
  cliente?: Cliente
  servicio?: Servicio
}

export interface Ticket {
  id: string
  cobro_id: string
  salon_id: string
  numero_ticket: number
  datos_json: {
    salon: string
    direccion: string | null
    cliente: string
    telefono: string
    servicio: string
    estilista: string
    monto: number
    metodo: MetodoPago
    fecha: string
    notas: string | null
  }
  impreso: boolean
  fecha: string
  created_at: string
}

export interface Turno {
  id: string
  salon_id: string
  admin_id: string
  apertura: string
  cierre: string | null
  activo: boolean
  created_at: string
  admin?: Perfil
}

export interface ActividadLog {
  id: string
  salon_id: string | null
  usuario_id: string | null
  rol_usuario: string | null
  accion: string
  entidad: string | null
  entidad_id: string | null
  detalle: Record<string, unknown> | null
  ip: string | null
  created_at: string
  usuario?: Perfil
}

// ── Formularios ──────────────────────────────────────────────

// El cliente NUNCA elige estilista: se asigna después desde el panel admin.
export interface DireccionEspecialForm {
  municipio_id: string
  calle: string
  numero_exterior: string
  numero_interior?: string
  codigo_postal?: string
  referencias: string
}

export interface AgendarCitaForm {
  nombre_cliente: string
  telefono_cliente: string
  salon_id: string
  servicio_id: string
  fecha_hora: string
  notas?: string
  tipo_cita: TipoCita
  direccion_especial?: DireccionEspecialForm
}

export interface NuevoMunicipioForm {
  nombre: string
  cargo_traslado: number
  orden?: number
}

export interface EditarMunicipioForm {
  id: string
  nombre?: string
  cargo_traslado?: number
  activo?: boolean
  orden?: number
}

export interface AprobarEspecialForm {
  cita_id: string
  precio_total: number
  anticipo: number
  notas_admin?: string
}

export interface ConfiguracionNegocioForm {
  anticipo_minimo: number
}

export interface HorarioLaboralForm {
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  activo?: boolean
}

export interface HorarioEspecialForm {
  dia_semana?: number | null
  fecha?: string | null
  hora_inicio: string
  hora_fin: string
  motivo?: string
  activo?: boolean
}

export interface DiaFestivoForm {
  fecha: string
  nombre: string
  cerrado?: boolean
}

export interface NuevaCitaLocalForm {
  nombre_cliente: string
  telefono_cliente: string
  servicio_id: string
  notas?: string
}

export interface NuevoServicioForm {
  nombre: string
  descripcion?: string
  duracion_min: number
  precio: number
}

export interface NuevoClienteForm {
  nombre: string
  telefono: string
  notas?: string
}

export interface NuevoSalonForm {
  nombre: string
  direccion?: string
  telefono?: string
}

export interface NuevoAdminForm {
  nombre: string
  email: string
  telefono?: string
  salon_id: string
}

export interface NuevoEstilistaForm {
  nombre: string
  telefono: string
}

// ── Stats ────────────────────────────────────────────────────

export interface StatsSalon {
  salon_id: string
  salon_nombre: string
  ingresos_hoy: number
  ingresos_mes: number
  citas_hoy: number
  citas_mes: number
  clientes_total: number
  citas_pendientes: number
}

export interface StatsGlobales {
  salones_activos: number
  ingresos_totales_mes: number
  citas_totales_hoy: number
  por_salon: StatsSalon[]
}
