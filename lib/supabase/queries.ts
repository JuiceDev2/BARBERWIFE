import { createServerSupabaseClient } from './server'
import { Service, Appointment, User, Sale } from '@/types'

export async function getServices(includeInactive = false) {
  const supabase = await createServerSupabaseClient()
  let query = supabase.from('services').select('*').order('name')

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Service[]
}

export async function getTodayAppointments(statuses: string[] = ['confirmed', 'in_progress']) {
  const supabase = await createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:user:client_id(*),
      services:appointment_services(
        *,
        service:service_id(*)
      )
    `)
    .eq('scheduled_at', today)
    .in('status', statuses)
    .order('start_time')

  if (error) throw error
  return data as any[]
}

export async function getDashboardMetrics() {
  const supabase = await createServerSupabaseClient()
  const today = new Date().toISOString().split('T')[0]

  // Today appointments
  const { count: appointmentsCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('scheduled_at', today)

  // Confirmed
  const { count: confirmedCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('scheduled_at', today)
    .eq('status', 'confirmed')

  // Completed today
  const { count: completedCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('scheduled_at', today)
    .eq('status', 'completed')

  // Revenue
  const { data: todaySales } = await supabase
    .from('sales')
    .select('total')
    .eq('paid_at', today) // Approximate

  const totalRevenue = (todaySales || []).reduce((sum: number, s: any) => sum + (s.total || 0), 0)

  return {
    appointmentsCount: appointmentsCount || 0,
    confirmedCount: confirmedCount || 0,
    completedCount: completedCount || 0,
    totalRevenue
  }
}

export async function getClientPurchaseHistory(clientId: string, offset = 0, limit = 10) {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      sale_items (
        *,
        product:products (*)
      )
    `)
    .eq('client_id', clientId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data
}

// Add more queries as needed...
