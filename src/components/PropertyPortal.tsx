import { useState, useMemo, useEffect } from 'react';
import {
  Search, X, Grid, List, SlidersHorizontal, MapPin, ArrowRight,
  ChevronLeft, ChevronRight, Bed, Bath, Maximize2, Send,
  Check,
} from 'lucide-react';
import { Listing } from '../types';
import { supabase } from '../supabase';
import { saveContactMessage } from '../supabaseService';

interface Props { listings: Listing[]; open: boolean; onClose: () => void; }

const STATUS_LABEL: Record<string,string> = { 'for-sale':'For Sale','for-rent':'For Rent','upcoming':'Upcoming','sold':'Sold' };
const STATUS_COLOR: Record<string,string> = { 'for-sale':'text-[#4ecdc4] border-[#2d9496]/30 bg-[#2d9496]/10','for-rent':'text-blue-400 border-blue-400/30 bg-blue-400/10','upcoming':'text-amber-400 border-amber-500/30 bg-amber-500/10','sold':'text-white/30 border-white/10 bg-white/5' };

export default function PropertyPortal({ listings, open, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [localityFilter, setLocalityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isGrid, setIsGrid] = useState(true);
  const [detail, setDetail] = useState<Listing|null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [enquirySent, setEnquirySent] = useState(false);
  const [enqName, setEnqName] = useState('');
  const [enqEmail, setEnqEmail] = useState('');

  const localities = useMemo(()=>['All',...Array.from(new Set(listings.map(l=>l.locality)))],[listings]);

  const filtered = useMemo(() => {
    let r = listings.filter(l => {
      const t = l.title.toLowerCase()+l.locality.toLowerCase()+l.address.toLowerCase();
      const txt = t.includes(search.toLowerCase());
      const st = statusFilter==='all'||l.status===statusFilter;
      const ty = typeFilter==='all'||l.type===typeFilter;
      const lo = localityFilter==='All'||l.locality===localityFilter;
      return txt && st && ty && lo;
    });
    if (sortBy==='price-asc') r=[...r].sort((a,b)=>a.priceValue-b.priceValue);
    else if (sortBy==='price-desc') r=[...r].sort((a,b)=>b.priceValue-a.priceValue);
    else if (sortBy==='newest') r=[...r].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
    else if (sortBy==='featured') r=[...r].sort((a,b)=>Number(b.featured)-Number(a.featured));
    return r;
  }, [listings, search, statusFilter, typeFilter, localityFilter, sortBy]);

  useEffect(()=>{
    if(open){
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
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    }
  }, [open]);
  useEffect(()=>{ if(detail) setImgIdx(0); }, [detail]);

  if (!open) return null;

  const Card = ({ l }: { l: Listing }) => (
    <div onClick={()=>setDetail(l)} className="group bg-[#0a1930] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-[#2d9496]/40 hover:-translate-y-1 transition-all duration-400">
      <div className="relative aspect-video overflow-hidden bg-[#050e1a]">
        <img src={l.images[0]||'https://images.pexels.com/photos/534151/pexels-photo-534151.jpeg?auto=compress&cs=tinysrgb&w=700'} alt={l.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050e1a]/80 to-transparent" />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${STATUS_COLOR[l.status]}`}>{STATUS_LABEL[l.status]}</span>
          {l.badge && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:'linear-gradient(135deg,#2d9496,#1e5f61)'}}>{l.badge}</span>}
          {l.featured && <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400">FEATURED</span>}
        </div>
        {/* Multi-image indicator */}
        {l.images.length>1 && <div className="absolute top-3 right-3 text-[9px] font-mono bg-black/60 text-white/60 px-1.5 py-0.5 rounded-full">+{l.images.length-1} photos</div>}
        {/* Price */}
        <div className="absolute bottom-3 left-3">
          <div className="font-serif font-black text-xl text-white drop-shadow-lg">{l.price}</div>
          {l.carpetArea && <div className="text-white/60 text-[10px]">{l.carpetArea}</div>}
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-1.5 text-white/45 text-[13px] mb-1.5"><MapPin size={11} className="text-[#2d9496]"/>{l.locality}</div>
        <h3 className="font-serif font-bold text-white text-[15px] sm:text-base group-hover:text-[#4ecdc4] transition-colors leading-tight">{l.title}</h3>
        {/* BHK / specs row */}
        <div className="flex items-center gap-3 mt-2.5 text-white/45 text-[13px]">
          {l.bedrooms && <span className="flex items-center gap-1"><Bed size={12}/>{l.bedrooms} BHK</span>}
          {l.bathrooms && <span className="flex items-center gap-1"><Bath size={12}/>{l.bathrooms}</span>}
          {l.carpetArea && <span className="flex items-center gap-1"><Maximize2 size={12}/>{l.carpetArea}</span>}
        </div>
        {l.possession && <div className="mt-2.5 text-xs text-[#c5a880] font-mono">Possession: {l.possession}</div>}
      </div>
    </div>
  );

  const ListRow = ({ l }: { l: Listing }) => (
    <div onClick={()=>setDetail(l)} className="group flex flex-col sm:flex-row bg-[#0a1930] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-[#2d9496]/40 transition-all duration-300">
      <div className="relative w-full sm:w-56 h-40 sm:h-auto flex-shrink-0 overflow-hidden bg-[#050e1a]">
        <img src={l.images[0]||'https://images.pexels.com/photos/534151/pexels-photo-534151.jpeg?auto=compress&cs=tinysrgb&w=500'} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3"><span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${STATUS_COLOR[l.status]}`}>{STATUS_LABEL[l.status]}</span></div>
      </div>
      <div className="flex-grow p-5 sm:p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-white/45 text-[13px] mb-1.5"><MapPin size={11} className="text-[#2d9496]"/>{l.locality} — {l.address}</div>
          <h3 className="font-serif font-bold text-white text-lg group-hover:text-[#4ecdc4] transition-colors">{l.title}</h3>
          <p className="text-white/45 text-sm mt-2 leading-relaxed line-clamp-2">{l.description[0]}</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-4">
            <span className="font-serif font-black text-xl text-[#4ecdc4]">{l.price}</span>
            {l.bedrooms && <span className="text-white/45 text-[13px] flex items-center gap-1"><Bed size={12}/>{l.bedrooms} BHK</span>}
            {l.carpetArea && <span className="text-white/45 text-[13px] flex items-center gap-1"><Maximize2 size={12}/>{l.carpetArea}</span>}
            {l.possession && <span className="text-xs text-[#c5a880] font-mono">Possession: {l.possession}</span>}
          </div>
          <span className="text-[#2d9496] text-[13px] flex items-center gap-1">View Details <ArrowRight size={12}/></span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-[#050e1a] flex flex-col" style={{ overscrollBehavior:'contain' }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 lg:px-10 h-18 py-4 border-b border-white/5 bg-[#050e1a]/95 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#2d9496] animate-pulse" />
          <div>
            <div className="font-serif font-bold text-white text-lg">Property Portal</div>
            <div className="text-[#4ecdc4] text-[10px] font-mono tracking-[0.25em] uppercase">Dreams Abode — Full Listings</div>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-[#2d9496]/20 border border-white/10 hover:border-[#2d9496]/40 text-white/60 hover:text-white rounded-xl transition-all"><X size={18}/></button>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 bg-[#0a1930] border-b border-white/5 px-6 lg:px-10 py-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search */}
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="text" placeholder="Search by name, location..." value={search} onChange={e=>setSearch(e.target.value)}
                className="w-full bg-[#050e1a] text-white border border-white/10 pl-10 pr-4 py-2.5 placeholder-white/20 rounded-xl text-sm focus:outline-none focus:border-[#2d9496] transition-colors" />
            </div>
            {/* Status tabs */}
            <div className="flex flex-wrap gap-1.5">
              {[['all','All'],['for-sale','For Sale'],['for-rent','For Rent'],['upcoming','Upcoming']].map(([v,l])=>(
                <button key={v} onClick={()=>setStatusFilter(v)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-full border transition-all ${statusFilter===v?'text-white border-[#2d9496]':'text-white/40 border-white/10 hover:text-white/70 hover:border-white/25'}`}
                  style={statusFilter===v?{background:'linear-gradient(135deg,#2d9496,#1e5f61)'}:{}}>
                  {l}
                </button>
              ))}
            </div>
            {/* Type */}
            <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
              className="bg-[#050e1a] text-white/60 border border-white/10 px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#2d9496] transition-colors">
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="penthouse">Penthouse</option>
              <option value="commercial">Commercial</option>
              <option value="plot">Plot</option>
            </select>
            {/* Locality */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={13} className="text-[#2d9496] flex-shrink-0" />
              <select value={localityFilter} onChange={e=>setLocalityFilter(e.target.value)}
                className="bg-[#050e1a] text-white/60 border border-white/10 px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#2d9496] transition-colors">
                {localities.map(loc=><option key={loc} value={loc}>{loc==='All'?'All Areas':loc}</option>)}
              </select>
            </div>
            {/* Sort + view */}
            <div className="flex items-center gap-2 ml-auto">
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                className="bg-[#050e1a] text-white/60 border border-white/10 px-3 py-2.5 text-xs rounded-xl focus:outline-none focus:border-[#2d9496] transition-colors">
                <option value="newest">Newest First</option>
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
              <div className="flex bg-[#050e1a] border border-white/10 rounded-xl p-1 gap-0.5">
                <button onClick={()=>setIsGrid(true)} className={`p-1.5 rounded-lg transition-colors ${isGrid?'text-[#2d9496] bg-white/5':'text-white/30 hover:text-white/60'}`}><Grid size={14}/></button>
                <button onClick={()=>setIsGrid(false)} className={`p-1.5 rounded-lg transition-colors ${!isGrid?'text-[#2d9496] bg-white/5':'text-white/30 hover:text-white/60'}`}><List size={14}/></button>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-white/25 font-mono">
            <span>{filtered.length} propert{filtered.length===1?'y':'ies'} found</span>
            {(search||statusFilter!=='all'||typeFilter!=='all'||localityFilter!=='All') &&
              <button onClick={()=>{setSearch('');setStatusFilter('all');setTypeFilter('all');setLocalityFilter('All');}} className="text-[#4ecdc4] hover:underline">Clear filters</button>}
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="flex-1 overflow-y-auto px-6 lg:px-10 py-8">
        <div className="max-w-7xl mx-auto">
          {filtered.length===0 ? (
            <div className="py-32 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-[#2d9496]/10"><Search size={24} className="text-[#2d9496]"/></div>
              <h4 className="font-serif text-xl text-white">No properties found</h4>
              <p className="text-white/30 text-sm">Try adjusting your filters or search terms.</p>
            </div>
          ) : isGrid ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map(l=><Card key={l.id} l={l}/>)}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(l=><ListRow key={l.id} l={l}/>)}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-[210] flex items-start justify-center p-4 pt-8 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-[#0a1930] border border-white/10 rounded-2xl overflow-hidden shadow-2xl mb-8">
            <button onClick={()=>setDetail(null)} className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-[#2d9496] transition-colors rounded-xl text-white"><X size={16}/></button>

            {/* Image gallery */}
            <div className="relative bg-[#050e1a] aspect-[16/7] overflow-hidden">
              <img src={detail.images[imgIdx]||'https://images.pexels.com/photos/534151/pexels-photo-534151.jpeg?auto=compress&cs=tinysrgb&w=900'} alt={detail.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1930]/90 via-transparent to-transparent" />
              {detail.images.length>1 && (
                <>
                  <button onClick={()=>setImgIdx(i=>(i-1+detail.images.length)%detail.images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-[#2d9496] rounded-xl text-white transition-all"><ChevronLeft size={18}/></button>
                  <button onClick={()=>setImgIdx(i=>(i+1)%detail.images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-[#2d9496] rounded-xl text-white transition-all"><ChevronRight size={18}/></button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {detail.images.map((_,i)=><button key={i} onClick={()=>setImgIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i===imgIdx?'bg-[#4ecdc4] w-4':'bg-white/30'}`}/>)}
                  </div>
                  {/* Thumbnails */}
                  <div className="absolute bottom-4 right-4 flex gap-1.5">
                    {detail.images.slice(0,4).map((img,i)=>(
                      <button key={i} onClick={()=>setImgIdx(i)} className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all ${i===imgIdx?'border-[#2d9496]':'border-white/20'}`}>
                        <img src={img} alt="" className="w-full h-full object-cover"/>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {/* Status badge on image */}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`text-[10px] font-mono px-3 py-1 rounded-full border ${STATUS_COLOR[detail.status]}`}>{STATUS_LABEL[detail.status]}</span>
                {detail.badge && <span className="text-[10px] font-bold px-3 py-1 rounded-full text-white" style={{background:'linear-gradient(135deg,#2d9496,#1e5f61)'}}>{detail.badge}</span>}
              </div>
            </div>

            {/* Content */}
            <div className="grid md:grid-cols-3 gap-0">
              {/* Left: main info */}
              <div className="md:col-span-2 p-7 space-y-6 border-r border-white/5">
                <div>
                  <div className="flex items-center gap-1 text-white/40 text-xs mb-2"><MapPin size={11} className="text-[#2d9496]"/>{detail.locality} — {detail.address}</div>
                  <h2 className="font-serif text-2xl font-bold text-white">{detail.title}</h2>
                  <div className="font-serif text-2xl font-black grad-text mt-1">{detail.price}</div>
                </div>

                {/* Quick specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {detail.bedrooms && <div className="bg-[#050e1a] rounded-xl p-3 text-center border border-white/5"><Bed size={16} className="text-[#2d9496] mx-auto mb-1"/><div className="text-white font-bold text-sm">{detail.bedrooms} BHK</div><div className="text-white/30 text-[10px]">Bedrooms</div></div>}
                  {detail.bathrooms && <div className="bg-[#050e1a] rounded-xl p-3 text-center border border-white/5"><Bath size={16} className="text-[#2d9496] mx-auto mb-1"/><div className="text-white font-bold text-sm">{detail.bathrooms}</div><div className="text-white/30 text-[10px]">Bathrooms</div></div>}
                  {detail.carpetArea && <div className="bg-[#050e1a] rounded-xl p-3 text-center border border-white/5"><Maximize2 size={16} className="text-[#2d9496] mx-auto mb-1"/><div className="text-white font-bold text-sm">{detail.carpetArea}</div><div className="text-white/30 text-[10px]">Carpet Area</div></div>}
                  {detail.possession && <div className="bg-[#050e1a] rounded-xl p-3 text-center border border-white/5"><Check size={16} className="text-[#2d9496] mx-auto mb-1"/><div className="text-white font-bold text-sm text-xs leading-tight">{detail.possession}</div><div className="text-white/30 text-[10px]">Possession</div></div>}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h4 className="text-[13px] font-mono uppercase text-white/50 tracking-wider border-b border-white/5 pb-2">About this Property</h4>
                  {detail.description.map((d,i)=><p key={i} className="text-white/60 text-[15px] leading-[1.85]">{d}</p>)}
                </div>

                {/* Features */}
                {detail.features.length>0 && (
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-mono uppercase text-white/50 tracking-wider border-b border-white/5 pb-2">Key Features</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {detail.features.map((f,i)=><div key={i} className="flex items-center gap-2 text-sm text-white/60"><span className="w-1.5 h-1.5 rounded-full bg-[#2d9496] flex-shrink-0"/>{f}</div>)}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {detail.amenities.length>0 && (
                  <div className="space-y-2">
                    <h4 className="text-[13px] font-mono uppercase text-white/50 tracking-wider border-b border-white/5 pb-2">Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {detail.amenities.map((a,i)=><span key={i} className="px-3 py-1.5 bg-[#2d9496]/10 border border-[#2d9496]/20 text-[#4ecdc4] text-[13px] rounded-full">{a}</span>)}
                    </div>
                  </div>
                )}

                {/* Tech specs */}
                <div className="space-y-2">
                  <h4 className="text-[13px] font-mono uppercase text-white/50 tracking-wider border-b border-white/5 pb-2">Specifications</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {detail.totalArea && <div><span className="text-white/30 block font-mono uppercase text-[11px]">Built-up Area</span><span className="text-white">{detail.totalArea}</span></div>}
                    {detail.floors && <div><span className="text-white/30 block font-mono uppercase text-[11px]">Floors</span><span className="text-white">{detail.floors} Storeys</span></div>}
                    {detail.flats && <div><span className="text-white/30 block font-mono uppercase text-[11px]">Total Flats</span><span className="text-white">{detail.flats}</span></div>}
                    {detail.shops && <div><span className="text-white/30 block font-mono uppercase text-[11px]">Shops/Units</span><span className="text-white">{detail.shops}</span></div>}
                    <div><span className="text-white/30 block font-mono uppercase text-[11px]">Type</span><span className="text-white capitalize">{detail.type}</span></div>
                    <div><span className="text-white/30 block font-mono uppercase text-[11px]">Status</span><span className={`capitalize ${STATUS_COLOR[detail.status].split(' ')[0]}`}>{STATUS_LABEL[detail.status]}</span></div>
                  </div>
                </div>
              </div>

              {/* Right: enquiry */}
              <div className="p-6 space-y-5">
                <div className="bg-[#050e1a] rounded-xl p-4 border border-white/5 space-y-3">
                  <h4 className="font-serif font-bold text-white text-sm">Enquire About This Property</h4>
                  {enquirySent ? (
                    <div className="text-center py-6 space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center" style={{background:'linear-gradient(135deg,#2d9496,#1e5f61)'}}><Check size={18} className="text-white"/></div>
                      <p className="text-white/60 text-xs">Enquiry sent! We'll contact you shortly.</p>
                      <button onClick={()=>{setEnquirySent(false);setEnqName('');setEnqEmail('');}} className="text-[#4ecdc4] text-xs hover:underline">Send another</button>
                    </div>
                  ) : (
                    <form onSubmit={async e=>{e.preventDefault();try{await saveContactMessage({name:enqName,email:enqEmail||'guest@example.com',message:`Enquiry about ${detail?.title}`});}catch{}setEnquirySent(true);}} className="space-y-2.5">
                      <input type="text" placeholder="Your Name" required value={enqName} onChange={e=>setEnqName(e.target.value)} className="w-full bg-[#0a1930] text-white border border-white/10 px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#2d9496] placeholder-white/20 transition-colors"/>
                      <input type="email" placeholder="Email Address" required value={enqEmail} onChange={e=>setEnqEmail(e.target.value)} className="w-full bg-[#0a1930] text-white border border-white/10 px-3 py-2 text-xs rounded-xl focus:outline-none focus:border-[#2d9496] placeholder-white/20 transition-colors"/>
                      <button type="submit" className="teal-btn w-full py-2.5 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform"><Send size={12}/><span>Send Enquiry</span></button>
                    </form>
                  )}
                </div>

                {/* Downloads */}
                {(detail.floorPlan || detail.brochure) && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Downloads</h4>
                    <div className="flex flex-col gap-2">
                      {detail.floorPlan && (
                        <a href={detail.floorPlan} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-[#050e1a] rounded-xl border border-white/5 hover:border-[#2d9496]/40 transition-all group text-xs">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(45,148,150,0.15)'}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2d9496]"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          </div>
                          <span className="text-white text-xs">Floor Plan</span>
                        </a>
                      )}
                      {detail.brochure && (
                        <a href={detail.brochure} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-[#050e1a] rounded-xl border border-white/5 hover:border-[#2d9496]/40 transition-all group text-xs">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:'rgba(45,148,150,0.15)'}}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2d9496]"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                          </div>
                          <span className="text-white text-xs">Brochure</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
