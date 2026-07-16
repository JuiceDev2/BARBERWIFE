'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

const supabase = createClient()

// ✅ Variables de entorno con valor por defecto para evitar errores de tipo
const ID_CLIENTE_PISO = process.env.NEXT_PUBLIC_ID_CLIENTE_PISO || ''
const ID_SALON_DEFECTO = process.env.NEXT_PUBLIC_SALON_ID || ''

interface Servicio {
  id: string
  nombre: string
  precio: number | string
}

interface ItemCarrito {
  servicio: Servicio
  cantidad: number
}

interface Cliente {
  id: string
  nombre: string
}

// 👇 Helper para normalizar montos a centavos exactos y evitar errores
// de punto flotante en JavaScript (ej. 0.1 + 0.2 !== 0.3)
function redondear(monto: number): number {
  return Math.round(monto * 100) / 100
}

export default function CobrarPage() {
  const params = useParams()
  const router = useRouter()
  const turnoId = Array.isArray(params.id) ? params.id[0] : params.id
  
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  
  const [esClientePiso, setEsClientePiso] = useState(true)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>(ID_CLIENTE_PISO)
  
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [pagoRecibido, setPagoRecibido] = useState<string>('')
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    async function loadData() {
      if (!ID_CLIENTE_PISO) {
        console.warn('Falta variable NEXT_PUBLIC_ID_CLIENTE_PISO')
        setCargando(false)
        return
      }

      const [serviciosRes, clientesRes] = await Promise.all([
        supabase.from('servicios').select('*').eq('activo', true),
        supabase.from('clientes').select('id, nombre').eq('activo', true).neq('id', ID_CLIENTE_PISO)
      ])
      
      if (serviciosRes.data) setServicios(serviciosRes.data)
      if (clientesRes.data) setClientes(clientesRes.data)
      setCargando(false)
    }
    loadData()
  }, [])

  // 👇 Total redondeado a centavos exactos (evita arrastrar decimales binarios)
  const total = redondear(
    carrito.reduce((acc, item) => {
      const precio = typeof item.servicio.precio === 'string' ? parseFloat(item.servicio.precio) : item.servicio.precio
      return acc + (precio * item.cantidad)
    }, 0)
  )

  const agregar = (s: Servicio) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.servicio.id === s.id)
      if (existe) return prev.map(i => i.servicio.id === s.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { servicio: s, cantidad: 1 }]
    })
  }

  const quitar = (id: string) => {
    setCarrito(prev => prev.map(i => i.servicio.id === id ? { ...i, cantidad: i.cantidad - 1 } : i).filter(i => i.cantidad > 0))
  }

  const tecla = (k: string) => {
    if (k === 'C') setPagoRecibido('')
    else if (k === '⌫') setPagoRecibido(p => p.slice(0, -1))
    else if (k === '.') {
      // Evita más de un punto decimal
      setPagoRecibido(p => (p.includes('.') ? p : p + k))
    }
    else setPagoRecibido(p => p + k)
  }

  const registrarServicio = async () => {
    if (!ID_CLIENTE_PISO || !ID_SALON_DEFECTO) {
      return alert('⚠️ Error de configuración: Faltan variables de entorno.')
    }

    if (!esClientePiso && !clienteSeleccionado) {
      return alert('⚠️ Selecciona un cliente o activa "Cliente de Piso".')
    }

    // 👇 Ambos montos redondeados a centavos antes de comparar
    const pago = redondear(parseFloat(pagoRecibido) || 0)
    const totalActual = redondear(total)

    if (pago < totalActual) return alert('⚠️ El pago recibido es insuficiente.')
    if (!turnoId) return alert('Error: No hay turno seleccionado.')
    
    setProcesando(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Error de sesión.')
      setProcesando(false)
      return
    }

    const grupoVentaId = crypto.randomUUID()
    const finalClienteId = esClientePiso ? ID_CLIENTE_PISO : clienteSeleccionado

    const itemsParaDB = carrito.map(item => ({
      servicio_id: item.servicio.id,
      monto: typeof item.servicio.precio === 'string' ? parseFloat(item.servicio.precio) : item.servicio.precio
    }))

    const { error } = await supabase.rpc('procesar_cobro_turno', {
      p_turno_id: turnoId,
      p_salon_id: ID_SALON_DEFECTO,
      p_admin_id: user.id,
      p_cliente_id: finalClienteId,
      p_grupo_id: grupoVentaId,
      p_metodo_pago: 'efectivo',
      p_total_cuenta: totalActual,
      p_pago_recibido: pago,
      p_items: itemsParaDB,
      p_cerrar_turno: false
    })

    if (error) {
      console.error(error)
      alert('❌ Error: ' + error.message)
    } else {
      const continuar = window.confirm(
        `¡Servicio registrado con éxito! 🌟\n\n¿Lista para el siguiente servicio?`
      )
      
      if (continuar) {
        setCarrito([])
        setPagoRecibido('')
      } else {
        router.push('/')
      }
    }
    setProcesando(false)
  }

  if (cargando) return <div className="h-screen flex items-center justify-center bg-stone-50">Cargando caja...</div>

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen bg-stone-100 font-sans text-stone-900 md:overflow-hidden">
      {/* IZQUIERDA: SERVICIOS */}
      <div className="w-full md:w-2/3 p-4 md:p-6 md:overflow-y-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-stone-800">Cobrar Turno</h1>
            <p className="text-stone-500 text-sm">Turno: {turnoId}</p>
          </div>
          <button onClick={() => router.back()} className="px-4 py-2 text-stone-500 hover:bg-stone-200 rounded-lg">Cancelar</button>
        </header>

        {/* Selector Cliente */}
        <div className="mb-6 bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-stone-800">
              {esClientePiso ? '🚶 Cliente de Piso' : '📅 Cliente Registrado'}
            </h3>
            <p className="text-sm text-stone-500">
              {esClientePiso ? 'Venta rápida sin datos.' : 'Selecciona un cliente.'}
            </p>
          </div>
          <button
            onClick={() => {
              setEsClientePiso(!esClientePiso)
              setClienteSeleccionado(!esClientePiso ? ID_CLIENTE_PISO : '')
            }}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${esClientePiso ? 'bg-stone-800' : 'bg-stone-300'}`}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${esClientePiso ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {!esClientePiso && (
          <div className="mb-6 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <select 
              value={clienteSeleccionado} 
              onChange={(e) => setClienteSeleccionado(e.target.value)}
              className="w-full p-3 rounded-lg border border-stone-300 bg-stone-50"
            >
              <option value="">-- Seleccionar Cliente --</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {servicios.map(s => (
            <button 
              key={s.id} 
              onClick={() => agregar(s)} 
              className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all active:scale-95 flex flex-col items-center justify-center gap-2 h-40"
            >
              <span className="text-2xl">💇‍♀️</span>
              <span className="font-semibold text-lg text-center">{s.nombre}</span>
              <span className="text-stone-500 font-mono">${(typeof s.precio === 'string' ? parseFloat(s.precio) : s.precio).toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* DERECHA: CAJA */}
      <div className="w-full md:w-1/3 bg-white border-t md:border-t-0 md:border-l border-stone-200 flex flex-col shadow-2xl">
        <div className="flex-1 p-4 md:p-6 md:overflow-y-auto border-b border-stone-200 bg-stone-50">
          <h2 className="text-lg font-bold text-stone-700 mb-4">Resumen</h2>
          {carrito.length === 0 ? (
            <p className="text-stone-400 text-center mt-10">Selecciona servicios...</p>
          ) : (
            <div className="space-y-3">
              {carrito.map(item => (
                <div key={item.servicio.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-stone-100">
                  <div>
                    <p className="font-semibold text-sm">{item.servicio.nombre}</p>
                    <p className="text-xs text-stone-500">${(typeof item.servicio.precio === 'string' ? parseFloat(item.servicio.precio) : item.servicio.precio).toLocaleString()} x {item.cantidad}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => quitar(item.servicio.id)} className="w-7 h-7 rounded bg-stone-200 hover:bg-stone-300 font-bold">-</button>
                    <span className="w-4 text-center font-mono">{item.cantidad}</span>
                    <button onClick={() => agregar(item.servicio)} className="w-7 h-7 rounded bg-stone-800 text-white hover:bg-stone-700 font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 bg-white">
          <div className="flex justify-between items-end mb-4">
            <span className="text-stone-500">Total</span>
            <span className="text-4xl font-bold text-stone-900">${total.toLocaleString()}</span>
          </div>

          <div className="bg-stone-100 p-4 rounded-xl mb-4 text-right border border-stone-200">
            <span className="text-xs text-stone-500 uppercase font-bold">Recibido</span>
            <div className="text-3xl font-mono text-stone-800 h-10">{pagoRecibido || '0'}</div>
            {redondear(parseFloat(pagoRecibido) || 0) >= total && total > 0 && (
              <div className="text-green-600 text-sm font-bold mt-1">Cambio: ${(redondear(parseFloat(pagoRecibido) || 0) - total).toLocaleString()}</div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(k => (
              <button 
                key={k} 
                onClick={() => tecla(k)} 
                className={`p-3 rounded-lg text-xl font-bold shadow-sm active:scale-95 ${k==='C'?'bg-red-100 text-red-600':k==='⌫'?'bg-stone-200 text-stone-700':'bg-stone-50 border border-stone-200'}`}
              >
                {k}
              </button>
            ))}
          </div>

          <button 
            onClick={registrarServicio} 
            disabled={carrito.length === 0 || (!esClientePiso && !clienteSeleccionado) || procesando}
            className="w-full bg-stone-900 text-white py-5 rounded-xl text-xl font-bold hover:bg-stone-800 disabled:opacity-50 shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {procesando ? 'Procesando...' : '✨ REGISTRAR SERVICIO'}
          </button>
          
          <p className="text-center text-xs text-stone-400 mt-3">
            ℹ️ El turno permanece abierto.
          </p>
        </div>
      </div>
    </div>
  )
}
