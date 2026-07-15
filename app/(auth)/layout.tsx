import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="block text-center font-playfair font-bold text-2xl text-white mb-8"
        >
          Estética Alejandra
        </Link>
        <div className="bg-white rounded-2xl shadow-xl p-8">{children}</div>
      </div>
    </div>
  )
}
