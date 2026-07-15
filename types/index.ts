// types/index.ts

export type UserRole = 'admin' | 'stylist' | 'client' | 'guest';

export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export type ServiceCategory = 'hair' | 'makeup' | 'nails' | 'skin' | 'other';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  category: ServiceCategory;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  client_id: string | null;
  guest_name?: string;
  guest_phone?: string;
  stylist_id?: string;
  status: AppointmentStatus;
  scheduled_at: string;
  start_time: string;
  end_time: string;
  total_price: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentService {
  id: string;
  appointment_id: string;
  service_id: string;
  price_at_time: number;
  service?: Service;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity_available: number;
  image_url?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventorySupply {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  supplier?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  appointment_id: string;
  stylist_id: string;
  client_id?: string;
  subtotal: number;
  products_total: number;
  total: number;
  payment_method: PaymentMethod;
  status: 'pending' | 'completed' | 'cancelled';
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  product?: Product;
}

export interface Ticket {
  id: string;
  sale_id: string;
  ticket_number: string;
  html_content: string;
  pdf_url?: string;
  shared_at?: string;
  created_at: string;
}

export interface BookingState {
  selectedServices: Service[];
  selectedDate: Date | null;
  selectedTimeSlot: string | null;
  clientData: {
    type: 'guest' | 'registered';
    name: string;
    phone: string;
    email?: string;
  } | null;
}

export interface AvailableTimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

export interface NotificationQueue {
  id: string;
  appointment_id: string;
  recipient_phone: string;
  message: string;
  type: 'confirmation' | 'reminder' | 'completion';
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  sent_at?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
