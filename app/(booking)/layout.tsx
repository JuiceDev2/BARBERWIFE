import { Toaster } from 'sonner'

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-semibold text-xl">Estética Alejandra</div>
          <a href="/" className="text-purple-600 hover:underline">Inicio</a>
        </div>
      </nav>
      {children}
    </div>
  )
}
