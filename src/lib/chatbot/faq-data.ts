import type { Salon, Servicio } from '@/types'

export interface FaqItem {
  id: string
  pregunta: string
  respuesta: string
}

export interface FaqCategoria {
  id: string
  etiqueta: string
  emoji: string
  items: FaqItem[]
}

/**
 * Genera las preguntas y respuestas precargadas del chatbot.
 * No usa IA: todo el contenido es texto fijo definido aquí.
 * Algunas respuestas se personalizan con los datos reales del salón
 * (nombre, teléfono, dirección, servicios) cuando están disponibles.
 */
export function getFaqData(salon: Salon | null, servicios: Servicio[] | null): FaqCategoria[] {
  const nombreSalon = salon?.nombre ?? 'nuestro salón'
  const telefono = salon?.telefono
  const direccion = salon?.direccion

  const listaServicios =
    servicios && servicios.length > 0
      ? servicios
          .slice(0, 8)
          .map(s => `• ${s.nombre} — $${Number(s.precio).toLocaleString('es-MX')} (${s.duracion_min} min)`)
          .join('\n')
      : null

  return [
    {
      id: 'agendar',
      etiqueta: 'Cómo agendar',
      emoji: '📅',
      items: [
        {
          id: 'agendar-1',
          pregunta: '¿Cómo agendo una cita?',
          respuesta:
            'Es muy sencillo: toca el botón "Agendar mi cita" en la página principal, elige el servicio, la fecha y la hora que prefieras. No necesitas crear una cuenta.',
        },
        {
          id: 'agendar-2',
          pregunta: '¿Necesito registrarme para agendar?',
          respuesta:
            'No. Puedes agendar tu cita directamente con tu nombre y teléfono, sin necesidad de crear una cuenta ni contraseña.',
        },
        {
          id: 'agendar-3',
          pregunta: '¿Puedo cambiar o cancelar mi cita?',
          respuesta: telefono
            ? `Sí. Para cambiar o cancelar tu cita, comunícate con nosotros al ${telefono} con al menos 2 horas de anticipación.`
            : 'Sí. Para cambiar o cancelar tu cita, comunícate con nosotros con al menos 2 horas de anticipación.',
        },
        {
          id: 'agendar-4',
          pregunta: '¿Qué pasa si llego tarde?',
          respuesta:
            'Procura llegar 5-10 minutos antes de tu hora. Si llegas con más de 15 minutos de retraso, es posible que debamos reprogramar tu cita según la disponibilidad del día.',
        },
      ],
    },
    {
      id: 'servicios',
      etiqueta: 'Servicios y precios',
      emoji: '💇',
      items: [
        {
          id: 'servicios-1',
          pregunta: '¿Qué servicios ofrecen?',
          respuesta: listaServicios
            ? `Estos son algunos de nuestros servicios:\n${listaServicios}\n\nPuedes ver la lista completa y agendar directamente en "Agendar mi cita".`
            : 'Ofrecemos una variedad de servicios de belleza. Puedes ver el listado completo con precios en la sección "Agendar mi cita".',
        },
        {
          id: 'servicios-2',
          pregunta: '¿Cuánto cuestan los servicios?',
          respuesta:
            'Cada servicio tiene su precio publicado al momento de agendar. Los precios pueden variar según el estilo o la duración del trabajo; si tienes dudas, con gusto te cotizamos antes de tu cita.',
        },
        {
          id: 'servicios-3',
          pregunta: '¿Cuánto dura cada servicio?',
          respuesta:
            'La duración estimada aparece junto a cada servicio al momento de agendar, para que puedas organizar tu tiempo con anticipación.',
        },
      ],
    },
    {
      id: 'pagos',
      etiqueta: 'Pagos',
      emoji: '💳',
      items: [
        {
          id: 'pagos-1',
          pregunta: '¿Qué métodos de pago aceptan?',
          respuesta:
            'Aceptamos efectivo y tarjeta. Si necesitas otro método de pago, pregúntanos directamente al momento de tu visita.',
        },
        {
          id: 'pagos-2',
          pregunta: '¿Tengo que pagar un anticipo?',
          respuesta:
            'Por lo general no se requiere anticipo para agendar. El pago se realiza al finalizar tu servicio en el salón.',
        },
      ],
    },
    {
      id: 'ubicacion',
      etiqueta: 'Ubicación y horario',
      emoji: '📍',
      items: [
        {
          id: 'ubicacion-1',
          pregunta: '¿Dónde están ubicados?',
          respuesta: direccion
            ? `Nos encontramos en: ${direccion}.`
            : 'Puedes consultar nuestra dirección exacta llamando al salón; con gusto te ayudamos a llegar.',
        },
        {
          id: 'ubicacion-2',
          pregunta: '¿Cuál es su horario de atención?',
          respuesta:
            'Nuestro horario puede variar según el día. Te recomendamos revisar los horarios disponibles directamente en el calendario al momento de agendar tu cita.',
        },
      ],
    },
    {
      id: 'contacto',
      etiqueta: 'Contacto',
      emoji: '📞',
      items: [
        {
          id: 'contacto-1',
          pregunta: '¿Cómo los contacto directamente?',
          respuesta: telefono
            ? `Puedes llamarnos al ${telefono}. Con gusto resolvemos cualquier duda.`
            : 'Puedes contactarnos a través de los datos de contacto publicados en el salón. Con gusto resolvemos cualquier duda.',
        },
        {
          id: 'contacto-2',
          pregunta: '¿Hablo con una persona real aquí?',
          respuesta: telefono
            ? `Este asistente responde preguntas frecuentes con información predefinida. Para hablar con alguien de ${nombreSalon}, llámanos al ${telefono}.`
            : `Este asistente responde preguntas frecuentes con información predefinida. Para hablar con alguien de ${nombreSalon}, usa nuestros datos de contacto.`,
        },
      ],
    },
  ]
}
