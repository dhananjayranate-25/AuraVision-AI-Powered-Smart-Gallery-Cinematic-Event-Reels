import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ScanFace, ArrowRight, UploadCloud, QrCode, Wand2, Search, Film, ShieldCheck, Download, Share2 } from 'lucide-react';

const LandingPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, 200]);

  useEffect(() => {
    const updateMousePosition = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] font-sans selection:bg-[#D4AF37] selection:text-black overflow-hidden relative">
      
      {/* Custom Magic Cursor (Follows Mouse) */}
      <motion.div 
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-[#D4AF37]/50 pointer-events-none z-[100] mix-blend-screen flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        animate={{ x: mousePosition.x - 16, y: mousePosition.y - 16 }}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      >
        <div className="w-1 h-1 bg-[#D4AF37] rounded-full"></div>
      </motion.div>

      {/* Cinematic Background Noise & Lighting */}
      <div className="fixed inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-transparent blur-[150px] pointer-events-none"></div>

      {/* Luxury Navbar */}
      <nav className="fixed w-full z-50 mix-blend-difference">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl font-bold tracking-widest uppercase text-[#D4AF37]">Smart<span className="font-light">Gallery</span></span>
          </div>
          <div className="flex items-center gap-2 md:gap-8">
            <a href="#how-it-works" className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-white hover:text-[#D4AF37] transition-colors hidden md:block">How it Works</a>
            <a href="#features" className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-white hover:text-[#D4AF37] transition-colors hidden md:block">Features</a>
            <Link to="/admin" className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-black bg-[#D4AF37] px-3 py-2 md:px-6 md:py-3 rounded-none hover:bg-white hover:text-black transition-all font-bold">
              Admin
            </Link>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/events/');
                  const events = await res.json();
                  if (events && events.length > 0) {
                    window.location.href = `/event/${events[0].name.toLowerCase()}/${events[0].id}`;
                  } else {
                    window.location.href = "/event/1";
                  }
                } catch(e) {
                  window.location.href = "/event/1";
                }
              }}
              className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-black bg-white px-3 py-2 md:px-6 md:py-3 rounded-none hover:bg-[#D4AF37] hover:text-black transition-all">
              Guest Demo
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section: "The AI Lens" */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 overflow-hidden">
        
        {/* Floating Abstract Photos */}
        <motion.div style={{ y: y1 }} className="absolute left-[5%] top-[20%] w-48 h-64 border border-white/10 p-2 bg-black/50 backdrop-blur-md rotate-[-10deg] hidden lg:block opacity-60">
          <div className="w-full h-full bg-zinc-900 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=400" className="w-full h-full object-cover grayscale opacity-50" />
          </div>
        </motion.div>
        
        <motion.div style={{ y: y2 }} className="absolute right-[5%] top-[40%] w-56 h-72 border border-white/10 p-2 bg-black/50 backdrop-blur-md rotate-[15deg] hidden lg:block opacity-60 z-20">
          <div className="w-full h-full bg-zinc-900 overflow-hidden">
            <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=400" className="w-full h-full object-cover grayscale opacity-50" />
          </div>
        </motion.div>

        <div className="max-w-5xl mx-auto text-center relative z-10 mt-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-[#D4AF37]/30 bg-black/50 backdrop-blur-xl text-[#D4AF37] text-xs font-semibold tracking-[0.2em] uppercase mb-12 shadow-[0_0_30px_rgba(212,175,55,0.15)]">
              <ScanFace className="h-4 w-4" /> Generative AI Powered Event System
            </div>
            
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 leading-[0.9]" style={{ color: "white" }}>
              RELIVE<br/>THE MAGIC.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-16 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
              Upload a selfie. Our AI scans thousands of event photos instantly to curate a flawless, private cinematic gallery of your best moments.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-20">
              {/* Main Call to Action */}
              <button 
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="group flex items-center gap-4 text-zinc-400 font-black text-xl md:text-2xl tracking-[0.2em] uppercase hover:text-white transition-all duration-300"
              >
                <span>Discover How</span> <ArrowRight className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* AI Scanner Line Effect */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_20px_rgba(212,175,55,0.8)] opacity-50 animate-[scan_4s_ease-in-out_infinite]"></div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10 bg-black">
        <div className="text-left mb-24 max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-white uppercase">How It <br/><span className="text-[#D4AF37]">Works</span></h2>
          <p className="text-zinc-500 text-lg font-light tracking-wide leading-relaxed">A seamless, fully automated pipeline designed for photographers and event organizers. Three simple steps to deliver a personalized experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 relative">
          {/* Decorative connecting line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-white/10 -translate-y-1/2"></div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="p-6 md:p-12 border-b md:border-b-0 md:border-r border-white/10 bg-[#050505] relative z-10 hover:bg-[#0A0A0A] transition-colors">
            <UploadCloud className="h-10 w-10 text-[#D4AF37] mb-8" strokeWidth={1} />
            <div className="text-[#D4AF37] font-bold text-sm tracking-widest mb-2 uppercase">Step 01</div>
            <h3 className="text-2xl font-bold mb-4 tracking-tight uppercase text-white">Bulk Upload</h3>
            <p className="text-zinc-500 font-light text-sm leading-loose">
              Photographers upload thousands of raw event photos (weddings, concerts, parties) directly to the secure Admin Dashboard in one click.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="p-6 md:p-12 border-b md:border-b-0 md:border-r border-white/10 bg-[#050505] relative z-10 hover:bg-[#0A0A0A] transition-colors">
            <QrCode className="h-10 w-10 text-[#D4AF37] mb-8" strokeWidth={1} />
            <div className="text-[#D4AF37] font-bold text-sm tracking-widest mb-2 uppercase">Step 02</div>
            <h3 className="text-2xl font-bold mb-4 tracking-tight uppercase text-white">Guest QR Scan</h3>
            <p className="text-zinc-500 font-light text-sm leading-loose">
              Guests scan a dynamic QR code placed at the event. They access a web-based Guest Portal (no app required) and take a quick selfie.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }} viewport={{ once: true }} className="p-6 md:p-12 bg-[#050505] relative z-10 hover:bg-[#0A0A0A] transition-colors">
            <Wand2 className="h-10 w-10 text-[#D4AF37] mb-8" strokeWidth={1} />
            <div className="text-[#D4AF37] font-bold text-sm tracking-widest mb-2 uppercase">Step 03</div>
            <h3 className="text-2xl font-bold mb-4 tracking-tight uppercase text-white">Instant AI Magic</h3>
            <p className="text-zinc-500 font-light text-sm leading-loose">
              The AI engine instantly cross-references the selfie with the entire event database, unlocking a beautiful, private photo gallery exclusively for that guest.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Project Details / Features Section */}
      <section id="features" className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-left mb-24 max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 uppercase" style={{ color: "#D4AF37" }}>Project <br/><span>Intelligence</span></h2>
          <p className="text-zinc-500 text-lg font-light tracking-wide leading-relaxed">Built with cutting-edge Deep Learning models to provide an unmatched media retrieval experience.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex gap-6">
            <div className="shrink-0 mt-1">
              <ScanFace className="h-8 w-8 text-[#D4AF37]" strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-widest uppercase mb-3 text-white">Facial Recognition (InsightFace)</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-light">
                Utilizes state-of-the-art ArcFace models to generate highly accurate facial embeddings. It can detect multiple faces in complex crowds and lighting conditions, matching guests to their photos with near-perfect precision.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }} className="flex gap-6">
            <div className="shrink-0 mt-1">
              <Search className="h-8 w-8 text-[#D4AF37]" strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-widest uppercase mb-3 text-white">Semantic Search (CLIP)</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-light">
                Powered by OpenAI's CLIP model, the system understands the actual context of images. Guests can type natural language queries like "Dancing on the stage" or "Wearing a red dress" to find specific moments instantly.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }} className="flex gap-6">
            <div className="shrink-0 mt-1">
              <Film className="h-8 w-8 text-[#D4AF37]" strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-widest uppercase mb-3 text-white">Cinematic Auto-Reels</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-light">
                An integrated audio-visual engine that automatically compiles a guest's matched photos into a stunning, beat-synced video reel, complete with transitions and cinematic filters, ready for social media.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} viewport={{ once: true }} className="flex gap-6">
            <div className="shrink-0 mt-1">
              <ShieldCheck className="h-8 w-8 text-[#D4AF37]" strokeWidth={1} />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-widest uppercase mb-3 text-white">Total Privacy & Security</h3>
              <p className="text-zinc-500 text-sm leading-relaxed font-light">
                Ensures that guests only ever see photos they are physically present in. This eliminates unauthorized downloads and protects the privacy of high-profile event attendees.
              </p>
            </div>
          </motion.div>
        </div>
      </section>



      <footer className="relative z-10 py-10 border-t border-white/10 text-center text-zinc-600 text-[10px] tracking-widest uppercase">
        <p>&copy; 2026 SmartGallery AI. Built for the future of events.</p>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100vh); }
          50% { transform: translateY(100vh); }
          100% { transform: translateY(-100vh); }
        }
      `}} />
    </div>
  );
};

export default LandingPage;
