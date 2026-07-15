import Link from 'next/link'
import Hero from '@/components/landing/Hero'

export default function Home() {
  return (
    <main>
      <Hero />
      {/* Other sections */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <Link 
            href="/agendar" 
            className="inline-block bg-purple-600 text-white px-8 py-4 rounded-full text-xl font-semibold hover:bg-purple-700 transition"
          >
            Agendar Cita Ahora
          </Link>
        </div>
      </div>
    </main>
  )
}
