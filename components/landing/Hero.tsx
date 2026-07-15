'use client'

import Link from 'next/link'

export default function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 text-white flex items-center relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-7xl font-bold tracking-tight mb-6 font-playfair">
            Belleza que <span className="text-pink-300">transforma</span>
          </h1>
          <p className="text-2xl mb-10 text-purple-100">
            Estética unisex profesional. Agenda tu cita hoy y luce radiante.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/agendar" 
              className="bg-white text-purple-900 px-10 py-4 rounded-full text-xl font-semibold hover:bg-gray-100 transition inline-block text-center"
            >
              Agendar Cita
            </Link>
            <Link 
              href="#servicios" 
              className="border-2 border-white px-10 py-4 rounded-full text-xl font-semibold hover:bg-white/10 transition inline-block text-center"
            >
              Ver Servicios
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        ↓
      </div>
    </div>
  )
}
