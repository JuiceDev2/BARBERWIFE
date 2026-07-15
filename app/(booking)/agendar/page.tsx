'use client'

import { useState } from 'react'
import ServiceSelector from '@/components/booking/ServiceSelector'
import { createGuestAppointment } from '@/lib/actions/booking'
import { toast } from 'sonner'

export default function BookingPage() {
  const [step, setStep] = useState(1)
  const [selectedServices, setSelectedServices] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '' })

  const handleSubmit = async () => {
    try {
      await createGuestAppointment({
        selectedServices,
        selectedDate,
        selectedTimeSlot: selectedTime,
        clientData
      })
      toast.success('Cita agendada con éxito!')
      setStep(5)
    } catch (e) {
      toast.error('Error al agendar')
    }
  }

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="flex justify-between mb-8">
          {[1,2,3,4,5].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center ${step === s ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>
              {s}
            </div>
          ))}
        </div>

        {step === 1 && <ServiceSelector onSelect={setSelectedServices} selected={selectedServices} />}

        {step === 2 && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Elige una Fecha</h2>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full max-w-xs"
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Elige un Horario</h2>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`px-4 py-3 rounded-xl border-2 transition-all ${selectedTime === time ? 'border-purple-600 bg-purple-50 font-semibold' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Datos del Cliente</h2>
            <div className="space-y-4 max-w-md">
              <input
                type="text"
                placeholder="Nombre completo"
                value={clientData.name}
                onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={clientData.phone}
                onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full"
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={clientData.email}
                onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 w-full"
              />
            </div>
            <button onClick={handleSubmit} className="mt-6 bg-green-600 text-white px-8 py-3 rounded">Confirmar Cita</button>
          </div>
        )}
        {step === 5 && <div>¡Cita Confirmada! Gracias.</div>}

        <div className="mt-8 flex justify-between">
          {step > 1 && <button onClick={() => setStep(s => s-1)} className="px-6 py-3 border">Anterior</button>}
          {step < 4 && <button onClick={() => setStep(s => s+1)} className="px-6 py-3 bg-purple-600 text-white">Siguiente</button>}
        </div>
      </div>
    </div>
  )
}
