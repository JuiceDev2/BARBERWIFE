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
        {step === 2 && <div>Calendar Picker Placeholder</div>}
        {step === 3 && <div>Time Slots</div>}
        {step === 4 && (
          <div>
            <h2>Datos del Cliente</h2>
            {/* Form */}
            <button onClick={handleSubmit} className="mt-4 bg-green-600 text-white px-8 py-3 rounded">Confirmar Cita</button>
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
