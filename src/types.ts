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
  condition: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Butuh Perbaikan';
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
}
