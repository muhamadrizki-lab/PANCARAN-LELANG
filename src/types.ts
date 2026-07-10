export interface Bid {
  id: string;
  name: string;
  email: string;
  contact: string;
  price: number;
  timestamp: string;
  scheduleSurveyDate?: string;
  scheduleSurveyTime?: string;
}

export type AssetStatus = 'Open' | 'Sold';

export interface Asset {
  id: string;
  name: string;
  brand: string;
  category: string;
  modelYear: number;
  plateNumber: string;
  condition: string;
  location: string;
  description: string;
  startingPrice: number;
  highestBid: number;
  status: AssetStatus;
  imageUrl: string;
  imageUrls?: string[];
  bids: Bid[];
}

export interface AdminUser {
  email: string;
  name: string;
  role: string;
  createdAt: string;
  password?: string;
}

export interface Brand {
  id: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Condition {
  id: string;
  name: string;
  createdAt: string;
}

export interface RegisteredUser {
  email: string;
  name: string;
  phone: string;
  password?: string;
  status: 'Menunggu Verifikasi' | 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  emailVerified: boolean;
  verificationCode: string;
  createdAt: string;
}

export interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'bid' | 'sync';
  title: string;
  message: string;
  timestamp: Date;
  assetId?: string;
}
