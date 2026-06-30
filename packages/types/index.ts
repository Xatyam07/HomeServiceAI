export type UserRole = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  walletBalance: number;
  createdAt: Date;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  category: string;
  experienceYrs: number;
  rating: number;
  isAvailable: boolean;
  isVerified: boolean;
  hourlyRate: number;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId?: string;
  serviceType: string;
  description: string;
  status: BookingStatus;
  scheduledTime: Date;
  isEmergency: boolean;
  laborCost: number;
  materialCost: number;
  totalCost: number;
  durationMin: number;
  latitude?: number;
  longitude?: number;
  techLatitude?: number;
  techLongitude?: number;
  etaMinutes?: number;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number;
  comment: string;
  isFlagged: boolean;
  aiSentiment: number;
  createdAt: Date;
}

export interface AIAnalysisReport {
  issue_detected: string;
  explanation: string;
  recommended_service: string;
  urgency: 'EMERGENCY' | 'HIGH' | 'MEDIUM' | 'LOW';
  estimated_complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  confidence: number;
}

export interface AICostEstimate {
  labor_cost_min: number;
  labor_cost_max: number;
  material_cost_min: number;
  material_cost_max: number;
  total_cost_min: number;
  total_cost_max: number;
  duration_minutes: number;
  gst_percent: number;
}
