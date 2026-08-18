/**
 * AdminPanel — Chanda's Group Real Estate Management System
 * Production-ready admin dashboard conforming to IEEE 830 specification standards.
 *
 * Features:
 * - Secure session-based authentication
 * - Full CRUD for property listings
 * - Multi-image upload (local file + URL)
 * - Input validation with error feedback
 * - Optimistic UI updates
 * - Accessible (ARIA labels, focus management, keyboard navigation)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit2, X, Check, Upload, ImageIcon,
  KeyRound, ShieldAlert, RotateCcw, LogOut, Home,
  Eye, EyeOff, Search, Filter, ArrowUpDown,
  Building2, AlertTriangle, RefreshCw, Star,
} from 'lucide-react';
import { Listing } from '../types';
import { DEFAULT_LISTINGS } from '../data';
import { supabase } from '../supabase';
import { signIn, signUp, signOut as sbSignOut, getSession, uploadImage, uploadDocument, upsertListing, deleteListing as sbDeleteListing } from '../supabaseService';

/* ── Types ─────────────────────────────────────────────── */
interface AdminPanelProps {
  listings: Listing[];
  onSave: (l: Listing[]) => void;
  onClose: () => void;
  onReset?: () => void;
}

type FormErrors = Partial<Record<keyof Listing | 'images', string>>;
type SortKey = 'title' | 'locality' | 'status' | 'createdAt';

/* ── Constants ─────────────────────────────────────────── */
const SESSION_KEY = 'chanda_admin_v2';
const MAX_IMAGES = 8;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EMPTY_FORM: Omit<Listing, 'id' | 'createdAt'> = {
  title: '', type: 'apartment', status: 'for-sale', projectCategory: 'completed',
  locality: '', address: '',
  bedrooms: 2, bathrooms: 2, carpetArea: '', totalArea: '',
  floors: undefined, flats: undefined, shops: undefined,
  possession: 'Ready to Move', wing: '',
  description: [''], features: [], amenities: [],
  images: [], featured: false, badge: '',
};

/* ── Validation ─────────────────────────────────────────── */
function validateForm(form: typeof EMPTY_FORM): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = 'Property title is required.';
  else if (form.title.length < 3) errors.title = 'Title must be at least 3 characters.';
  if (!form.locality.trim()) errors.locality = 'Locality / area is required.';
  if (form.images.length === 0) errors.images = 'At least one property photo is required.';
  return errors;
}

/* ── Image helpers ─────────────────────────────────────── */
function isValidImageUrl(url: string): boolean {
  return /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif)(\?.*)?$/i.test(url);
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      reject(new Error(`Unsupported file type: ${file.type}. Use JPG, PNG, or WEBP.`));
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      reject(new Error(`File too large (max ${MAX_FILE_SIZE_MB}MB): ${file.name}`));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/* ── Main Component ─────────────────────────────────────── */
export default function AdminPanel({ listings, onSave, onClose, onReset }: AdminPanelProps) {
  /* Auth state */
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);

  /* Dashboard state */
  const [view, setView] = useState<'dashboard' | 'form'>('dashboard');
  const [editId, setEditId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  /* Form state */
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [descLines, setDescLines] = useState<string[]>(['']);
  const [featureInput, setFeatureInput] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [docUploading, setDocUploading] = useState<'brochure'|'floorPlan'|null>(null);
  const [docError, setDocError] = useState('');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);
  const floorPlanInputRef = useRef<HTMLInputElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  /* Lock body scroll (iOS-safe) */
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = prevPosition;
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  /* Restore session */
  useEffect(() => {
    // Check Supabase session first if configured
    if (supabase) {
      getSession().then(session => {
        if (session) {
          setAuthed(true);
          sessionStorage.setItem(SESSION_KEY, 'true');
        } else {
          sessionStorage.removeItem(SESSION_KEY);
          emailRef.current?.focus();
        }
      });
    } else {
      // Fallback: check sessionStorage flag
      if (sessionStorage.getItem(SESSION_KEY) === 'true') {
        setAuthed(true);
      } else {
        emailRef.current?.focus();
      }
    }
  }, []);

  const showFlash = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setFlash({ msg, type });
    setTimeout(() => setFlash(null), 4500);
  }, []);

  /* ── Auth (Supabase + fallback) ──────────────────────── */
  const handleAuth = async (e: React.FormEvent, mode: 'login' | 'register') => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      if (supabase) {
        if (mode === 'register') {
          const data = await signUp(email.trim(), password);
          if (data?.user?.identities?.length === 0) {
            setAuthError('This email is already registered. Try signing in.');
          } else {
            setAuthError('Account created! Check your email to confirm, or try signing in.');
          }
        } else {
          await signIn(email.trim(), password);
          setAuthed(true);
          sessionStorage.setItem(SESSION_KEY, 'true');
        }
      } else {
        // Fallback: hardcoded admin / chanda@99
        if (email.trim() === 'admin' && password === 'chanda@99') {
          setAuthed(true);
          sessionStorage.setItem(SESSION_KEY, 'true');
        } else {
          setAuthError('Supabase not configured. Use admin / chanda@99 for local mode.');
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem(SESSION_KEY);
    if (supabase) await sbSignOut();
    setAuthed(false);
    setEmail('');
    setPassword('');
    setRegisterMode(false);
  };

  // Auto-seed defaults if listings table is empty
  useEffect(() => {
    if (!authed) return;
    (async () => {
      const { fetchListings: fetchL, seedListings: seedL } = await import('../supabaseService');
      const existing = await fetchL().catch(() => []);
      if (existing.length === 0) {
        try {
          await seedL(DEFAULT_LISTINGS);
          window.location.reload();
        } catch (err: any) {
          console.error('Auto-seed failed:', err);
          showFlash('Failed to seed default listings. Please try again.', 'error');
        }
      }
    })();
  }, [authed, showFlash]);

  /* ── Dashboard helpers ────────────────────────────────── */
  const filteredListings = listings
    .filter(l => {
      const q = searchQ.toLowerCase();
      const matches = !q || l.title.toLowerCase().includes(q) || l.locality.toLowerCase().includes(q) || l.address.toLowerCase().includes(q);
      const statusOk = filterStatus === 'all' || l.status === filterStatus;
      return matches && statusOk;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title);
      else if (sortKey === 'locality') cmp = a.locality.localeCompare(b.locality);
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? cmp : -cmp;
    });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(s => !s);
    else { setSortKey(key); setSortAsc(true); }
  };

  const stats = {
    total: listings.length,
    forSale: listings.filter(l => l.status === 'for-sale').length,
    forRent: listings.filter(l => l.status === 'for-rent').length,
    upcoming: listings.filter(l => l.status === 'upcoming').length,
    featured: listings.filter(l => l.featured).length,
  };

  /* ── Form helpers ──────────────────────────────────────── */
  const openCreate = useCallback(() => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setDescLines(['']);
    setFeatureInput(''); setAmenityInput(''); setUrlInput(''); setBrochureUrl(''); setFloorPlanUrl('');
    setFormErrors({}); setImageError(''); setDocError('');
    setView('form');
    setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  const openEdit = useCallback((l: Listing) => {
    setEditId(l.id);
    setForm({
      title: l.title, type: l.type, status: l.status, projectCategory: l.projectCategory,
      locality: l.locality, address: l.address,
      bedrooms: l.bedrooms, bathrooms: l.bathrooms, carpetArea: l.carpetArea || '',
      totalArea: l.totalArea || '', floors: l.floors, flats: l.flats, shops: l.shops,
      possession: l.possession || '', wing: l.wing || '', description: l.description,
      features: l.features, amenities: l.amenities, images: l.images,
      featured: l.featured, badge: l.badge || '',
      brochure: l.brochure, floorPlan: l.floorPlan,
    });
    setDescLines(l.description.length ? l.description : ['']);
    setFeatureInput(''); setAmenityInput(''); setUrlInput('');
    setFormErrors({}); setImageError(''); setDocError('');
    setView('form');
    setTimeout(() => formTopRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  /* Image upload from file (Supabase Storage or base64 fallback) */
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - form.images.length;
    if (remaining <= 0) { setImageError(`Maximum ${MAX_IMAGES} images per listing.`); return; }
    setImageUploading(true);
    setImageError('');
    const toProcess = files.slice(0, remaining);
    const results: string[] = [];
    for (const file of toProcess) {
      try {
        if (supabase) {
          const url = await uploadImage(file, 'project-images');
          results.push(url);
        } else {
          const b64 = await fileToBase64(file);
          results.push(b64);
        }
      } catch (err: any) {
        setImageError(err.message);
      }
    }
    if (results.length) setForm(f => ({ ...f, images: [...f.images, ...results] }));
    setImageUploading(false);
    e.target.value = '';
  }, [form.images.length]);

  /* Add image from URL */
  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!isValidImageUrl(url) && !url.startsWith('data:image/')) {
      setImageError('Please enter a valid image URL ending in .jpg, .jpeg, .png, or .webp');
      return;
    }
    if (form.images.length >= MAX_IMAGES) { setImageError(`Maximum ${MAX_IMAGES} images.`); return; }
    setForm(f => ({ ...f, images: [...f.images, url] }));
    setUrlInput('');
    setImageError('');
  };

  const removeImage = (idx: number) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  /* Document upload (brochure / floor plan) */
  const handleDocUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, field: 'brochure' | 'floorPlan') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(field);
    setDocError('');
    try {
      if (supabase) {
        const url = await uploadDocument(file, 'documents');
        setForm(f => ({ ...f, [field]: url }));
      } else {
        setDocError('Document upload requires Supabase to be configured.');
      }
    } catch (err: any) {
      setDocError(err.message);
    }
    setDocUploading(null);
    e.target.value = '';
  }, []);

  const clearDoc = (field: 'brochure' | 'floorPlan') => setForm(f => ({ ...f, [field]: undefined }));
  const moveImageFirst = (idx: number) => {
    if (idx === 0) return;
    setForm(f => {
      const imgs = [...f.images];
      imgs.unshift(imgs.splice(idx, 1)[0]);
      return { ...f, images: imgs };
    });
  };

  /* Feature/amenity chips */
  const addChip = (field: 'features' | 'amenities', val: string) => {
    const v = val.trim();
    if (!v || form[field].includes(v)) return;
    setForm(f => ({ ...f, [field]: [...f[field], v] }));
  };
  const removeChip = (field: 'features' | 'amenities', idx: number) =>
    setForm(f => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }));

  /* Save listing (Supabase + local state) */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const desc = descLines.map(d => d.trim()).filter(Boolean);
    const formWithDesc = { ...form, description: desc };
    const errors = validateForm(formWithDesc);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      // Only scroll if not already visible at top
      if (formTopRef.current && formTopRef.current.getBoundingClientRect().top < 0) {
        formTopRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      return;
    }
    setSaving(true);
    try {
      const saved: Listing = {
        id: editId || `listing-${Date.now()}`,
        ...formWithDesc,
        createdAt: editId
          ? (listings.find(l => l.id === editId)?.createdAt || new Date().toISOString())
          : new Date().toISOString(),
      };
      // Persist to Supabase
      if (supabase) await upsertListing(saved);
      // Update local state
      const updated = editId
        ? listings.map(l => l.id === editId ? saved : l)
        : [saved, ...listings];
      onSave(updated);
      setView('dashboard');
      showFlash(editId ? `"${saved.title}" updated successfully.` : `"${saved.title}" published.`);
    } catch (err: any) {
      showFlash(`Failed to save: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* Delete listing (Supabase + local state) */
  const confirmDelete = (id: string) => setDeleteConfirm(id);
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const l = listings.find(l => l.id === deleteConfirm);
    try {
      // Delete from Supabase
      if (supabase) await sbDeleteListing(deleteConfirm);
      const updated = listings.filter(l => l.id !== deleteConfirm);
      onSave(updated);
      setDeleteConfirm(null);
      showFlash(`"${l?.title}" removed from listings.`);
    } catch (err: any) {
      showFlash(`Failed to delete: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  /* Toggle featured (Supabase + local state) */
  const toggleFeatured = async (id: string) => {
    const listing = listings.find(l => l.id === id);
    if (!listing) return;
    try {
      // Persist to Supabase
      if (supabase) await upsertListing({ ...listing, featured: !listing.featured });
      const updated = listings.map(l => l.id === id ? { ...l, featured: !l.featured } : l);
      onSave(updated);
    } catch (err: any) {
      showFlash(`Failed to update featured status: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  /* Reset */
  const handleReset = () => {
    // No confirmation here - let parent handle it to avoid double dialog
    if (onReset) onReset();
    else onSave(DEFAULT_LISTINGS);
    showFlash('Listings reset to defaults.');
  };

  /* Shared input class */
  const inp = (err?: string) =>
    `w-full bg-[#050e1a] text-white border ${err ? 'border-red-500/60' : 'border-white/10'} px-3 py-2.5 text-sm rounded-xl focus:outline-none ${err ? 'focus:border-red-400' : 'focus:border-[#2d9496]'} transition-colors placeholder-white/20`;
  const label = 'block text-[11px] font-mono text-white/50 uppercase tracking-wider mb-1.5';

  /* ── LOGIN SCREEN ──────────────────────────────────────── */
  if (!authed) return (
    <div className="fixed inset-0 z-[400] bg-[#050e1a] flex items-center justify-center p-6">
      <div className="absolute inset-0 building-grid opacity-10 pointer-events-none" />
      <div className="w-full max-w-md relative">
        <div className="bg-[#0a1930] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Top accent bar */}
          <div className="h-1" style={{ background:'linear-gradient(90deg, #2d9496, #4ecdc4, #2d9496)' }} />
          <div className="p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background:'linear-gradient(135deg,#2d9496,#1e5f61)', boxShadow:'0 0 40px rgba(45,148,150,0.3)' }}>
                <KeyRound size={28} className="text-white" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Admin Portal</h2>
                <p className="text-white/40 text-xs mt-1">Chanda's Group · Property Management System</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={e => handleAuth(e, registerMode ? 'register' : 'login')} className="space-y-4" noValidate>
              <div>
                <label htmlFor="admin-email" className={label}>Email {supabase ? '' : '(or username)'}</label>
                <input
                  id="admin-email" ref={emailRef} type={supabase ? 'email' : 'text'}
                  placeholder={supabase ? 'admin@chandasgroup.com' : 'admin'}
                  value={email} onChange={e => setEmail(e.target.value)}
                  className={inp(authError ? ' ' : '')} required autoComplete="email"
                  aria-label="Admin email"
                />
              </div>
              <div>
                <label htmlFor="admin-pass" className={label}>Password</label>
                <div className="relative">
                  <input
                    id="admin-pass" type={showPass ? 'text' : 'password'}
                    placeholder={supabase ? 'Your Supabase auth password' : 'chanda@99'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    className={`${inp(authError ? ' ' : '')} pr-10`} required autoComplete="current-password"
                    aria-label="Admin password"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                    aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {authError && (
                <div role="alert" className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                  <ShieldAlert size={14} className="flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button type="submit" disabled={authLoading}
                className="teal-btn w-full py-3.5 text-white text-sm font-semibold rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2">
                {authLoading ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                <span>{authLoading ? 'Verifying...' : registerMode ? 'Create Account' : 'Sign In to Admin'}</span>
              </button>
            </form>

            {/* Register / toggle */}
            <div className="flex gap-2">
              {supabase && (
                <button onClick={() => { setRegisterMode(r => !r); setAuthError(''); }}
                  className="flex-1 py-2.5 text-xs text-[#4ecdc4] hover:underline border border-[#2d9496]/30 rounded-xl transition-colors">
                  {registerMode ? 'Back to Sign In' : 'Create Admin Account'}
                </button>
              )}
              <button onClick={onClose}
                className="flex-1 py-2.5 text-xs text-white/40 hover:text-white border border-white/10 rounded-xl transition-colors">
                <Home size={11} className="inline mr-1" />Back to website
              </button>
            </div>

            {/* Hint */}
            {!supabase && (
              <div className="p-3 bg-[#2d9496]/5 border border-[#2d9496]/15 rounded-xl text-center">
                <p className="text-[11px] font-mono text-[#4ecdc4]/50">
                  Local mode: <span className="text-[#4ecdc4]/80">admin</span> / <span className="text-[#4ecdc4]/80">chanda@99</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  /* ── DELETE CONFIRM DIALOG ────────────────────────────── */
  const DeleteDialog = () => deleteConfirm ? (
    <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-labelledby="delete-title">
      <div className="bg-[#0a1930] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 id="delete-title" className="font-serif font-bold text-white text-sm">Delete Listing</h3>
            <p className="text-white/40 text-xs mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-white/60 text-sm">
          Remove <strong className="text-white">"{listings.find(l => l.id === deleteConfirm)?.title}"</strong> from the portfolio permanently?
        </p>
        <div className="flex gap-3">
          <button onClick={handleDelete}
            className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-sm font-semibold rounded-xl transition-all">
            Delete
          </button>
          <button onClick={() => setDeleteConfirm(null)}
            className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm rounded-xl transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;

  /* ── FORM VIEW ────────────────────────────────────────── */
  const FormView = () => (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6" ref={formTopRef}>
      {/* Form header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#4ecdc4] text-[10px] font-mono uppercase tracking-widest mb-1">
            {editId ? 'Edit Listing' : 'New Listing'}
          </p>
          <h2 className="font-serif text-xl font-bold text-white">
            {editId ? `Editing: ${form.title || 'Untitled'}` : 'Add New Property Listing'}
          </h2>
        </div>
        <button onClick={() => setView('dashboard')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors px-3 py-2 rounded-xl hover:bg-white/5">
          <X size={15}/> Cancel
        </button>
      </div>

      {/* Validation summary */}
      {Object.keys(formErrors).length > 0 && (
        <div role="alert" className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1 min-h-[60px]">
          <div className="flex items-center gap-2 text-red-400 text-sm font-semibold mb-2">
            <AlertTriangle size={14}/> Please fix the following errors:
          </div>
          {Object.entries(formErrors).map(([k, v]) => (
            <p key={k} className="text-red-300 text-xs">• {Array.isArray(v) ? v[0] : v}</p>
          ))}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5" noValidate>
        {/* ── IMAGES ── */}
        <section className="bg-[#0a1930] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-mono text-[#c5a880] uppercase tracking-widest">
              Property Images <span className="text-white/30">({form.images.length}/{MAX_IMAGES})</span>
            </h3>
            <span className="text-[10px] text-white/30">First image = cover photo · Click photo to set as cover</span>
          </div>

          {/* Image grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {form.images.map((img, i) => (
              <div key={i} className="relative group aspect-video bg-[#050e1a] rounded-xl overflow-hidden border border-white/5 hover:border-[#2d9496]/40 transition-colors cursor-pointer"
                onClick={() => moveImageFirst(i)} title="Click to set as cover photo">
                <img src={img} alt={`Property photo ${i+1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60"><rect fill="%23111"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23444" font-size="10">Error</text></svg>'; }} />
                {i === 0 && <div className="absolute top-1 left-1 text-[8px] bg-[#2d9496] text-white px-1.5 py-0.5 rounded font-mono font-bold">COVER</div>}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={e => { e.stopPropagation(); removeImage(i); }}
                    className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors" aria-label={`Remove image ${i+1}`}>
                    <Trash2 size={11} className="text-white"/>
                  </button>
                </div>
              </div>
            ))}
            {/* Upload slot */}
            {form.images.length < MAX_IMAGES && (
              <label className="aspect-video bg-[#050e1a] border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#2d9496]/60 hover:bg-[#2d9496]/5 transition-all group" title="Upload photos">
                {imageUploading
                  ? <RefreshCw size={16} className="text-[#4ecdc4] animate-spin" />
                  : <><Upload size={16} className="text-white/30 group-hover:text-[#4ecdc4] transition-colors mb-1"/>
                     <span className="text-[9px] text-white/25 group-hover:text-[#4ecdc4]">Upload</span></>}
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFileUpload} className="hidden" ref={fileInputRef} aria-label="Upload property photos" />
              </label>
            )}
          </div>

          {/* URL input */}
          <div className="flex gap-2">
            <input type="url" placeholder="Or paste an image URL (https://...jpg) and press Add"
              value={urlInput} onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
              className="flex-grow bg-[#050e1a] text-white border border-white/10 px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#2d9496] placeholder-white/20 transition-colors"
              aria-label="Image URL input" />
            <button type="button" onClick={handleAddUrl}
              className="px-4 py-2 bg-[#2d9496]/20 hover:bg-[#2d9496]/30 border border-[#2d9496]/30 text-[#4ecdc4] text-xs rounded-xl transition-all font-semibold flex-shrink-0">
              Add URL
            </button>
          </div>

          {imageError && <p role="alert" className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={11}/>{imageError}</p>}
          {formErrors.images && <p role="alert" className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={11}/>{formErrors.images}</p>}
        </section>

        {/* ── DOCUMENTS (Brochure & Floor Plan) ── */}
        <section className="bg-[#0a1930] border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-[11px] font-mono text-[#c5a880] uppercase tracking-widest">Documents</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Brochure */}
            <div className="space-y-2">
              <label className={label}>Brochure (PDF)</label>
              {form.brochure ? (
                <div className="flex items-center gap-2 p-3 bg-[#050e1a] rounded-xl border border-white/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2d9496] flex-shrink-0"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  <a href={form.brochure} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4ecdc4] hover:underline truncate flex-grow">View Brochure</a>
                  <button type="button" onClick={() => clearDoc('brochure')} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0" aria-label="Remove brochure"><X size={13}/></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" placeholder="Or paste PDF URL..." value={brochureUrl}
                    onChange={e => setBrochureUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = brochureUrl.trim(); if (v) { setForm(f => ({...f, brochure: v})); setBrochureUrl(''); } } }}
                    className="flex-grow bg-[#050e1a] text-white border border-white/10 px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#2d9496] placeholder-white/20 transition-colors" aria-label="Brochure URL" />
                  <button type="button" onClick={() => { const v = brochureUrl.trim(); if (v) { setForm(f => ({...f, brochure: v})); setBrochureUrl(''); } }}
                    className="px-3 py-2 bg-[#2d9496]/20 border border-[#2d9496]/30 text-[#4ecdc4] text-xs rounded-xl transition-all font-semibold flex-shrink-0">Set URL</button>
                </div>
              )}
              <input type="file" accept="application/pdf" onChange={e => handleDocUpload(e, 'brochure')} className="hidden" ref={brochureInputRef} aria-label="Upload brochure PDF" />
              {!form.brochure && (
                <button type="button" onClick={() => brochureInputRef.current?.click()} disabled={docUploading === 'brochure'}
                  className="w-full py-2 bg-[#050e1a] border border-dashed border-white/20 rounded-xl text-xs text-white/30 hover:text-white/60 hover:border-[#2d9496]/60 transition-all flex items-center justify-center gap-1.5">
                  {docUploading === 'brochure' ? <RefreshCw size={12} className="animate-spin"/> : <Upload size={12}/>}
                  <span>{docUploading === 'brochure' ? 'Uploading...' : 'Upload PDF'}</span>
                </button>
              )}
            </div>

            {/* Floor Plan */}
            <div className="space-y-2">
              <label className={label}>Floor Plan (PDF)</label>
              {form.floorPlan ? (
                <div className="flex items-center gap-2 p-3 bg-[#050e1a] rounded-xl border border-white/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2d9496] flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <a href={form.floorPlan} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4ecdc4] hover:underline truncate flex-grow">View Floor Plan</a>
                  <button type="button" onClick={() => clearDoc('floorPlan')} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0" aria-label="Remove floor plan"><X size={13}/></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" placeholder="Or paste PDF URL..." value={floorPlanUrl}
                    onChange={e => setFloorPlanUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = floorPlanUrl.trim(); if (v) { setForm(f => ({...f, floorPlan: v})); setFloorPlanUrl(''); } } }}
                    className="flex-grow bg-[#050e1a] text-white border border-white/10 px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#2d9496] placeholder-white/20 transition-colors" aria-label="Floor plan URL" />
                  <button type="button" onClick={() => { const v = floorPlanUrl.trim(); if (v) { setForm(f => ({...f, floorPlan: v})); setFloorPlanUrl(''); } }}
                    className="px-3 py-2 bg-[#2d9496]/20 border border-[#2d9496]/30 text-[#4ecdc4] text-xs rounded-xl transition-all font-semibold flex-shrink-0">Set URL</button>
                </div>
              )}
              <input type="file" accept="application/pdf" onChange={e => handleDocUpload(e, 'floorPlan')} className="hidden" ref={floorPlanInputRef} aria-label="Upload floor plan PDF" />
              {!form.floorPlan && (
                <button type="button" onClick={() => floorPlanInputRef.current?.click()} disabled={docUploading === 'floorPlan'}
                  className="w-full py-2 bg-[#050e1a] border border-dashed border-white/20 rounded-xl text-xs text-white/30 hover:text-white/60 hover:border-[#2d9496]/60 transition-all flex items-center justify-center gap-1.5">
                  {docUploading === 'floorPlan' ? <RefreshCw size={12} className="animate-spin"/> : <Upload size={12}/>}
                  <span>{docUploading === 'floorPlan' ? 'Uploading...' : 'Upload PDF'}</span>
                </button>
              )}
            </div>
          </div>
          {docError && <p role="alert" className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle size={11}/>{docError}</p>}
        </section>

        {/* ── BASIC DETAILS ── */}
        <section className="bg-[#0a1930] border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-[11px] font-mono text-[#c5a880] uppercase tracking-widest">Property Details</h3>
          <div className="grid md:grid-cols-12 gap-3">
            <div className="md:col-span-7">
              <label htmlFor="f-title" className={label}>Title *</label>
              <input id="f-title" type="text" placeholder="e.g. Infinity Tower – A Wing" value={form.title}
                onChange={e => { setForm(f => ({...f, title: e.target.value})); setFormErrors(fe => ({...fe, title: undefined})); }}
                className={inp(formErrors.title)} required aria-required="true" aria-describedby={formErrors.title ? 'err-title' : undefined} />
              {formErrors.title && <p id="err-title" role="alert" className="text-red-400 text-[10px] mt-1">{formErrors.title}</p>}
            </div>
            <div className="md:col-span-3">
              <label htmlFor="f-wing" className={label}>Wing / Phase</label>
              <input id="f-wing" type="text" placeholder="e.g. A Wing" value={form.wing}
                onChange={e => setForm(f => ({...f, wing: e.target.value}))} className={inp()} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="f-badge" className={label}>Badge</label>
              <input id="f-badge" type="text" placeholder="Flagship" value={form.badge}
                onChange={e => setForm(f => ({...f, badge: e.target.value}))} className={inp()} />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="f-type" className={label}>Property Type</label>
              <select id="f-type" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as any}))} className={inp()}>
                <option value="apartment">Apartment</option>
                <option value="penthouse">Penthouse</option>
                <option value="villa">Villa</option>
                <option value="plot">Plot / Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="f-status" className={label}>Listing Status</label>
              <select id="f-status" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value as any}))} className={inp()}>
                <option value="for-sale">For Sale</option>
                <option value="for-rent">For Rent</option>
                <option value="upcoming">Upcoming</option>
                <option value="sold">Sold / Closed</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label htmlFor="f-cat" className={label}>Project Phase</label>
              <select id="f-cat" value={form.projectCategory} onChange={e => setForm(f => ({...f, projectCategory: e.target.value as any}))} className={inp()}>
                <option value="completed">Completed</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
            <div className="md:col-span-3 flex items-end pb-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <button type="button" role="switch" aria-checked={form.featured}
                  onClick={() => setForm(f => ({...f, featured: !f.featured}))}
                  className={`w-11 h-6 rounded-full border-2 transition-all duration-300 flex items-center px-0.5 ${form.featured ? 'bg-[#2d9496] border-[#2d9496]' : 'bg-white/5 border-white/20'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${form.featured ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-xs text-white/60">Featured</span>
              </label>
            </div>
            <div className="md:col-span-5">
              <label htmlFor="f-loc" className={label}>Locality / Area *</label>
              <input id="f-loc" type="text" placeholder="e.g. Koperkhairane" value={form.locality}
                onChange={e => { setForm(f => ({...f, locality: e.target.value})); setFormErrors(fe => ({...fe, locality: undefined})); }}
                className={inp(formErrors.locality)} required />
              {formErrors.locality && <p role="alert" className="text-red-400 text-[10px] mt-1">{formErrors.locality}</p>}
            </div>
            <div className="md:col-span-7">
              <label htmlFor="f-addr" className={label}>Full Address</label>
              <input id="f-addr" type="text" placeholder="Sector 2A, Koperkhairane, Navi Mumbai" value={form.address}
                onChange={e => { setForm(f => ({...f, address: e.target.value})); setFormErrors(fe => ({...fe, address: undefined})); }}
                className={inp(formErrors.address)} />
            </div>
          </div>
        </section>

        {/* ── PRICING & SPECS ── */}
        <section className="bg-[#0a1930] border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-[11px] font-mono text-[#c5a880] uppercase tracking-widest">Specifications</h3>
          <div className="grid md:grid-cols-12 gap-3">
            <div className="md:col-span-4">
              <label htmlFor="f-poss" className={label}>Possession</label>
              <input id="f-poss" type="text" placeholder="Ready to Move / Dec 2026" value={form.possession}
                onChange={e => setForm(f => ({...f, possession: e.target.value}))} className={inp()} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="f-bed" className={label}>Bedrooms</label>
              <input id="f-bed" type="number" min="0" max="20" value={form.bedrooms ?? ''}
                onChange={e => setForm(f => ({...f, bedrooms: e.target.value ? Number(e.target.value) : undefined}))} className={inp()} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="f-bath" className={label}>Bathrooms</label>
              <input id="f-bath" type="number" min="0" max="20" value={form.bathrooms ?? ''}
                onChange={e => setForm(f => ({...f, bathrooms: e.target.value ? Number(e.target.value) : undefined}))} className={inp()} />
            </div>
            <div className="md:col-span-4">
              <label htmlFor="f-carpet" className={label}>Carpet Area</label>
              <input id="f-carpet" type="text" placeholder="1,200 sq. ft." value={form.carpetArea}
                onChange={e => setForm(f => ({...f, carpetArea: e.target.value}))} className={inp()} />
            </div>
            <div className="md:col-span-4">
              <label htmlFor="f-total" className={label}>Total / Built-Up Area</label>
              <input id="f-total" type="text" placeholder="1,600 sq. ft. or 4,06,000 sq. ft." value={form.totalArea}
                onChange={e => setForm(f => ({...f, totalArea: e.target.value}))} className={inp()} />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="f-floors" className={label}>Floors / Storeys</label>
              <input id="f-floors" type="number" min="0" value={form.floors ?? ''}
                onChange={e => setForm(f => ({...f, floors: e.target.value ? Number(e.target.value) : undefined}))} className={inp()} />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="f-flats" className={label}>Total Flats</label>
              <input id="f-flats" type="number" min="0" value={form.flats ?? ''}
                onChange={e => setForm(f => ({...f, flats: e.target.value ? Number(e.target.value) : undefined}))} className={inp()} />
            </div>
            <div className="md:col-span-3">
              <label htmlFor="f-shops" className={label}>Shops / Units</label>
              <input id="f-shops" type="number" min="0" value={form.shops ?? ''}
                onChange={e => setForm(f => ({...f, shops: e.target.value ? Number(e.target.value) : undefined}))} className={inp()} />
            </div>
          </div>
        </section>

        {/* ── DESCRIPTION ── */}
        <section className="bg-[#0a1930] border border-white/5 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-mono text-[#c5a880] uppercase tracking-widest">Description</h3>
            <button type="button" onClick={() => setDescLines(d => [...d, ''])}
              className="text-[11px] text-[#4ecdc4] hover:underline flex items-center gap-1">
              <Plus size={11}/> Add paragraph
            </button>
          </div>
          {descLines.map((line, i) => (
            <div key={i} className="flex gap-2 items-start">
              <textarea rows={2} value={line}
                onChange={e => { const d = [...descLines]; d[i] = e.target.value; setDescLines(d); setFormErrors(fe => ({...fe, description: undefined})); }}
                placeholder={`Paragraph ${i + 1} — describe this property...`}
                className={`${inp()} resize-none flex-grow text-xs leading-relaxed`}
                aria-label={`Description paragraph ${i + 1}`} />
              {descLines.length > 1 && (
                <button type="button" onClick={() => setDescLines(d => d.filter((_, j) => j !== i))}
                  className="text-white/25 hover:text-red-400 transition-colors mt-2 flex-shrink-0" aria-label="Remove paragraph">
                  <X size={14}/>
                </button>
              )}
            </div>
          ))}
        </section>

        {/* ── FEATURES & AMENITIES ── */}
        <div className="grid md:grid-cols-2 gap-4">
          {(['features', 'amenities'] as const).map(field => (
            <section key={field} className="bg-[#0a1930] border border-white/5 rounded-2xl p-5 space-y-3">
              <h3 className="text-[11px] font-mono text-[#c5a880] uppercase tracking-widest">{field}</h3>
              <div className="flex gap-2">
                <input type="text"
                  placeholder={field === 'features' ? 'e.g. Smart Home System' : 'e.g. Swimming Pool'}
                  value={field === 'features' ? featureInput : amenityInput}
                  onChange={e => field === 'features' ? setFeatureInput(e.target.value) : setAmenityInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (field === 'features') { addChip('features', featureInput); setFeatureInput(''); } else { addChip('amenities', amenityInput); setAmenityInput(''); } } }}
                  className={`${inp()} text-xs flex-grow`} aria-label={`Add ${field}`} />
                <button type="button"
                  onClick={() => { if (field === 'features') { addChip('features', featureInput); setFeatureInput(''); } else { addChip('amenities', amenityInput); setAmenityInput(''); } }}
                  className="px-3 py-2 bg-[#2d9496]/20 border border-[#2d9496]/30 text-[#4ecdc4] rounded-xl text-xs hover:bg-[#2d9496]/30 transition-all flex-shrink-0"
                  aria-label={`Add ${field} item`}>
                  <Plus size={13}/>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]" aria-label={`${field} list`}>
                {form[field].map((item, i) => (
                  <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-[#2d9496]/10 border border-[#2d9496]/20 text-[#4ecdc4] text-xs rounded-full">
                    {item}
                    <button type="button" onClick={() => removeChip(field, i)}
                      className="hover:text-white transition-colors" aria-label={`Remove ${item}`}>
                      <X size={10}/>
                    </button>
                  </span>
                ))}
                {form[field].length === 0 && <span className="text-white/20 text-[11px] italic">None added yet</span>}
              </div>
            </section>
          ))}
        </div>

        {/* ── SUBMIT ── */}
        <div className="flex gap-3 pb-4">
          <button type="submit" disabled={saving}
            className="teal-btn px-8 py-3.5 text-white text-sm font-semibold rounded-xl flex items-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-60 disabled:scale-100">
            {saving ? <RefreshCw size={14} className="animate-spin"/> : <Check size={15}/>}
            <span>{saving ? 'Saving...' : editId ? 'Save Changes' : 'Publish Listing'}</span>
          </button>
          <button type="button" onClick={() => setView('dashboard')}
            className="px-6 py-3.5 bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm rounded-xl transition-all">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  /* ── DASHBOARD VIEW ─────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-[400] bg-[#050e1a] flex flex-col overflow-hidden">
      <div className="absolute inset-0 building-grid opacity-5 pointer-events-none" />

      {/* ── Top bar ── */}
      <header className="flex-shrink-0 bg-[#050e1a]/95 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#2d9496] animate-pulse" />
          <div>
            <div className="font-serif font-bold text-white text-sm">Admin Dashboard</div>
            <div className="text-[#4ecdc4] text-[9px] font-mono tracking-widest uppercase">Chanda's Group · Property Management</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate}
            className="teal-btn px-3 md:px-4 py-2 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:scale-105 transition-transform">
            <Plus size={13}/><span className="hidden sm:inline">New Listing</span>
          </button>
          <button onClick={handleReset}
            className="p-2 bg-white/5 border border-white/10 text-white/40 hover:text-rose-400 hover:border-rose-500/30 rounded-xl transition-all" title="Reset to defaults">
            <RotateCcw size={13}/>
          </button>
          <button onClick={handleLogout}
            className="p-2 bg-white/5 border border-white/10 text-white/40 hover:text-white rounded-xl transition-all" title="Logout">
            <LogOut size={13}/>
          </button>
          <button onClick={onClose}
            className="p-2 bg-white/5 border border-white/10 text-white/40 hover:text-white rounded-xl transition-all" title="Close admin">
            <Home size={13}/>
          </button>
        </div>
      </header>

      {/* ── Flash notification ── */}
      {flash && (
        <div role="status" aria-live="polite"
          className={`absolute top-16 right-4 z-20 px-4 py-3 rounded-xl border text-sm font-mono flex items-center gap-2 shadow-xl max-w-sm transition-all ${flash.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-red-500/15 border-red-500/30 text-red-400'}`}>
          {flash.type === 'success' ? <Check size={14}/> : <AlertTriangle size={14}/>}
          {flash.msg}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {view === 'form' ? <FormView /> : (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Total', val: stats.total, color: '#4ecdc4' },
                { label: 'For Sale', val: stats.forSale, color: '#2d9496' },
                { label: 'For Rent', val: stats.forRent, color: '#60a5fa' },
                { label: 'Upcoming', val: stats.upcoming, color: '#f59e0b' },
                { label: 'Featured', val: stats.featured, color: '#f59e0b' },
              ].map(s => (
                <div key={s.label} className="bg-[#0a1930] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                  <div className="font-serif font-black text-2xl" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-white/40 text-xs font-mono uppercase">{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── Filter bar ── */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input type="search" placeholder="Search listings..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  className="w-full bg-[#0a1930] text-white border border-white/10 pl-9 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:border-[#2d9496] placeholder-white/20 transition-colors"
                  aria-label="Search listings" />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={13} className="text-[#2d9496] flex-shrink-0" />
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="bg-[#0a1930] text-white/70 border border-white/10 px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#2d9496]"
                  aria-label="Filter by status">
                  <option value="all">All Status</option>
                  <option value="for-sale">For Sale</option>
                  <option value="for-rent">For Rent</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="sold">Sold</option>
                </select>
                <span className="text-white/25 text-xs font-mono">{filteredListings.length} result{filteredListings.length !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* ── Listings table ── */}
            <div className="bg-[#0a1930] border border-white/5 rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[10px] font-mono text-white/30 uppercase tracking-wider">
                <div className="col-span-4 flex items-center gap-1 cursor-pointer hover:text-white/60" onClick={() => handleSort('title')}>
                  Title <ArrowUpDown size={10}/>
                </div>
                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white/60" onClick={() => handleSort('locality')}>
                  Locality <ArrowUpDown size={10}/>
                </div>
                <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-white/60" onClick={() => handleSort('status')}>
                  Status <ArrowUpDown size={10}/>
                </div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Rows */}
              {filteredListings.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <Building2 size={28} className="text-white/15 mx-auto" />
                  <p className="text-white/30 text-sm">No listings found</p>
                  <button onClick={openCreate} className="text-[#4ecdc4] text-xs hover:underline">Add the first listing →</button>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {filteredListings.map(l => (
                    <div key={l.id} className="grid grid-cols-12 gap-2 md:gap-4 px-4 md:px-5 py-3.5 hover:bg-white/[0.02] transition-colors items-center group">
                      {/* Thumb + title */}
                      <div className="col-span-8 md:col-span-4 flex items-center gap-3 min-w-0">
                        <div className="w-12 h-9 rounded-lg overflow-hidden bg-[#050e1a] flex-shrink-0 border border-white/5">
                          {l.images[0]
                            ? <img src={l.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                            : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={12} className="text-white/20"/></div>}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white text-sm font-semibold truncate">{l.title}{l.wing ? ` – ${l.wing}` : ''}</div>
                          <div className="text-white/30 text-[10px] font-mono truncate md:hidden">{l.locality}</div>
                        </div>
                      </div>
                      {/* Locality */}
                      <div className="hidden md:block col-span-2 text-white/50 text-xs truncate">{l.locality}</div>
                      {/* Status */}
                      <div className="hidden md:flex col-span-2 items-center gap-1.5">
                        <span className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                          l.status === 'for-sale' ? 'text-[#4ecdc4] border-[#2d9496]/30 bg-[#2d9496]/10'
                          : l.status === 'for-rent' ? 'text-blue-400 border-blue-400/30 bg-blue-400/10'
                          : l.status === 'upcoming' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                          : 'text-white/30 border-white/10 bg-white/5'
                        }`}>
                          {l.status.replace('-', ' ').toUpperCase()}
                        </span>
                        {l.featured && <Star size={11} className="text-amber-400" fill="currentColor" />}
                      </div>
                      {/* Actions */}
                      <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-1.5">
                        <button onClick={() => toggleFeatured(l.id)}
                          className={`p-1.5 rounded-lg border transition-all ${l.featured ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/5 text-white/25 hover:text-amber-400'}`}
                          title={l.featured ? 'Unfeature' : 'Feature'} aria-label={l.featured ? 'Remove from featured' : 'Mark as featured'}>
                          <Star size={12} fill={l.featured ? 'currentColor' : 'none'}/>
                        </button>
                        <button onClick={() => openEdit(l)}
                          className="p-1.5 bg-white/5 hover:bg-[#2d9496]/20 border border-white/5 hover:border-[#2d9496]/40 text-white/40 hover:text-[#4ecdc4] rounded-lg transition-all"
                          title="Edit listing" aria-label={`Edit ${l.title}`}>
                          <Edit2 size={12}/>
                        </button>
                        <button onClick={() => confirmDelete(l.id)}
                          className="p-1.5 bg-white/5 hover:bg-red-900/30 border border-white/5 hover:border-red-500/30 text-white/40 hover:text-red-400 rounded-lg transition-all"
                          title="Delete listing" aria-label={`Delete ${l.title}`}>
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer note */}
            <p className="text-center text-white/15 text-[10px] font-mono pb-4">
              Chanda's Group Property Management System · All changes saved {supabase ? 'to Supabase' : 'locally'}
            </p>
          </div>
        )}
      </div>

      <DeleteDialog />
    </div>
  );
}
