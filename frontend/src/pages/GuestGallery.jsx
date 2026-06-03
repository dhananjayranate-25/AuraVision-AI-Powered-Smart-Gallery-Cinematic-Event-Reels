import React, { useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, X, Film, Search, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const GuestGallery = () => {
  const location = useLocation();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState(location.state?.matchedPhotos || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeFolder, setActiveFolder] = useState('All');
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Derive unique folders from the photos
  const availableFolders = ["All", ...new Set(photos.map(p => p.folder_name || "General"))];
  const displayPhotos = activeFolder === "All" ? photos : photos.filter(p => (p.folder_name || "General") === activeFolder);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await axios.get(`/api/guest/semantic-search/${eventId}?query=${encodeURIComponent(searchQuery)}`);
      setPhotos(response.data.media);
      setActiveFolder('All');
      setSearching(false);
    } catch (err) {
      console.error(err);    } finally {
      setSearching(false);
    }
  };

  const handleDownloadAll = async () => {
    if (displayPhotos.length === 0) return;
    setDownloadingZip(true);
    setDownloadProgress(0);
    
    try {
      const zip = new JSZip();
      
      for (let i = 0; i < displayPhotos.length; i++) {
        const photo = displayPhotos[i];
        try {
          const response = await fetch(photo.s3_url);
          const blob = await response.blob();
          const filename = photo.s3_url.split('/').pop() || `photo_${i}.jpg`;
          zip.file(filename, blob);
        } catch(e) {
          console.error("Failed to fetch", photo.s3_url);
        }
        setDownloadProgress(Math.round(((i + 1) / displayPhotos.length) * 100));
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${activeFolder === "All" ? "Event_Gallery" : activeFolder}_Photos.zip`);
    } catch (e) {
      console.error("Zip generation error:", e);
      alert("Failed to create zip file.");
    } finally {
      setDownloadingZip(false);
      setDownloadProgress(0);
    }
  };

  const handleOpenStudio = () => {
    navigate(`/cinematic/Event/${eventId}`, { state: { matchedPhotos: displayPhotos } });
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans pb-20 selection:bg-[#D4AF37] selection:text-black">
      
      {/* Luxury Minimal Header */}
      <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-2xl border-b border-white/10">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:h-20 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-4">
              <h1 className="text-xs md:text-lg font-bold text-white tracking-[0.2em] uppercase" style={{ color: 'white' }}>
                Curated Exhibition
              </h1>
            </div>
            
            <div className="flex flex-col md:flex-row items-center w-full md:w-auto gap-3">
              {displayPhotos.length > 0 && (
                <button 
                  onClick={handleDownloadAll}
                  disabled={downloadingZip}
                  className="flex items-center justify-center w-full md:w-auto gap-3 px-6 py-2.5 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase transition-all border border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>{downloadingZip ? `Downloading ${downloadProgress}%` : 'Download All Photos'}</span>
                </button>
              )}
              
              <button 
                onClick={handleOpenStudio}
                className="flex items-center justify-center w-full md:w-auto gap-3 px-6 py-2.5 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase transition-all border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
              >
                <Film className="h-4 w-4" />
                <span>Open Cinematic Studio</span>
              </button>
            </div>
          </div>
      </header>

      {/* High-End Search & Folders */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center mb-8">
        <h2 className="text-3xl font-light text-white mb-8 tracking-[0.2em] uppercase">
          Explore Your Memories
        </h2>
        


        {/* Dynamic Folders Bar */}
        {availableFolders.length > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {availableFolders.map(folder => (
              <button
                key={folder}
                onClick={() => setActiveFolder(folder)}
                className={`flex items-center gap-2 px-6 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-300 border ${
                  activeFolder === folder 
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' 
                  : 'border-white/10 text-zinc-500 hover:text-white hover:border-white/30'
                }`}
              >
                {folder !== 'All' && <Folder className="h-3.5 w-3.5" />}
                {folder}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Art Gallery Layout (Wide Masonry) */}
      <main className="max-w-[1600px] mx-auto px-6">
        {displayPhotos.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border border-white/5">
            <h3 className="text-sm font-bold text-zinc-600 tracking-[0.3em] uppercase mb-2">0 Results Found in this Folder</h3>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:block md:columns-2 lg:columns-3 gap-6 md:gap-12 md:space-y-12">
            <AnimatePresence>
              {displayPhotos.map((photo, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: (index % 10) * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  key={photo.id} 
                  className="group relative break-inside-avoid"
                >
                  <div className="relative p-3 bg-white shadow-2xl transition-transform duration-700 hover:scale-[1.02]">
                    <img 
                      src={photo.s3_url?.startsWith('http') ? photo.s3_url : photo.s3_url} 
                      alt={photo.captions || "Event memory"} 
                      className="w-full h-auto object-cover transition-all duration-1000"
                    />
                    {/* Caption area like a polaroid/art print */}
                    <div className="pt-4 pb-2 px-2 flex justify-between items-end">
                      <div>
                        <p className="text-black font-medium text-xs tracking-wide uppercase truncate max-w-[200px]">
                          {photo.captions}
                        </p>
                        {photo.folder_name && photo.folder_name !== 'General' && activeFolder === 'All' && (
                          <p className="text-zinc-500 text-[9px] font-bold tracking-widest uppercase mt-1">
                            {photo.folder_name}
                          </p>
                        )}
                      </div>
                      <a 
                        href={photo.s3_url?.startsWith('http') ? photo.s3_url : photo.s3_url} 
                        download={`event_photo_${photo.id}.jpg`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-black transition-colors"
                        title="Download Original Quality"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default GuestGallery;
