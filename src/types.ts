export interface Listing {
  id: string;
  title: string;
  type: 'apartment' | 'villa' | 'plot' | 'commercial' | 'penthouse';
  status: 'for-sale' | 'for-rent' | 'sold' | 'upcoming';
  projectCategory: 'completed' | 'upcoming';
  locality: string;
  address: string;
  price: string;           // e.g. "₹1.2 Cr" or "₹45,000/mo"
  priceValue: number;      // numeric for sorting
  bedrooms?: number;
  bathrooms?: number;
  carpetArea?: string;     // e.g. "1,200 sq. ft."
  totalArea?: string;
  floors?: number;
  flats?: number;
  shops?: number;
  possession?: string;     // e.g. "Dec 2025" or "Ready to Move"
  wing?: string;
  description: string[];
  features: string[];
  amenities: string[];
  images: string[];        // base64 or URLs
  featured: boolean;
  createdAt: string;
  badge?: string;
  floorPlan?: string;      // PDF for floor plans
  brochure?: string;       // PDF for project brochure
}

export interface AdminCredentials {
  username: string;
  password: string;
}
