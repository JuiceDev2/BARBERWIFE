'use client'

import { useEffect, useState } from 'react'
import { getServices } from '@/lib/supabase/queries'
import { Service } from '@/types'

export default function ServiceSelector({ 
  onSelect, 
  selected 
}: { 
  onSelect: (services: Service[]) => void 
  selected: Service[] 
}) {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    getServices().then(setServices)
  }, [])

  const toggleService = (service: Service) => {
    if (selected.find(s => s.id === service.id)) {
      onSelect(selected.filter(s => s.id !== service.id))
    } else {
      onSelect([...selected, service])
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Selecciona tus Servicios</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <div 
            key={service.id}
            onClick={() => toggleService(service)}
            className={`p-6 border-2 rounded-2xl cursor-pointer transition-all ${selected.some(s => s.id === service.id) ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-xl">{service.name}</h3>
                <p className="text-gray-600 mt-1">{service.description}</p>
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl font-bold">${service.price}</div>
                <div className="text-sm text-gray-500">{service.duration_minutes} min</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
