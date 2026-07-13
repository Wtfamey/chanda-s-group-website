import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Menu, X, ChevronDown, ArrowRight,
  MapPin, Phone, Mail, Send, Instagram, Linkedin,
  Landmark, Shield, Lightbulb, Star, Heart, Handshake,
  KeyRound,
} from 'lucide-react';
import PropertyPortal from './components/PropertyPortal';
import AdminPanel from './components/AdminPanel';
import { Listing } from './types';
import { loadListingsFromSupabase, DEFAULT_LISTINGS } from './data';
import { seedListings, saveContactMessage } from './supabaseService';

/* ─────────────── ASSET IMPORTS ──────────────────────── */
import logoPng        from './assets/logopng.png';
// Team — portrait-oriented
import foundersImg    from './assets/team/founders.jpg';
import arunChandaImg  from './assets/team/arun-chanda.jpg';
import vishalChandaImg from './assets/team/vishal-chanda.jpg';
import vimalHingerImg from './assets/team/vimal-hinger.jpg';
import vijayHingerImg from './assets/team/vijay-hinger.jpg';
import kairaChandaImg from './assets/team/kaira-chanda.jpg';
import rishabhHingerImg from './assets/team/rishabh-hinger.png';
import ketanHingerImg from './assets/team/ketan-hinger.jpg';
import neelHingerImg  from './assets/team/neel-hinger.png';
import nirajHingerImg from './assets/team/niraj-hinger.png';
// Projects
import irisImg        from './assets/projects/iris.jpg';
import daffodilPostImg from './assets/projects/daffodil-post.jpg';
import daffodilsImg   from './assets/projects/daffodils.jpg';
import orchidImg      from './assets/projects/orchid.jpg';
import marigoldImg    from './assets/projects/marigold.png';
import tulipImg       from './assets/projects/tulip.jpg';
import infinityBImg   from './assets/projects/infinity-b-wing.jpg';
import cubixImg       from './assets/projects/cubix.jpg';
// Floor plans & brochures
import floorPlansPdf  from './assets/docs/floor-plans-infinity.pdf';
import daffodilBrochurePdf from './assets/docs/daffodil-heights-brochure.pdf';
import daffodilsDWBrochurePdf from './assets/docs/daffodils-d-wing-brochure.pdf';
import orchidBrochurePdf from './assets/docs/orchid-brochure.pdf';
import marigoldBrochurePdf from './assets/docs/marigold-brochure.pdf';
import tulipBrochurePdf from './assets/docs/tulip-brochure.pdf';
import companyProfilePdf from './assets/docs/company-profile.pdf';


/* ─────────────── LEADERSHIP DATA ───────────────────── */
const LEADERSHIP = [
  { name:'Mr. Gulshan R. Chanda', role:'Founder & Partner',  gen:'founders' as const, img:foundersImg,     desc:"A visionary pioneer who co-founded Chanda's Group in the late 1990s, laying the ground stone of integrity and premium craftsmanship." },
  { name:'Mr. Satish R. Chanda',  role:'Founder & Partner',  gen:'founders' as const, img:foundersImg,     desc:"Co-founder whose acute technical mastery and construction foresight defined some of Navi Mumbai's signature structures." },
  { name:'Mr. Arun R. Chanda',    role:'Founder & Partner',  gen:'founders' as const, img:arunChandaImg,   desc:"Driving force behind the Group's multi-decade operational triumph, balancing foundational legacy with corporate expansion." },
  { name:'Mr. Vijay Hinger',      role:'Partner',             gen:'founders' as const, img:vijayHingerImg, desc:'Senior collaborator who brought immense strategic value and technical brilliance to joint development initiatives.' },
  { name:'Mr. Vishal Chanda',     role:'Partner',             gen:'nextgen'  as const, img:vishalChandaImg, desc:'Leads the second generation family expansion with modern perspectives and structural innovation.' },
  { name:'Mr. Vimal Hinger',      role:'Partner',             gen:'nextgen'  as const, img:vimalHingerImg, desc:'Evolving development frameworks, bringing immense operational rigor and customer-focused architectural integration.' },
  { name:'Kaira Chanda',          role:'Next-Gen Director',   gen:'nextgen'  as const, img:kairaChandaImg,  desc:'Committed to innovation, sustainability, and ultra-high-end responsive residential design patterns.' },
  { name:'Rishabh Hinger',        role:'Next-Gen Director',   gen:'nextgen'  as const, img:rishabhHingerImg, desc:'Focusing on smart infrastructure management, premium commercial plazas, and green architecture.' },
  { name:'Mr. Ketan Hinger',      role:'Partner',             gen:'founders' as const, img:ketanHingerImg,  desc:'Senior partner contributing vast experience in project execution and client relationship management.' },
  { name:'Mr. Neel Hinger',       role:'Next-Gen Director',   gen:'nextgen'  as const, img:neelHingerImg,   desc:'Bringing fresh perspectives in design innovation and sustainable urban development.' },
  { name:'Mr. Niraj Hinger',      role:'Next-Gen Director',   gen:'nextgen'  as const, img:nirajHingerImg,  desc:'Driving digital transformation and modern construction technologies across all projects.' },
];

/* ─────────────── HELPERS ────────────────────────────── */
function useScrollReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
      { threshold: 0.1 }
    );
    ref.current?.querySelectorAll('.sr,.sr-l,.sr-r,.sr-scale').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref]);
}

/* ─────────────── CUSTOM CURSOR ──────────────────────── */
function Cursor() {
  const dot  = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const pos  = useRef({ x: 0, y: 0 });
  const rpos = useRef({ x: 0, y: 0 });
  const raf  = useRef(0);
  useEffect(() => {
    const move = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; };
    const enter = () => ring.current?.classList.add('hovered');
    const leave = () => ring.current?.classList.remove('hovered');
    window.addEventListener('mousemove', move);
    document.querySelectorAll('a,button,[data-hover]').forEach((el) => {
      el.addEventListener('mouseenter', enter);
      el.addEventListener('mouseleave', leave);
    });
    const animate = () => {
      if (dot.current) dot.current.style.transform = `translate(${pos.current.x - 4}px,${pos.current.y - 4}px)`;
      rpos.current.x += (pos.current.x - rpos.current.x) * 0.22;
      rpos.current.y += (pos.current.y - rpos.current.y) * 0.22;
      if (ring.current) {
        const w = ring.current.classList.contains('hovered') ? 28 : 18;
        ring.current.style.transform = `translate(${rpos.current.x - w}px,${rpos.current.y - w}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf.current); };
  }, []);
  return (
    <>
      <div ref={dot}  className="cursor-dot  hidden md:block" />
      <div ref={ring} className="cursor-ring hidden md:block" />
    </>
  );
}

/* ─────────────── SCROLL BAR ─────────────────────────── */
function ScrollBar() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const fn = () => { const el = document.documentElement; setW((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100); };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return <div className="scroll-bar" style={{ width: `${w}%` }} />;
}

/* ─────────────── NAVBAR ─────────────────────────────── */
const NAV_LINKS = ['About','Values','Projects','Portfolio','Team','Contact'];

function Navbar({ onOpenPortal }: { onOpenPortal: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const go = (id: string) => {
    setOpen(false);
    if (id === 'Portfolio') { onOpenPortal(); return; }
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#050e1a]/97 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-[#050e1a]/90 sm:bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-10 flex items-center justify-between h-16 sm:h-24">
        {/* Logo — logopng.png, wide wordmark */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center group flex-shrink-0">
          {/* Wide PNG logo — responsive */}
          <img
            src={logoPng}
            alt="Chanda's Group — Dreams Abode"
            className="max-h-none w-auto object-contain group-hover:opacity-90 transition-opacity duration-300 sm:-ml-14"
            style={{ height:'clamp(75px, 13vw, 190px)', transform:'translateY(8px)', filter:'drop-shadow(0 2px 12px rgba(45,148,150,0.35))' }}
          />
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <button key={l} onClick={() => go(l)}
              className="text-[13px] font-medium text-white/60 hover:text-white transition-colors relative group tracking-wide">
              {l}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-teal-400 group-hover:w-full transition-all duration-300"/>
            </button>
          ))}
          <button onClick={() => go('Contact')}
            className="teal-btn ml-1 px-5 py-2.5 text-sm font-semibold text-white rounded-full hover:scale-105 transition-transform">
            <span>Enquire Now</span>
          </button>
        </div>

        <button className="md:hidden text-white/70 hover:text-white p-2" onClick={() => setOpen(!open)}>
          {open ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden ${open ? 'max-h-[32rem]' : 'max-h-0'} bg-[#050e1a]/98 border-b border-white/5`}>
        <div className="px-6 py-4 flex flex-col">
          {NAV_LINKS.map((l) => (
            <button key={l} onClick={() => go(l)} className="py-3.5 text-left text-white/70 hover:text-white border-b border-white/5 last:border-0 text-base font-medium tracking-wide transition-colors">{l}</button>
          ))}
          <button onClick={() => go('Contact')} className="mt-4 w-full py-3.5 teal-btn text-white font-semibold rounded-full text-sm"><span>Enquire Now</span></button>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────── HERO COMPONENTS ───────────────────── */
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{ width:`${Math.random()*4+2}px`, height:`${Math.random()*4+2}px`, background: i%3===0?'#2d9496':'rgba(255,255,255,0.3)', left:`${Math.random()*100}%`, bottom:`${Math.random()*40}%`, animation:`floatUp ${4+Math.random()*6}s ${Math.random()*5}s ease-in infinite`, opacity:0.6 }} />
      ))}
    </div>
  );
}

function BuildingSilhouette() {
  const buildings = [
    { x:0,w:60,h:160,floors:8 },{ x:62,w:80,h:240,floors:12 },{ x:144,w:50,h:120,floors:6 },
    { x:196,w:100,h:320,floors:16,spire:true },{ x:298,w:70,h:200,floors:10 },{ x:370,w:90,h:280,floors:14 },
    { x:462,w:55,h:150,floors:7 },{ x:519,w:120,h:360,floors:18,spire:true },{ x:641,w:75,h:220,floors:11 },
    { x:718,w:60,h:170,floors:8 },{ x:780,w:95,h:290,floors:14 },{ x:877,w:65,h:190,floors:9 },{ x:944,w:56,h:130,floors:6 },
  ] as any[];
  return (
    <div className="absolute bottom-0 left-0 right-0 h-96 overflow-hidden pointer-events-none">
      <svg viewBox="0 0 1000 380" preserveAspectRatio="xMidYMax slice" className="w-full h-full" style={{ opacity:0.18 }}>
        {buildings.map((b,i) => (
          <g key={i} style={{ transformOrigin:`${b.x+b.w/2}px 380px`, animation:`buildRise 1.2s ${0.05*i}s cubic-bezier(.16,1,.3,1) both` }}>
            <rect x={b.x} y={380-b.h} width={b.w} height={b.h} fill="#2d9496"/>
            {b.spire && <polygon points={`${b.x+b.w/2},${380-b.h-40} ${b.x+5},${380-b.h} ${b.x+b.w-5},${380-b.h}`} fill="#4ecdc4"/>}
            {Array.from({ length: Math.floor(b.h/22) }).map((_,r) =>
              Array.from({ length: Math.floor(b.w/18) }).map((_,c) => (
                <rect key={`${r}-${c}`} x={b.x+4+c*18} y={380-b.h+6+r*22} width={10} height={14} rx="1" fill="#050e1a" opacity="0.7"/>
              ))
            )}
          </g>
        ))}
        <rect x="0" y="375" width="1000" height="5" fill="#2d9496" opacity="0.6"/>
      </svg>
    </div>
  );
}

function Hero({ onOpenPortal }: { onOpenPortal: () => void }) {
  const words = ['Building','Dreams,'];
  const words2 = ['Crafting','Legacies'];
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 200); return () => clearTimeout(t); }, []);
  return (
    <section className="relative min-h-screen min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-[#050e1a]">
      <div className="absolute inset-0 building-grid opacity-15" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none" style={{ background:'radial-gradient(circle, rgba(45,148,150,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none" style={{ background:'linear-gradient(135deg, #2d9496 0%, transparent 60%)', opacity:0.35, clipPath:'polygon(0 100%,100% 100%,0 0)' }} />
      <Particles />
      <BuildingSilhouette />
      <div className="absolute inset-0 grain pointer-events-none overflow-hidden opacity-[0.03]" />
      <div className="relative z-10 text-center px-4 sm:px-6 mt-[-20px] sm:mt-[-60px]">
        {/* ── No logo repeated in hero — it's in the navbar ── */}
        <div className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 rounded-full border border-[#2d9496]/40 bg-[#2d9496]/10 backdrop-blur-sm mb-4 sm:mb-6 transition-all duration-700 ${visible?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`} style={{ transitionDelay:'0.15s' }}>
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-teal-300 text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase">Dreams Abode — Since 1990s</span>
        </div>
        <h1 className="leading-none mb-3 sm:mb-4">
          <div className="flex flex-wrap justify-center gap-x-3 sm:gap-x-6 gap-y-0 overflow-hidden">
            {words.map((w,i) => (
              <span key={w} className="block text-white text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black transition-all duration-700"
                style={{ fontFamily:"'Playfair Display', Georgia, serif", transitionDelay:`${0.3+i*0.12}s`, opacity:visible?1:0, transform:visible?'translateY(0)':'translateY(60px)' }}>{w}</span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 sm:gap-x-6 overflow-hidden mt-0 sm:mt-1">
            {words2.map((w,i) => (
              <span key={w} className="block text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black transition-all duration-700 grad-text"
                style={{ fontFamily:"'Playfair Display', Georgia, serif", transitionDelay:`${0.5+i*0.12}s`, opacity:visible?1:0, transform:visible?'translateY(0)':'translateY(60px)' }}>{w}</span>
            ))}
          </div>
        </h1>
        <p className="text-white/50 text-sm sm:text-base lg:text-lg max-w-lg mx-auto leading-relaxed mt-4 sm:mt-6 transition-all duration-700 font-corsiva text-base sm:text-xl italic px-2"
          style={{ transitionDelay:'0.8s', opacity:visible?1:0, transform:visible?'translateY(0)':'translateY(20px)' }}>
          Founded in the late 1990s by the Chanda family — over 40 years of crafting legacies.
        </p>
        <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center transition-all duration-700 px-4 sm:px-0"
          style={{ transitionDelay:'0.95s', opacity:visible?1:0, transform:visible?'translateY(0)':'translateY(20px)' }}>
          <button onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior:'smooth' })}
            className="teal-btn group px-6 sm:px-8 py-3 sm:py-4 font-semibold rounded-full text-white flex items-center gap-2 justify-center hover:scale-105 transition-transform text-sm sm:text-base">
            <span>Explore Projects</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button onClick={onOpenPortal}
            className="px-6 sm:px-8 py-3 sm:py-4 font-semibold rounded-full text-white/80 hover:text-white border border-white/20 hover:border-[#2d9496]/60 backdrop-blur-sm transition-all text-sm sm:text-base">
            View Full Portfolio
          </button>
        </div>
      </div>
      <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior:'smooth' })}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors">
        <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
        <ChevronDown size={16} className="animate-bounce" />
      </button>
    </section>
  );
}

/* ─────────────── MARQUEE ────────────────────────────── */
function Marquee() {
  const items = ['DREAMS ABODE','SINCE 1990s','LEGACY & TRUST','NAVI MUMBAI','INNOVATION','QUALITY CRAFTSMANSHIP','40+ YEARS','INFINITY TOWER'];
  const repeated = [...items, ...items];
  return (
    <div className="bg-[#2d9496] py-4 overflow-hidden relative">
      <div className="marquee-track flex items-center gap-0">
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center gap-6 px-6">
            <span className="text-white font-bold text-xs tracking-[0.25em] uppercase whitespace-nowrap">{item}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── ABOUT ──────────────────────────────── */
function About() {
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref);
  return (
    <section id="about" ref={ref} className="bg-white py-16 sm:py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="sr-l relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[300px] sm:h-[400px] lg:h-[540px]">
            <img src={irisImg} alt="Chanda's Group Infinity Tower" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050e1a]/60 to-transparent" />
            <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8">
              <div className="text-white/60 text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-1 font-corsiva italic">Landmark Project</div>
              <div className="text-white font-serif text-xl sm:text-2xl font-black uppercase tracking-wide">INFINITY TOWER</div>
              <div className="text-[#4ecdc4] text-xs sm:text-sm">A Wing, Sector 2A, Koperkhairane</div>
            </div>
          </div>
          <div className="hidden sm:block absolute -right-6 top-12 bg-white rounded-2xl shadow-2xl p-5 border border-gray-100">
            <div className="text-[#050e1a] font-serif font-black text-3xl leading-none">40+</div>
            <div className="text-gray-500 text-xs mt-1 font-medium">Years of Legacy</div>
          </div>
          <div className="hidden sm:block absolute -right-6 bottom-20 bg-[#2d9496] rounded-2xl shadow-2xl p-5">
            <div className="text-white font-serif font-black text-3xl leading-none">700+</div>
            <div className="text-teal-100 text-xs mt-1 font-medium">Families Housed</div>
          </div>
          <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-2xl opacity-20" style={{ background:'linear-gradient(135deg,#2d9496,#4ecdc4)' }} />
        </div>
        <div className="space-y-6">
          <div className="sr">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-px bg-[#2d9496]" />
              <span className="text-[#2d9496] text-sm font-semibold tracking-[0.2em] uppercase">Our Story</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl font-black text-[#050e1a] leading-[1.05] uppercase tracking-wide">A LEGACY BUILT ON<br /><span style={{ color:'#2d9496' }}>TRUST &amp; VISION</span></h2>
          </div>
          <p className="sr delay-1 text-gray-600 leading-relaxed text-[15px]">
            Chanda's Group was founded in the late 1990s by four visionary brothers —{' '}
            <strong className="text-[#050e1a] font-serif font-black tracking-wide">MR. GULSHAN R. CHANDA, MR. SATISH R. CHANDA, MR. ARUN R. CHANDA,</strong>{' '}
            and <strong className="text-[#050e1a] font-serif font-black tracking-wide">MR. RAJESH R. CHANDA.</strong>{' '}
            The company has grown into one of the most trusted names in real estate, carrying forward a legacy of over 40 years built on integrity, commitment, and high-quality workmanship.
          </p>
          <p className="sr delay-2 text-gray-600 leading-relaxed text-[15px]">
            Today, <strong className="text-[#050e1a] font-serif font-black tracking-wide">MR. VISHAL CHANDA</strong> represents the second generation, bringing fresh ideas and innovative approaches. The company was further strengthened through the <strong className="text-[#050e1a] font-serif font-black tracking-wide">HINGER BROTHERS</strong> — <strong className="text-[#050e1a] font-serif font-black tracking-wide">MR. VIJAY HINGER</strong> and <strong className="text-[#050e1a] font-serif font-black tracking-wide">MR. VIMAL HINGER.</strong>
          </p>
          <div className="sr delay-3 grid grid-cols-2 gap-4 pt-4">
            {[['20+','Projects Delivered'],['10+','Locations Served'],['40+','Years of Excellence'],['2','Families, One Vision']].map(([n,l]) => (
              <div key={l} className="p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:border-[#2d9496]/30 hover:bg-teal-50/30 transition-all group">
                <div className="font-serif font-black text-2xl text-[#2d9496] group-hover:scale-110 transition-transform origin-left">{n}</div>
                <div className="text-gray-500 text-sm mt-0.5">{l}</div>
              </div>
            ))}
          </div>
          <div className="sr delay-4 pt-6">
            <a href={companyProfilePdf} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3.5 bg-[#2d9496] text-white rounded-xl font-semibold text-sm hover:bg-[#1e5f61] transition-all group shadow-lg shadow-[#2d9496]/25">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-y-0.5 transition-transform"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Download Company Profile
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── STATS ──────────────────────────────── */
function useCountUp(target: number, start: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    let c = 0;
    const t = setInterval(() => { c += target / 55; if (c >= target) { setN(target); clearInterval(t); } else setN(Math.floor(c)); }, 1800 / 55);
    return () => clearInterval(t);
  }, [start, target]);
  return n;
}

function StatNum({ val, suf }: { val: number; suf: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setGo(true); }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  const n = useCountUp(val, go);
  return <div ref={ref} className="font-serif font-black text-5xl sm:text-6xl grad-text">{n}{suf}</div>;
}

function Stats() {
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref);
  return (
    <section ref={ref} className="bg-[#050e1a] py-16 sm:py-24 px-6 lg:px-10 relative overflow-hidden">
      <div className="absolute inset-0 building-grid opacity-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-[#2d9496]/20 to-transparent" />
      <div className="max-w-7xl mx-auto relative">
        <div className="sr text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-px bg-[#2d9496]" />
            <span className="text-[#2d9496] text-sm font-semibold tracking-[0.2em] uppercase">By The Numbers</span>
            <div className="w-12 h-px bg-[#2d9496]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white">Our Impact</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[{val:40,suf:'+',lbl:'Years of Legacy',desc:'Decades of trusted craftsmanship'},{val:20,suf:'+',lbl:'Projects Delivered',desc:'Across Mumbai & Navi Mumbai'},{val:700,suf:'+',lbl:'Happy Families',desc:'Homes built with love'},{val:10,suf:'+',lbl:'Locations',desc:'Prime urban locations'}].map((s,i) => (
            <div key={i} className={`sr delay-${i+1} glass rounded-2xl p-8 text-center group`} style={{ animation:`pulse-glow ${3+i}s ${i*0.5}s ease-in-out infinite` }}>
              <StatNum val={s.val} suf={s.suf} />
              <div className="text-white font-bold text-base mt-2">{s.lbl}</div>
              <div className="text-white/40 text-xs mt-1">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── VALUES ─────────────────────────────── */
const VALUES = [
  { icon: Landmark,  n:'01', t:'Legacy',             d:'We honor our roots and the trust built over decades — carrying forward a tradition of excellence that defines who we are.' },
  { icon: Shield,    n:'02', t:'Integrity',           d:'Every structure we create stands on the foundation of honesty, transparency, and ethical business practices.' },
  { icon: Lightbulb, n:'03', t:'Innovation',          d:'We continuously evolve — embracing new ideas, designs, and technologies to shape modern, sustainable spaces.' },
  { icon: Star,      n:'04', t:'Quality',             d:'From planning to delivery, we uphold uncompromising standards of craftsmanship and precision in every project.' },
  { icon: Heart,     n:'05', t:'Customer Commitment', d:'Our customers are at the heart of everything we do. We strive to exceed expectations and turn every vision into reality.' },
  { icon: Handshake, n:'06', t:'Collaboration',       d:'We believe great structures are built together — through teamwork, respect, and shared passion across generations.' },
];

function Values() {
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref);
  return (
    <section id="values" ref={ref} className="bg-[#0a1930] py-16 sm:py-28 px-6 lg:px-10 relative overflow-hidden">
      <div className="absolute inset-0 building-grid opacity-15" />
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle, rgba(45,148,150,0.12) 0%, transparent 70%)', transform:'translate(30%, -30%)' }} />
      <div className="max-w-7xl mx-auto relative">
        <div className="sr text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-px bg-[#2d9496]" /><span className="text-[#2d9496] text-sm font-semibold tracking-[0.2em] uppercase">What We Stand For</span><div className="w-12 h-px bg-[#2d9496]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white">Our Core Values</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {VALUES.map(({ icon: Icon, n, t, d }, i) => (
            <div key={i} className={`sr delay-${Math.min(i+1,6)} glow-border rounded-2xl p-8 group hover:bg-[#2d9496]/5 transition-all duration-500 relative overflow-hidden`}>
              <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background:'linear-gradient(to bottom, transparent 0%, rgba(45,148,150,0.04) 50%, transparent 100%)' }} /></div>
              <div className="absolute top-4 right-4 font-serif font-black text-8xl text-white/[0.03] group-hover:text-white/[0.06] transition-colors select-none leading-none">{n}</div>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110" style={{ background:'linear-gradient(135deg, #2d9496, #1e5f61)', boxShadow:'0 8px 32px rgba(45,148,150,0.3)' }}>
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white mb-3">{t}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{d}</p>
              </div>
              <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-700 bg-gradient-to-r from-[#2d9496] to-[#4ecdc4]" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── PROJECTS (original cards) ──────────── */
type Proj = { name:string; sub?:string; loc:string; area:string; units:string; img:string; badge?:string; dark?:boolean; floorPlan?:string; brochure?:string };

const COMPLETED: Proj[] = [
  { name:'Infinity Tower', sub:'A Wing', loc:'Sector 2A, Koperkhairane', area:'—', units:'2 BHK & 3 BHK • 26 Storeys', img:irisImg, badge:'Flagship', dark:true, floorPlan:floorPlansPdf },
  { name:'Daffodil Heights', loc:'Sai Vihar T.P. Road, Bhandup (W)', area:'2,50,000 sq. ft.', units:'255 Flats', img:daffodilPostImg, brochure:daffodilBrochurePdf },
  { name:'Orchid Apartments', loc:'Sector 21, Ghansoli', area:'35,000 sq. ft.', units:'38 Flats', img:orchidImg, brochure:orchidBrochurePdf },
  { name:'Gangasagar CHS', loc:'Plot 44–46, Sector 20, Koperkhairane', area:'48,000 sq. ft.', units:'88 Flats + 23 Shops', img:'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=700' },
  { name:'Siddeshwar CHS', loc:'Plot 105, Sector 2, Koperkhairane', area:'55,000 sq. ft.', units:'79 Flats + 24 Shops', img:'https://images.pexels.com/photos/2476632/pexels-photo-2476632.jpeg?auto=compress&cs=tinysrgb&w=700' },
  { name:'Sagardeep CHS', loc:'Plot 24–26, Sector 20, Koperkhairane', area:'26,000 sq. ft.', units:'48 Flats + 15 Shops', img:'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=700' },
  { name:'Nirman CHS', loc:'Sector 13, New Panvel', area:'30,000 sq. ft.', units:'32 Flats + 16 Shops', img:'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=700' },
  { name:'Tulip Apartments', loc:'Plot 27H, Sector 11, Koperkhairane', area:'12,600 sq. ft.', units:'16 Flats', img:tulipImg, brochure:tulipBrochurePdf },
  { name:'Marigold Apartments', loc:'Sector 21, Ghansoli', area:'14,000 sq. ft.', units:'Residential Flats', img:marigoldImg, brochure:marigoldBrochurePdf },
  { name:'Cubix Shopping Arcade', loc:'Akurdi, Pune', area:'45,000 sq. ft.', units:'Commercial', img:cubixImg, badge:'Commercial' },
  { name:'Deep CHS', loc:'Plot 44, Sector 14, Koperkhairane', area:'17,000 sq. ft.', units:'27 Flats + 7 Shops', img:'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=700' },
  { name:'Best CHS', loc:'Plot 39, Sector 14, Koperkhairane', area:'12,000 sq. ft.', units:'20 Flats', img:orchidImg },
  { name:'Poonam CHS', loc:'Plot 40, Sector 14, Koperkhairane', area:'12,000 sq. ft.', units:'20 Flats', img:'https://images.pexels.com/photos/2119714/pexels-photo-2119714.jpeg?auto=compress&cs=tinysrgb&w=700' },
  { name:'Tulsikripa CHS', loc:'Plot 41, Sector 14, Koperkhairane', area:'12,000 sq. ft.', units:'20 Flats', img:marigoldImg },
  { name:'Jyotirling CHS', loc:'Plot 43, Sector 14, Koperkhairane', area:'7,600 sq. ft.', units:'16 Flats', img:tulipImg },
];
const UPCOMING: Proj[] = [
  { name:'Infinity Tower', sub:'B Wing', loc:'Sector 2A, Koperkhairane', area:'—', units:'44 Premium Flats', img:infinityBImg, badge:'Luxury', dark:true, floorPlan:floorPlansPdf },
  { name:'Greenfield Heights', loc:'Chembur, Mumbai', area:'4,06,000 sq. ft.', units:'Mixed Use', img:'https://images.pexels.com/photos/2476632/pexels-photo-2476632.jpeg?auto=compress&cs=tinysrgb&w=700', badge:'Mega' },
  { name:'Daffodils Heights', sub:'D Wing', loc:'Bhandup (West), Mumbai', area:'—', units:'105 Flats', img:daffodilsImg, badge:'Phase 2', brochure:daffodilsDWBrochurePdf },
  { name:'Jasmine Heights', loc:'Ghansoli, Navi Mumbai', area:'38,000 sq. ft.', units:'Residential', img:orchidImg },
  { name:'Meridian Heights', loc:'Ghansoli, Navi Mumbai', area:'14,000 sq. ft.', units:'Residential', img:irisImg },
];

function ProjCard({ p, big=false, onClick }: { p:Proj; big?:boolean; onClick?:()=>void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const handleMove = useCallback((clientX: number, clientY: number) => {
    const el = cardRef.current; if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (clientX-left-width/2)/(width/2); const y = (clientY-top-height/2)/(height/2);
    el.style.transform = `perspective(800px) rotateY(${x*5}deg) rotateX(${-y*5}deg) translateZ(10px)`;
  }, []);
  const handleLeave = useCallback(() => { if (cardRef.current) cardRef.current.style.transform = ''; }, []);
  return (
    <div ref={cardRef} onClick={onClick}
      onMouseMove={e => handleMove(e.clientX, e.clientY)}
      onMouseLeave={handleLeave}
      onTouchMove={e => { const t = e.touches[0]; if (t) handleMove(t.clientX, t.clientY); }}
      onTouchEnd={handleLeave}
      className={`proj-card relative overflow-hidden rounded-2xl group cursor-pointer ${big?'h-[500px]':'h-64 sm:h-72'}`}>
      <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050e1a]/90 via-[#050e1a]/30 to-transparent" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background:'linear-gradient(to bottom, transparent 30%, rgba(45,148,150,0.15) 60%, transparent 90%)' }} />
      {p.badge && <div className="absolute top-4 left-4 px-3 py-1 text-xs font-bold tracking-wider uppercase text-white rounded-full" style={{ background:'linear-gradient(135deg,#2d9496,#1e5f61)' }}>{p.badge}</div>}
      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <div className="text-[#4ecdc4] text-xs tracking-[0.2em] uppercase mb-1 font-semibold">{p.sub||'Residential'}</div>
        <h3 className={`font-serif font-bold text-white leading-tight ${big?'text-3xl':'text-xl'}`}>{p.name}</h3>
        <div className="flex items-center gap-2 mt-2 text-white/60 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <MapPin size={12} className="text-[#2d9496]" /><span>{p.loc}</span>
        </div>
        {p.area !== '—' && <div className="flex items-center gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75"><span className="text-white/50 text-xs">{p.area}</span><span className="text-white/50 text-xs">•</span><span className="text-white/50 text-xs">{p.units}</span></div>}
        <div className="mt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={(e) => { e.stopPropagation(); document.getElementById('contact')?.scrollIntoView({ behavior:'smooth' }); }}
            className="flex items-center gap-1.5 text-[#4ecdc4] text-sm font-semibold hover:gap-2.5 transition-all">
            Enquire <ArrowRight size={14} />
          </button>
          {p.floorPlan && (
            <a href={p.floorPlan} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-white/60 hover:text-white text-xs transition-colors border border-white/20 hover:border-[#2d9496]/50 px-2.5 py-1 rounded-full">
              Floor Plan
            </a>
          )}
          {p.brochure && (
            <a href={p.brochure} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-white/60 hover:text-white text-xs transition-colors border border-white/20 hover:border-[#2d9496]/50 px-2.5 py-1 rounded-full">
              Brochure
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Projects({ onOpenPortal }: { onOpenPortal: () => void }) {
  const [tab, setTab] = useState<'c'|'u'>('c');
  const [detail, setDetail] = useState<Proj|null>(null);
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref);
  const list = tab==='c' ? COMPLETED : UPCOMING;
  const shown = list;
  const [featured, ...rest] = shown;

  /* iOS-safe scroll lock for detail modal */
  useEffect(() => {
    if (detail) {
      const sy = window.scrollY;
      document.body.style.position = 'fixed'; document.body.style.top = `-${sy}px`;
      document.body.style.width = '100%'; document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = ''; document.body.style.top = '';
        document.body.style.width = ''; document.body.style.overflow = '';
        window.scrollTo(0, sy);
      };
    }
  }, [detail]);

  const DetailModal = detail ? (
    <div className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={() => setDetail(null)} style={{ overscrollBehavior:'contain' }}>
      <div className="relative w-full max-w-4xl bg-[#0a1930] border border-white/10 rounded-2xl overflow-hidden shadow-2xl my-8" onClick={e => e.stopPropagation()}>
        <button onClick={() => setDetail(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-[#2d9496] rounded-xl text-white transition-all"><X size={16}/></button>
        <div className="relative bg-[#050e1a] aspect-video overflow-hidden">
          <img src={detail.img} alt={detail.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1930]/90 to-transparent" />
          {detail.badge && <div className="absolute top-4 left-4 px-3 py-1 text-xs font-bold tracking-wider uppercase text-white rounded-full" style={{ background:'linear-gradient(135deg,#2d9496,#1e5f61)' }}>{detail.badge}</div>}
        </div>
        <div className="p-6 md:p-8 space-y-5">
          <div>
            <div className="text-[#4ecdc4] text-xs tracking-[0.2em] uppercase mb-1">{detail.sub||'Residential'}</div>
            <h3 className="font-serif text-2xl font-bold text-white">{detail.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-sm"><MapPin size={13} className="text-[#2d9496]"/><span>{detail.loc}</span></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {detail.area !== '—' && <div className="bg-[#050e1a] rounded-xl p-3 border border-white/5"><div className="text-white/30 text-[10px] font-mono uppercase">Area</div><div className="text-white font-bold text-sm">{detail.area}</div></div>}
            <div className="bg-[#050e1a] rounded-xl p-3 border border-white/5"><div className="text-white/30 text-[10px] font-mono uppercase">Units</div><div className="text-white font-bold text-sm">{detail.units}</div></div>
            <div className="bg-[#050e1a] rounded-xl p-3 border border-white/5"><div className="text-white/30 text-[10px] font-mono uppercase">Status</div><div className="text-[#4ecdc4] font-bold text-sm">{tab==='c'?'Completed':'Upcoming'}</div></div>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={() => { setDetail(null); setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior:'smooth' }), 100); }}
              className="teal-btn px-5 py-2.5 text-white text-sm font-semibold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform">
              <ArrowRight size={14}/> Enquire Now
            </button>
            {detail.floorPlan && <a href={detail.floorPlan} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-white rounded-xl text-sm transition-all">Floor Plan <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></a>}
            {detail.brochure && <a href={detail.brochure} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-white/70 hover:text-white rounded-xl text-sm transition-all">Brochure <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></a>}
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <section id="projects" ref={ref} className="bg-[#050e1a] py-16 sm:py-28 px-6 lg:px-10 relative">
      <div className="absolute inset-0 building-grid opacity-10" />
      <div className="max-w-7xl mx-auto relative">
        <div className="sr flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4"><div className="w-8 h-px bg-[#2d9496]" /><span className="text-[#2d9496] text-sm font-semibold tracking-[0.2em] uppercase">Our Portfolio</span></div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white">Our Projects</h2>
          </div>
          <div className="flex items-center gap-4 self-start flex-wrap">
            <div className="flex bg-white/5 rounded-full p-1.5 gap-1 border border-white/10">
              {([['c','Completed'],['u','Upcoming']] as [string,string][]).map(([v,lbl]) => (
                <button key={v} onClick={() => setTab(v as 'c'|'u')}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${tab===v?'text-white':'text-white/50 hover:text-white/80'}`}
                  style={tab===v?{ background:'linear-gradient(135deg,#2d9496,#1e5f61)' }:{}}>
                  {lbl}
                </button>
              ))}
            </div>
            <button onClick={onOpenPortal} className="teal-btn px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:scale-105 transition-transform"><span>Full Portfolio →</span></button>
          </div>
        </div>
        {featured && (
          <div className="grid lg:grid-cols-5 gap-5 mb-5">
            <div className="lg:col-span-3 sr"><ProjCard p={featured} big onClick={() => setDetail(featured)} /></div>
            <div className="lg:col-span-2 grid grid-rows-2 gap-5">
              {rest.slice(0,2).map((p,i) => <div key={i} className={`sr delay-${i+2}`}><ProjCard p={p} onClick={() => setDetail(p)} /></div>)}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {rest.slice(2).map((p,i) => <div key={i} className={`sr delay-${Math.min(i+1,4)}`}><ProjCard p={p} onClick={() => setDetail(p)} /></div>)}
        </div>

      </div>
      {DetailModal}
    </section>
  );
}

/* ─────────────── TEAM (with real photos) ────────────── */
function Team() {
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref);
  const [genFilter, setGenFilter] = useState<'all'|'founders'|'nextgen'>('all');
  const shown = useMemo(() => LEADERSHIP.filter(l => genFilter==='all' || l.gen===genFilter), [genFilter]);

  return (
    <section id="team" ref={ref} className="bg-white py-16 sm:py-28 px-6 lg:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="sr text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-px bg-[#2d9496]" />
            <span className="text-[#2d9496] text-sm font-semibold tracking-[0.2em] uppercase">The People</span>
            <div className="w-12 h-px bg-[#2d9496]" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#050e1a]">Our Leadership</h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Two families. One vision. Over four decades of building landmarks that stand the test of time.
          </p>
        </div>

        {/* Founders group photo — full-width hero banner */}
        {(genFilter === 'all' || genFilter === 'founders') && (
          <div className="sr mb-10 relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] sm:aspect-[21/9]">
            <img
              src={foundersImg}
              alt="Chanda's Group Founders"
              className="w-full h-full object-cover object-[50%_20%] bg-[#0a1930]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050e1a]/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="w-4 sm:w-6 h-px bg-[#4ecdc4]" />
                <span className="text-[#4ecdc4] text-[8px] sm:text-[10px] tracking-[0.3em] uppercase font-semibold">The Visionaries</span>
              </div>
              <h3 className="font-serif text-sm sm:text-2xl md:text-3xl font-black text-white leading-tight">Founding Partners</h3>
              <p className="text-white/60 text-[10px] sm:text-sm mt-1 sm:mt-2 leading-relaxed hidden sm:block">
                Mr. Gulshan R. Chanda &nbsp;·&nbsp; Mr. Satish R. Chanda &nbsp;·&nbsp; Mr. Arun R. Chanda &nbsp;·&nbsp; Mr. Vijay Hinger
              </p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="sr flex justify-center gap-2 mb-10">
          {[{id:'all',label:'All Board'},{id:'founders',label:'Founders'},{id:'nextgen',label:'Next Generation'}].map(tab => (
            <button key={tab.id} onClick={() => setGenFilter(tab.id as any)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${genFilter===tab.id ? 'text-white border-[#2d9496]' : 'text-[#050e1a]/60 border-gray-200 hover:border-[#2d9496]/40'}`}
              style={genFilter===tab.id ? { background:'linear-gradient(135deg,#2d9496,#1e5f61)' } : {}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Photo cards grid — 4 cols for next-gen (portrait), proper face framing */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {shown.map((leader, i) => {
            // All team portraits are taller than wide — use object-top to show faces
            const isFounder = leader.gen === 'founders';
            return (
              <div key={leader.name} className={`sr delay-${Math.min(i+1,6)} group`} style={{ transitionDelay:`${i*0.07}s` }}>
                <div className="bg-[#050e1a] rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-[#2d9496]/25 transition-all duration-500 hover:-translate-y-2 h-full flex flex-col">
                  {/* Photo container — fixed aspect, portrait photos get object-top for face */}
                  <div className="relative overflow-hidden bg-[#0a1930]" style={{ paddingBottom: '120%' /* 5:6 ratio — good for portrait faces */ }}>
                    <img
                      src={leader.img}
                      alt={leader.name}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isFounder ? 'grayscale-[60%] group-hover:grayscale-0' : 'grayscale-[40%] group-hover:grayscale-0'}`}
                      style={{ objectPosition: leader.name === 'Kaira Chanda' ? '50% 8%' : '50% 0%' }}
                      loading="lazy"
                    />
                    {/* Dark gradient at bottom for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#050e1a] to-transparent pointer-events-none" />
                    {/* Teal shimmer on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ background:'linear-gradient(to bottom, transparent 60%, rgba(45,148,150,0.25) 100%)' }} />
                    {/* Badge */}
                    <div className="absolute top-3 left-3 px-2 py-0.5 bg-[#050e1a]/80 backdrop-blur-sm text-[9px] font-semibold border border-white/15 tracking-widest uppercase text-white rounded-full">
                      {isFounder ? 'Founder' : 'Next-Gen'}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-4 flex-grow border-t border-white/5">
                    <h4 className="font-serif font-bold text-white text-[13px] leading-snug group-hover:text-[#4ecdc4] transition-colors duration-300">{leader.name}</h4>
                    <div className="text-[#4ecdc4] text-[10px] tracking-wider uppercase font-semibold mt-1">{leader.role}</div>
                    {leader.desc && <p className="text-white/35 text-[11px] mt-2 leading-relaxed line-clamp-2">{leader.desc}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────── CONTACT ────────────────────────────── */
const CONTACTS = [
  { name:'Vishal Chanda', role:'Partner', phone:'+91 98206 46335', email:'vishalchanda@chandasgroup.com' },
  { name:'Vimal Hinger',  role:'Partner', phone:'+91 98925 60282', email:'vimal@chandasgroup.com' },
  { name:'Vijay Hinger',  role:'Partner', phone:'+91 98925 79031', email:'vijay@chandasgroup.com' },
];

function Contact() {
  const ref = useRef<HTMLElement>(null);
  useScrollReveal(ref);
  const [form, setForm] = useState({ name:'', email:'', phone:'', msg:'' });
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveContactMessage({ name: form.name, email: form.email, phone: form.phone, message: form.msg });
    } catch (err) {
      console.error('Failed to save contact message:', err);
    }
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ name:'',email:'',phone:'',msg:'' }); }, 4000);
  };
  const inp = "w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#2d9496] focus:bg-[#2d9496]/5 transition-all";
  return (
    <section id="contact" ref={ref} className="bg-[#0a1930] py-16 sm:py-28 px-6 lg:px-10 relative overflow-hidden">
      <div className="absolute inset-0 building-grid opacity-15" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background:'radial-gradient(circle, rgba(45,148,150,0.1) 0%, transparent 70%)', transform:'translate(30%,30%)' }} />
      <div className="max-w-7xl mx-auto relative">
        <div className="sr text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4"><div className="w-12 h-px bg-[#2d9496]" /><span className="text-[#2d9496] text-sm font-semibold tracking-[0.2em] uppercase">Get In Touch</span><div className="w-12 h-px bg-[#2d9496]" /></div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-white">Contact Us</h2>
          <p className="mt-4 text-white/50 max-w-md mx-auto text-[15px]">Our team is always ready to assist you. Reach out through phone, email, or visit our office.</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-10">
          <div className="sr-l space-y-5">
            <div className="glass rounded-2xl p-6 flex gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'linear-gradient(135deg,#2d9496,#1e5f61)' }}><MapPin size={18} className="text-white" /></div>
              <div><div className="text-white font-semibold mb-1">Office Address</div><div className="text-white/50 text-sm leading-relaxed">2nd Floor, Infinity Tower, Plot No: 12 &amp; 13,<br />Koparkhairane, Navi Mumbai – 400 709</div></div>
            </div>
            <div className="glass rounded-2xl p-6 flex gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'linear-gradient(135deg,#2d9496,#1e5f61)' }}><Mail size={18} className="text-white" /></div>
              <div><div className="text-white font-semibold mb-1">General Enquiries</div><a href="mailto:info@chandasgroup.com" className="text-[#4ecdc4] hover:underline text-sm">info@chandasgroup.com</a></div>
            </div>
            {CONTACTS.map((c,i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:border-[#2d9496]/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div><div className="font-serif font-bold text-white">{c.name}</div><div className="text-[#4ecdc4] text-xs font-semibold tracking-wide">{c.role}</div></div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'rgba(45,148,150,0.15)' }}><span className="font-serif font-bold text-[#4ecdc4] text-sm">{c.name.split(' ').map(n=>n[0]).join('')}</span></div>
                </div>
                <div className="space-y-2">
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-white/60 text-sm hover:text-[#4ecdc4] transition-colors"><Phone size={12} className="text-[#2d9496]" />{c.phone}</a>
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-white/60 text-sm hover:text-[#4ecdc4] transition-colors"><Mail size={12} className="text-[#2d9496]" />{c.email}</a>
                </div>
              </div>
            ))}
            <div className="flex gap-3">
              {[{ href:'https://www.instagram.com/chandas_group?igsh=MXNjdGI5MmQ4M20xYQ%3D%3D&utm_source=qr', icon:Instagram, label:'@chandas_group' },{ href:'https://www.linkedin.com/company/chanda-s-group/', icon:Linkedin, label:'LinkedIn' }].map(({ href,icon:Icon,label }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3.5 glass rounded-xl text-white/60 hover:text-white hover:border-[#2d9496]/40 transition-all text-sm font-medium"><Icon size={16} className="text-[#2d9496]" />{label}</a>
              ))}
            </div>
          </div>
          <div className="sr-r glow-border rounded-3xl p-8 lg:p-10">
            <h3 className="font-serif text-2xl font-bold text-white mb-8">Send a Message</h3>
            {sent ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background:'linear-gradient(135deg,#2d9496,#1e5f61)', boxShadow:'0 0 40px rgba(45,148,150,0.4)' }}><Send className="text-white" size={26} /></div>
                <h4 className="font-serif text-xl font-bold text-white mb-2">Message Sent!</h4>
                <p className="text-white/50">We'll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="block text-white/60 text-xs font-medium tracking-wide uppercase mb-2">Full Name</label><input type="text" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name" className={inp} /></div>
                  <div><label className="block text-white/60 text-xs font-medium tracking-wide uppercase mb-2">Phone</label><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+91 XXXXX XXXXX" className={inp} /></div>
                </div>
                <div><label className="block text-white/60 text-xs font-medium tracking-wide uppercase mb-2">Email</label><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="your@email.com" className={inp} /></div>
                <div><label className="block text-white/60 text-xs font-medium tracking-wide uppercase mb-2">Message</label><textarea required rows={5} value={form.msg} onChange={e=>setForm({...form,msg:e.target.value})} placeholder="Tell us about your requirements..." className={`${inp} resize-none`} /></div>
                <button type="submit" className="teal-btn w-full py-4 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"><span>Send Enquiry</span><Send size={15} /></button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── FOOTER ─────────────────────────────── */
function Footer({ onOpenPortal }: { onOpenPortal: () => void }) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
  return (
    <footer className="bg-[#050e1a] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <div className="mb-5">
            <img src={logoPng} alt="Chanda's Group" className="h-14 sm:h-20 w-auto object-contain" style={{ filter:'drop-shadow(0 2px 8px rgba(45,148,150,0.25))' }} />
          </div>
          <p className="text-white/40 text-sm leading-relaxed mb-6">Building dreams and crafting legacies since the late 1990s.</p>
          <a href={companyProfilePdf} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-4 py-2.5 mb-6 bg-[#2d9496]/10 border border-[#2d9496]/30 hover:bg-[#2d9496]/20 rounded-xl text-[#4ecdc4] text-xs font-semibold transition-all group">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-y-0.5 transition-transform"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            <span>Download Company Profile</span>
          </a>
          <div className="flex gap-3">
            {[{ href:'https://www.instagram.com/chandas_group?igsh=MXNjdGI5MmQ4M20xYQ%3D%3D&utm_source=qr', icon:Instagram },{ href:'https://www.linkedin.com/company/chanda-s-group/', icon:Linkedin },{ href:'mailto:info@chandasgroup.com', icon:Mail }].map(({ href,icon:Icon },i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 hover:bg-[#2d9496] rounded-lg flex items-center justify-center transition-colors border border-white/5"><Icon size={14} className="text-white/60" /></a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-serif font-bold text-sm text-white mb-5 tracking-wide">Quick Links</h4>
          <ul className="space-y-2.5">
            {[['About','about'],['Values','values'],['Projects','projects'],['Team','team'],['Contact','contact']].map(([l,id]) => (
              <li key={id}><button onClick={() => go(id)} className="text-white/40 hover:text-[#4ecdc4] text-sm transition-colors">{l}</button></li>
            ))}
            <li><button onClick={onOpenPortal} className="text-white/40 hover:text-[#4ecdc4] text-sm transition-colors">Property Portal</button></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif font-bold text-sm text-white mb-5 tracking-wide">Featured Projects</h4>
          <ul className="space-y-2.5">
            {['Infinity Tower','Daffodil Heights','Orchid Apartments','Greenfield Heights','Cubix Arcade'].map(p => (
              <li key={p}><button onClick={() => go('projects')} className="text-white/40 hover:text-[#4ecdc4] text-sm transition-colors text-left">{p}</button></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-serif font-bold text-sm text-white mb-5 tracking-wide">Contact</h4>
          <ul className="space-y-4">
            <li className="flex gap-3"><MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color:'#2d9496' }} /><span className="text-white/40 text-sm leading-relaxed">2nd Floor, Infinity Tower,<br />Koparkhairane, Navi Mumbai</span></li>
            <li className="flex gap-3 items-center"><Phone size={14} className="flex-shrink-0" style={{ color:'#2d9496' }} /><a href="tel:+919820646335" className="text-white/40 hover:text-[#4ecdc4] text-sm transition-colors">+91 98206 46335</a></li>
            <li className="flex gap-3 items-center"><Mail size={14} className="flex-shrink-0" style={{ color:'#2d9496' }} /><a href="mailto:info@chandasgroup.com" className="text-white/40 hover:text-[#4ecdc4] text-sm transition-colors">info@chandasgroup.com</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} Chanda's Group. All rights reserved.</p>
          <p className="text-white/20 text-xs">Dreams Abode — Building a Better Tomorrow</p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────── ROOT APP ───────────────────────────── */
export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [portalOpen, setPortalOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  // Load listings from Supabase (or localStorage fallback)
  useEffect(() => {
    loadListingsFromSupabase().then(data => {
      setListings(data);
      setListingsLoading(false);
    });
  }, []);

  // Support /#admin URL shortcut
  useEffect(() => {
    const check = () => {
      if (window.location.hash === '#admin') {
        setAdminOpen(true);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, []);

  // AdminPanel syncs to Supabase internally; this just updates state
  const handleSave = (updated: Listing[]) => {
    setListings(updated);
  };

  const handleReset = async () => {
    if (!confirm('Reset ALL listings to defaults? This cannot be undone.')) return;
    try {
      await seedListings(DEFAULT_LISTINGS);
      setListings(DEFAULT_LISTINGS);
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  if (listingsLoading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#050e1a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#2d9496] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/40 text-sm font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <Cursor />
      <ScrollBar />
      <Navbar onOpenPortal={() => setPortalOpen(true)} />
      <Hero onOpenPortal={() => setPortalOpen(true)} />
      <Marquee />
      <About />
      <Stats />
      <Values />
      <Projects onOpenPortal={() => setPortalOpen(true)} />
      <Team />
      <Contact />
      <Footer onOpenPortal={() => setPortalOpen(true)} />

      {/* Admin access — subtle key icon, bottom right */}
      <button
        onClick={() => setAdminOpen(true)}
        title="Admin Portal — Press to sign in"
        className="fixed bottom-6 right-6 z-[100] w-10 h-10 rounded-full bg-[#050e1a]/90 border border-white/10 hover:border-[#2d9496]/60 flex items-center justify-center text-white/20 hover:text-[#4ecdc4] transition-all shadow-2xl backdrop-blur-sm"
      >
        <KeyRound size={14} />
      </button>

      <PropertyPortal listings={listings} open={portalOpen} onClose={() => setPortalOpen(false)} />
      {adminOpen && (
        <AdminPanel
          listings={listings}
          onSave={handleSave}
          onClose={() => setAdminOpen(false)}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
