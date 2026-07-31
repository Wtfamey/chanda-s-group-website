import { Listing } from './types';

// Real project images
import daffodilImg    from './assets/projects/daffodil-heights.png';
import daffodilPostImg from './assets/projects/daffodil-post.jpg';
import daffodilsImg   from './assets/projects/daffodils.jpg';
import orchidImg      from './assets/projects/orchid.jpg';
import marigoldImg    from './assets/projects/marigold.png';
import tulipImg       from './assets/projects/tulip.jpg';
import infinityBImg   from './assets/projects/infinity-b-wing.jpg';
import irisImg        from './assets/projects/iris.jpg';
import infinityAWingImg from './assets/projects/infinity-a-wing.jpg';
import cubixImg       from './assets/projects/cubix.jpg';
import floorPlansPdf  from './assets/docs/floor-plans-infinity.pdf';
import daffodilBrochurePdf from './assets/docs/daffodil-heights-brochure.pdf';
import daffodilsDWBrochurePdf from './assets/docs/daffodils-d-wing-brochure.pdf';
import orchidBrochurePdf from './assets/docs/orchid-brochure.pdf';
import marigoldBrochurePdf from './assets/docs/marigold-brochure.pdf';
import tulipBrochurePdf from './assets/docs/tulip-brochure.pdf';
import { supabase } from './supabase';
import { fetchListings, seedListings } from './supabaseService';

// Fallback for projects without dedicated photos
const FALLBACK_RESIDENTIAL = 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800';
const FALLBACK_COMMERCIAL  = 'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=800';
const FALLBACK_UPCOMING    = 'https://images.pexels.com/photos/2476632/pexels-photo-2476632.jpeg?auto=compress&cs=tinysrgb&w=800';

export const DEFAULT_LISTINGS: Listing[] = [
  {
    id: 'infinity-tower-a',
    title: 'Infinity Tower – A Wing',
    type: 'apartment',
    status: 'for-sale',
    projectCategory: 'completed',
    locality: 'Koperkhairane',
    address: 'Sector 2A, Koperkhairane, Navi Mumbai',
    price: '₹1.8 Cr',
    priceValue: 18000000,
    bedrooms: 3,
    bathrooms: 2,
    carpetArea: '1,350 sq. ft.',
    totalArea: '1,800 sq. ft.',
    floors: 26,
    flats: 44,
    possession: 'Ready to Move',
    description: [
      'A landmark 26-storey architectural marvel in a prime locality of Koperkhairane.',
      'Offering spacious 2 BHK and 3 BHK luxury residences with impeccable aesthetics and panoramic views.',
      'Developed with uncompromised structural design, contemporary luxury needs, and premium finishes throughout.',
    ],
    features: ['26-Storey Premium Tower', 'Round Panoramic Balconies', 'Prime Metro Connectivity', '2 BHK & 3 BHK Formats', 'Elegant Entrance Deck', 'Modular Kitchen'],
    amenities: ['Swimming Pool', 'Gymnasium', 'Clubhouse', 'Jogging Track', "Children's Play Area", 'Power Backup', '24/7 Security', 'Visitor Parking'],
    images: [infinityAWingImg, irisImg],
    floorPlan: floorPlansPdf,
    featured: true,
    createdAt: '2024-01-01',
    badge: 'Flagship',
  },
  {
    id: 'daffodil-heights',
    title: 'Daffodil Heights',
    type: 'apartment',
    status: 'for-sale',
    projectCategory: 'completed',
    locality: 'Bhandup',
    address: 'Sai Vihar T.P. Road, Bhandup (West), Mumbai',
    price: '₹95 L',
    priceValue: 9500000,
    bedrooms: 2,
    bathrooms: 2,
    carpetArea: '850 sq. ft.',
    totalArea: '1,100 sq. ft.',
    flats: 255,
    possession: 'Ready to Move',
    description: [
      'A monumental premium residential complex in the lush central zone of Sai Vihar, Bhandup West.',
      'Spanning 2,50,000 sq. ft. with all premium amenities and modern infrastructure.',
      'Spacious and efficient layouts with ultra-convenient high-speed connectivity.',
    ],
    features: ['2,50,000 Sq. Ft. Area', '255 Luxurious Flats', 'High-Speed Lifts', 'Contemporary Clubhouse', 'Vastu Compliant'],
    amenities: ['Gymnasium', 'Clubhouse', "Children's Play Area", 'Power Backup', '24/7 Security', 'Covered Parking'],
    images: [daffodilImg, daffodilPostImg, daffodilsImg],
    brochure: daffodilBrochurePdf,
    featured: true,
    createdAt: '2024-01-02',
  },
  {
    id: 'infinity-tower-b',
    title: 'Infinity Tower – B Wing',
    type: 'penthouse',
    status: 'upcoming',
    projectCategory: 'upcoming',
    locality: 'Koperkhairane',
    address: 'Sector 2A, Koperkhairane, Navi Mumbai',
    price: '₹3.2 Cr',
    priceValue: 32000000,
    bedrooms: 4,
    bathrooms: 4,
    carpetArea: '2,800 sq. ft.',
    flats: 44,
    possession: 'Jun 2026',
    wing: 'B Wing',
    description: [
      'Phase 2 elite expansion with 44 ultra-exclusive premium residences.',
      'Each residence includes dedicated personal parking on the same floor — a first in Navi Mumbai.',
      'Only 2 expansive flats per floor for ultimate privacy and unmatched lifestyle.',
    ],
    features: ['Personal Car-Lift to Doorstep', '2 Flats Per Floor Only', 'Rooftop Infinity Deck', 'Smart Home Systems', 'Private Terrace'],
    amenities: ['Private Elevator', 'Infinity Pool', 'Wine Lounge', 'Home Automation', 'Concierge Service', 'Valet Parking'],
    images: [infinityBImg],
    featured: true,
    createdAt: '2024-01-04',
    badge: 'Ultra Luxury',
  },
  {
    id: 'orchid-apartments',
    title: 'Orchid Apartments',
    type: 'apartment',
    status: 'for-sale',
    projectCategory: 'completed',
    locality: 'Ghansoli',
    address: 'Sector 21, Ghansoli, Navi Mumbai',
    price: '₹72 L',
    priceValue: 7200000,
    bedrooms: 2,
    bathrooms: 2,
    carpetArea: '720 sq. ft.',
    totalArea: '35,000 sq. ft.',
    flats: 38,
    possession: 'Ready to Move',
    description: [
      'Total saleable area of approximately 35,000 sq. ft. in prime Ghansoli.',
      '38 thoughtfully designed spacious flats with efficient and airy layouts.',
      'Outstanding local connectivity to metro and highways.',
    ],
    features: ['Prime Ghansoli Location', 'Cross Ventilation', 'Community Lobbies', 'Vastu Compliant'],
    amenities: ["Children's Play Area", '24/7 Security', 'Power Backup', 'Covered Parking', 'Common Garden'],
    images: [orchidImg],
    brochure: orchidBrochurePdf,
    featured: false,
    createdAt: '2024-01-05',
  },
  {
    id: 'marigold-apartments',
    title: 'Marigold Apartments',
    type: 'apartment',
    status: 'for-sale',
    projectCategory: 'completed',
    locality: 'Ghansoli',
    address: 'Sector 21, Ghansoli, Navi Mumbai',
    price: '₹58 L',
    priceValue: 5800000,
    bedrooms: 2,
    bathrooms: 1,
    carpetArea: '620 sq. ft.',
    totalArea: '14,000 sq. ft.',
    possession: 'Ready to Move',
    description: [
      'A curated compact residential development with premium finishes and efficient urban spaces.',
      'Total saleable area of approximately 14,000 sq. ft.',
      'Convenient near-door access to all premium urban amenities.',
    ],
    features: ['Energy-Efficient Fittings', 'Granite Entrance Lobby', '24/7 Security', 'Near Commercial Sectors'],
    amenities: ['Power Backup', '24/7 Security', 'Covered Parking', 'Common Garden'],
    images: [marigoldImg],
    brochure: marigoldBrochurePdf,
    featured: false,
    createdAt: '2024-01-06',
  },
  {
    id: 'tulip-apartments',
    title: 'Tulip Apartments',
    type: 'apartment',
    status: 'for-sale',
    projectCategory: 'completed',
    locality: 'Koperkhairane',
    address: 'Plot 27H, Sector 11, Koperkhairane, Navi Mumbai',
    price: '₹68 L',
    priceValue: 6800000,
    bedrooms: 2,
    bathrooms: 2,
    carpetArea: '700 sq. ft.',
    totalArea: '12,600 sq. ft.',
    flats: 16,
    possession: 'Ready to Move',
    description: [
      'An elegant and peaceful boutique building on Plot 27H, Sector 11 Koperkhairane.',
      'Carrying a beautiful footprint of 12,600 sq. ft. consisting of 16 modern flats.',
    ],
    features: ['Boutique 16-Unit Building', 'Peaceful Locality', 'Efficient Layout', 'Prime Sector 11'],
    amenities: ['24/7 Security', 'Power Backup', 'Covered Parking'],
    images: [tulipImg],
    brochure: tulipBrochurePdf,
    featured: false,
    createdAt: '2024-01-07',
  },
  {
    id: 'greenfield-heights',
    title: 'Greenfield Heights',
    type: 'apartment',
    status: 'upcoming',
    projectCategory: 'upcoming',
    locality: 'Chembur',
    address: 'CTS 41pt–50pt, Chembur, Mumbai',
    price: '₹2.5 Cr',
    priceValue: 25000000,
    bedrooms: 4,
    bathrooms: 3,
    carpetArea: '2,100 sq. ft.',
    totalArea: '4,06,000 sq. ft.',
    possession: 'Dec 2027',
    description: [
      'Our most monumental upcoming mixed-use landmark spanning 4,06,000 sq. ft. of luxury development.',
      'Super-premium towers, luxury commercial complexes, and modern gardens in prime Chembur.',
      'Setting a new benchmark for luxury real estate with world-class amenities.',
    ],
    features: ['4,06,000 Sq. Ft. Masterplan', 'Olympic-Sized Rooftop Pool', 'Grand Community Club', 'Green Gold Certification', 'Smart Home Automation'],
    amenities: ['Rooftop Pool', 'Spa', 'Business Lounge', 'Mini Theatre', 'Squash Court', 'Concierge', 'EV Charging', 'Sky Garden'],
    images: [FALLBACK_UPCOMING],
    featured: true,
    createdAt: '2024-01-03',
    badge: 'Mega Project',
  },
  {
    id: 'daffodils-d-wing',
    title: 'Daffodils Heights – D Wing',
    type: 'apartment',
    status: 'upcoming',
    projectCategory: 'upcoming',
    locality: 'Bhandup',
    address: 'Sai Vihar T.P. Road, Bhandup (West), Mumbai',
    price: '₹1.05 Cr',
    priceValue: 10500000,
    bedrooms: 3,
    bathrooms: 2,
    carpetArea: '1,050 sq. ft.',
    flats: 105,
    possession: 'Mar 2026',
    wing: 'D Wing',
    description: [
      'Phase 2 of our flagship Daffodil Heights project with 105 premium smart flats.',
      'Futuristic glass elevation with modern urban green living standards.',
    ],
    features: ['Futuristic Glass Elevation', '105 Smart Layouts', 'Staggered Balcony Decks', 'Green Spaces', 'Automated Systems'],
    amenities: ['Swimming Pool', 'Gymnasium', 'Clubhouse', 'EV Charging', '24/7 Security'],
    images: [daffodilsImg, daffodilImg],
    brochure: daffodilsDWBrochurePdf,
    featured: false,
    createdAt: '2024-01-08',
    badge: 'Phase 2',
  },
  {
    id: 'jasmine-heights',
    title: 'Jasmine Heights',
    type: 'apartment',
    status: 'upcoming',
    projectCategory: 'upcoming',
    locality: 'Ghansoli',
    address: 'Ghansoli, Navi Mumbai',
    price: '₹1.1 Cr',
    priceValue: 11000000,
    bedrooms: 3,
    bathrooms: 2,
    carpetArea: '1,100 sq. ft.',
    totalArea: '38,000 sq. ft.',
    possession: 'Mar 2026',
    description: [
      'Luxury high-rise coming up in prime Ghansoli, featuring 3 & 4 BHK signature apartments.',
      '38,000 Sq. Ft. of premier built area with breathtaking elevation.',
    ],
    features: ['High-Ceilinged Spaces', 'Landscaped Drop-Off Deck', 'High-Security Digital Locks', 'Modular Kitchen'],
    amenities: ['Swimming Pool', 'Gymnasium', 'Yoga Deck', '24/7 Security', 'EV Charging', 'Covered Parking'],
    images: [FALLBACK_RESIDENTIAL],
    featured: false,
    createdAt: '2024-01-09',
  },
  {
    id: 'cubix-arcade',
    title: 'Cubix Shopping Arcade',
    type: 'commercial',
    status: 'for-sale',
    projectCategory: 'completed',
    locality: 'Pune',
    address: 'Akurdi, Pune',
    price: '₹85 L',
    priceValue: 8500000,
    carpetArea: '600 sq. ft.',
    totalArea: '45,000 sq. ft.',
    possession: 'Ready to Move',
    description: [
      'State-of-the-art commercial shopping arcade in Akurdi, Pune — high-footfall zone.',
      '45,000 Sq. Ft. with flexible retail and premium corporate office spaces.',
      'Premium glass facades, spacious walkways, and deep multi-level parking.',
    ],
    features: ['45,000 Sq. Ft. Mall Design', 'High-Capacity Escalators', 'Luxury Brand Spaces', 'Corporate Offices Available'],
    amenities: ['Multi-Level Parking', 'Food Court', 'ATM', 'CCTV', 'Fire Safety', 'Loading Bay'],
    images: [cubixImg],
    featured: false,
    createdAt: '2024-01-10',
    badge: 'Commercial',
  },
];

/* ── localStorage fallback (used when Supabase is unavailable) ── */
export const STORAGE_KEY = 'chanda_listings_v2';

export function loadListings(): Listing[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_LISTINGS;
}

export function saveListings(listings: Listing[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

export function resetListings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

let seeded = false;

export async function loadListingsFromSupabase(): Promise<Listing[]> {
  if (!supabase) {
    // No Supabase configured — fall back to localStorage
    return loadListings();
  }
  try {
    const data = await fetchListings();
    if (data.length === 0 && !seeded) {
      seeded = true;
      await seedListings(DEFAULT_LISTINGS);
      return DEFAULT_LISTINGS;
    }
    return data;
  } catch (err) {
    console.error('Supabase fetch failed, falling back to localStorage:', err);
    return loadListings();
  }
}
