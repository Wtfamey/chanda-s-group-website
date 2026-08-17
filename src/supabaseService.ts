import { supabase } from './supabase';
import { Listing } from './types';

/* ── Mappers ─────────────────────────────────────────── */

function toListing(row: any): Listing {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    projectCategory: row.project_category,
    locality: row.locality,
    address: row.address,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    carpetArea: row.carpet_area,
    totalArea: row.total_area,
    floors: row.floors,
    flats: row.flats,
    shops: row.shops,
    possession: row.possession,
    wing: row.wing,
    description: row.description ?? [],
    features: row.features ?? [],
    amenities: row.amenities ?? [],
    images: row.images ?? [],
    featured: row.featured,
    createdAt: row.created_at,
    badge: row.badge,
    floorPlan: row.floor_plan,
    brochure: row.brochure,
  };
}

function toDB(l: Partial<Listing>): Record<string, any> {
  const db: Record<string, any> = {};
  if (l.id !== undefined) db.id = l.id;
  if (l.title !== undefined) db.title = l.title;
  if (l.type !== undefined) db.type = l.type;
  if (l.status !== undefined) db.status = l.status;
  if (l.projectCategory !== undefined) db.project_category = l.projectCategory;
  if (l.locality !== undefined) db.locality = l.locality;
  if (l.address !== undefined) db.address = l.address;
  // Provide default values for price columns to satisfy NOT NULL constraint
  db.price = 'Contact for Price';
  db.price_value = 0;
  if (l.bedrooms !== undefined) db.bedrooms = l.bedrooms;
  if (l.bathrooms !== undefined) db.bathrooms = l.bathrooms;
  if (l.carpetArea !== undefined) db.carpet_area = l.carpetArea;
  if (l.totalArea !== undefined) db.total_area = l.totalArea;
  if (l.floors !== undefined) db.floors = l.floors;
  if (l.flats !== undefined) db.flats = l.flats;
  if (l.shops !== undefined) db.shops = l.shops;
  if (l.possession !== undefined) db.possession = l.possession;
  if (l.wing !== undefined) db.wing = l.wing;
  if (l.description !== undefined) db.description = l.description;
  if (l.features !== undefined) db.features = l.features;
  if (l.amenities !== undefined) db.amenities = l.amenities;
  if (l.images !== undefined) db.images = l.images;
  if (l.featured !== undefined) db.featured = l.featured;
  if (l.badge !== undefined) db.badge = l.badge;
  if (l.floorPlan !== undefined) db.floor_plan = l.floorPlan;
  if (l.brochure !== undefined) db.brochure = l.brochure;
  return db;
}

/* ── Listings CRUD ───────────────────────────────────── */

export async function fetchListings(): Promise<Listing[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(toListing);
}

export async function addListing(listing: Listing): Promise<Listing> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('listings')
    .insert(toDB(listing))
    .select()
    .single();
  if (error) throw error;
  return toListing(data);
}

export async function updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('listings')
    .update(toDB(updates))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return toListing(data);
}

export async function upsertListing(listing: Listing): Promise<Listing> {
  if (!supabase) throw new Error('Supabase not configured');
  const db = toDB(listing);
  const { data, error } = await supabase
    .from('listings')
    .upsert(db, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return toListing(data);
}

export async function deleteListing(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}

export async function seedListings(listings: Listing[]): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  // Clear all existing
  const { error: delErr } = await supabase.from('listings').delete().neq('id', '__dummy__');
  if (delErr) throw delErr;
  // Batch insert defaults
  const rows = listings.map(l => toDB(l));
  const { error } = await supabase.from('listings').insert(rows);
  if (error) throw error;
}

/* ── Image Upload ────────────────────────────────────── */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 5;

export async function uploadImage(file: File, bucket: string = 'project-images'): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Use JPG, PNG, or WEBP.`);
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`File too large (max ${MAX_FILE_SIZE_MB}MB): ${file.name}`);
  }
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}

/* ── Document Upload (PDF) ────────────────────────────── */

const ALLOWED_DOC_TYPES = ['application/pdf'];
const MAX_DOC_SIZE_MB = 20;

export async function uploadDocument(file: File, bucket: string = 'documents'): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  if (!ALLOWED_DOC_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Use PDF only.`);
  }
  if (file.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
    throw new Error(`File too large (max ${MAX_DOC_SIZE_MB}MB): ${file.name}`);
  }
  const ext = file.name.split('.').pop() || 'pdf';
  const path = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicUrl;
}

/* ── Auth ──────────────────────────────────────────────── */

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/* ── Contact Messages ─────────────────────────────────── */

export async function saveContactMessage(msg: { name: string; email: string; phone?: string; message: string }) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('contact_messages').insert(msg);
  if (error) throw error;
}
