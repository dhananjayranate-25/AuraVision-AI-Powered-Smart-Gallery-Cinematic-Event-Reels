import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Image as ImageIcon, Video, Users, Settings, LayoutDashboard, Download, Share2, X, Trash2, FolderOpen, Smartphone, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import BulkUpload from '../components/BulkUpload';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // Media & Folders
  const [eventMedia, setEventMedia] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("General");
  const folderOptions = ["General", "Haldi", "Sangeet", "Wedding", "Reception", "After Party"];
  
  const mockToken = "mock_token"; 

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`/api/events/`, {
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      setEvents(response.data);
      if (response.data.length > 0 && !activeEvent) {
        setActiveEvent(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchEventMedia = async (eventId) => {
    try {
      const response = await axios.get(`/api/media/event/${eventId}`);
      setEventMedia(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeEvent) {
      fetchEventMedia(activeEvent.id);
    } else {
      setEventMedia([]);
    }
  }, [activeEvent]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventName || !newEventDate) return;
    
    setCreating(true);
    try {
      const response = await axios.post(`/api/events/`, {
        name: newEventName,
        date: new Date(newEventDate).toISOString()
      }, {
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      
      setEvents([...events, { ...response.data, photoCount: 0 }]);
      setActiveEvent(response.data);
      setIsModalOpen(false);
      setNewEventName('');
      setNewEventDate('');
    } catch (error) {
      console.error("Error creating event:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation();
    if (!window.confirm("CRITICAL WARNING: This will permanently delete the event and ALL associated photos. Proceed?")) return;
    
    try {
      await axios.delete(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      setEvents(events.filter(ev => ev.id !== eventId));
      if (activeEvent?.id === eventId) setActiveEvent(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete event.");
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!window.confirm("Delete this photo permanently?")) return;
    try {
      await axios.delete(`/api/media/${photoId}`, {
        headers: { Authorization: `Bearer ${mockToken}` }
      });
      setEventMedia(eventMedia.filter(m => m.id !== photoId));
      fetchEvents(); // Update count
    } catch(err) {
      console.error(err);
    }
  };

  const handleDownloadQR = () => {
    if (!activeEvent) return;
    const baseUrl = window.location.hostname === 'localhost' ? 'http://10.43.235.74:5174' : window.location.origin;
    const eventSlug = activeEvent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(baseUrl + '/event/' + eventSlug + '/' + activeEvent.id)}`;
    
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      
      // Black background
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Gold Border
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      
      // Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(activeEvent.name.toUpperCase(), canvas.width / 2, 80);
      
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText("SCAN TO ACCESS GUEST GALLERY", canvas.width / 2, 115);
      
      // Draw QR Image
      ctx.drawImage(img, 50, 150, 500, 500);
      
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `QR_${activeEvent.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.onerror = () => {
      // Fallback
      const a = document.createElement('a');
      a.href = qrUrl;
      a.download = `QR_${activeEvent.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = qrUrl;
  };

  const handleShareLink = () => {
    if (!activeEvent) return;
    const baseUrl = window.location.hostname === 'localhost' ? 'http://10.43.235.74:5174' : window.location.origin;
    const eventSlug = activeEvent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const link = `${baseUrl}/event/${eventSlug}/${activeEvent.id}`;
    navigator.clipboard.writeText(link);
    alert("Guest Portal link copied to clipboard!");
  };

  const renderContent = () => {
    if (activeTab !== 'events') {
      return (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="h-[600px] flex items-center justify-center bg-[#050505] border border-white/5"
        >
          <div className="text-center">
            <div className="text-zinc-700 text-xs tracking-[0.3em] uppercase mb-2">Module Offline</div>
            <h3 className="text-2xl font-bold text-zinc-500 tracking-tighter uppercase mb-4">{activeTab} Interface</h3>
            <p className="text-zinc-600 text-xs tracking-widest uppercase max-w-sm mx-auto">This module is currently in development and will be deployed in a future system update.</p>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Minimalist Event List */}
        <div className="xl:col-span-4 space-y-4 max-h-[800px] overflow-y-auto pr-2">
          {events.length === 0 && (
             <div className="text-zinc-500 text-xs tracking-widest uppercase p-4 border border-white/10 text-center">No Archives Found</div>
          )}
          {events.map((event, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              key={event.id}
              onClick={() => setActiveEvent(event)}
              className={`p-6 cursor-pointer transition-all duration-500 border group ${
                activeEvent?.id === event.id 
                ? 'border-[#D4AF37] bg-white/5' 
                : 'border-white/10 bg-transparent hover:border-white/30'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-sm tracking-wider uppercase leading-snug pr-4 group-hover:text-[#D4AF37] transition-colors">{event.name}</h4>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => handleDeleteEvent(event.id, e)}
                    className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Event"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {activeEvent?.id === event.id && (
                    <div className="h-2 w-2 bg-[#D4AF37] rounded-full shadow-[0_0_10px_#D4AF37] mt-1 shrink-0"></div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium tracking-widest uppercase">
                <span className="flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" strokeWidth={1.5} /> {event.photoCount || 0}</span>
                <span>&bull;</span>
                <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Active Event Command Terminal */}
        <div className="xl:col-span-8">
          <AnimatePresence mode="wait">
            {activeEvent ? (
              <motion.div 
                key={activeEvent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {/* Header Display */}
                <div className="bg-[#050505] p-4 md:p-8 border border-white/10 flex items-start justify-between relative overflow-hidden flex-col md:flex-row gap-6">
                  {/* Grid background effect */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-[10px] font-bold text-[#D4AF37] tracking-[0.3em] uppercase border border-[#D4AF37]/30 px-2 py-1">Active Sector</span>
                    </div>
                    <h3 className="text-3xl font-bold tracking-tighter uppercase mb-2">{activeEvent.name}</h3>
                    <p className="text-zinc-500 text-xs tracking-widest uppercase">Archive ID: {activeEvent.id}</p>
                  </div>
                  
                  <div className="relative z-10 flex flex-col items-end">
                    <p className="text-[9px] font-bold text-zinc-500 mb-3 tracking-[0.3em] uppercase">Guest Access Node</p>
                    <div className="bg-white p-2 border-2 border-[#D4AF37] inline-block shadow-[0_0_20px_rgba(212,175,55,0.2)] mb-3">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent((window.location.hostname === 'localhost' ? 'http://10.43.235.74:5174' : window.location.origin) + '/event/' + activeEvent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '/' + activeEvent.id)}`} 
                        alt="QR" 
                        className="h-20 w-20 object-contain" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleDownloadQR} className="bg-white/5 border border-white/20 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] p-2 transition-colors flex items-center justify-center text-white" title="Download High-Res QR">
                        <Download className="h-4 w-4" />
                      </button>
                      <button onClick={handleShareLink} className="bg-white/5 border border-white/20 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] p-2 transition-colors flex items-center justify-center text-white" title="Copy Guest Link">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Terminal with Folders */}
                <div className="bg-[#050505] border border-white/10 p-4 md:p-8">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 border-b border-white/10 pb-4 gap-4">
                     <h4 className="text-xs font-bold text-white tracking-[0.2em] uppercase">Data Ingestion Node</h4>
                     <div className="flex items-center gap-3">
                       <FolderOpen className="h-4 w-4 text-[#D4AF37]" />
                       <div className="relative">
                         <input 
                           type="text"
                           list="existing-folders"
                           value={selectedFolder}
                           onChange={(e) => setSelectedFolder(e.target.value)}
                           placeholder="Type folder name..."
                           className="bg-transparent text-white text-xs font-bold tracking-[0.1em] uppercase border border-white/20 p-2 focus:border-[#D4AF37] outline-none w-full md:w-48 placeholder-zinc-700"
                         />
                         <datalist id="existing-folders">
                           {[...new Set(eventMedia.map(m => m.folder_name || 'General'))].map(f => (
                             <option key={f} value={f} />
                           ))}
                         </datalist>
                       </div>
                     </div>
                   </div>
                   
                   <BulkUpload 
                     eventId={activeEvent.id} 
                     token={mockToken} 
                     folderName={selectedFolder} 
                     onUploadSuccess={() => {
                       fetchEvents();
                       fetchEventMedia(activeEvent.id);
                     }}
                   />
                </div>

                {/* Media Library Manager */}
                {eventMedia.length > 0 && (
                  <div className="bg-[#050505] border border-white/10 p-4 md:p-8">
                    <h4 className="text-xs font-bold text-white tracking-[0.2em] uppercase mb-6 border-b border-white/10 pb-4">Media Library Control</h4>
                    
                    {/* Render photos grouped by folder */}
                    {[...new Set(eventMedia.map(m => m.folder_name || 'General'))].map(folder => {
                      const folderPhotos = eventMedia.filter(m => (m.folder_name || 'General') === folder);
                      if (folderPhotos.length === 0) return null;
                      
                      return (
                        <div key={folder} className="mb-8 last:mb-0">
                          <h5 className="text-[10px] font-bold text-[#D4AF37] tracking-[0.2em] uppercase mb-4">{folder} ({folderPhotos.length})</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {folderPhotos.map(photo => (
                              <div 
                                key={photo.id} 
                                className="relative group aspect-square bg-zinc-900 border border-white/5 cursor-pointer overflow-hidden"
                                onClick={() => setSelectedPhoto(photo)}
                              >
                                <img 
                                  src={photo.s3_url?.startsWith('http') ? photo.s3_url : photo.s3_url}
                                  alt="Media" 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                                  className="absolute top-2 right-2 bg-black/80 text-white p-1.5 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Delete Photo"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-[500px] flex items-center justify-center bg-[#050505] border border-white/5"
              >
                <div className="text-center">
                  <div className="text-zinc-700 text-xs tracking-[0.3em] uppercase mb-2">Standby Mode</div>
                  <h3 className="text-xl font-bold text-zinc-500 tracking-tighter uppercase">Select an event to initialize</h3>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#000000] flex flex-col md:flex-row font-sans text-white overflow-hidden">
      
      {/* Brutalist Sidebar */}
      <div className="w-full md:w-[280px] bg-[#050505] border-b md:border-b-0 md:border-r border-white/10 p-4 md:p-6 flex flex-col z-10 shrink-0 relative max-h-[40vh] md:max-h-screen overflow-y-auto">

        <button onClick={() => navigate('/')} className="flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase text-zinc-500 hover:text-white transition-colors mb-6 md:mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <nav className="flex-1 space-y-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Operations</p>
          <button onClick={() => setActiveTab('events')} className={`w-full flex items-center gap-4 px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-colors ${activeTab === 'events' ? 'bg-white/5 text-[#D4AF37] border border-white/5' : 'text-zinc-500 hover:text-white'}`}>
            <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} /> Events
          </button>
          <button onClick={() => setActiveTab('directory')} className={`w-full flex items-center gap-4 px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-colors ${activeTab === 'directory' ? 'bg-white/5 text-[#D4AF37] border border-white/5' : 'text-zinc-500 hover:text-white'}`}>
            <Users className="h-4 w-4" strokeWidth={1.5} /> Directory
          </button>
          <button onClick={() => setActiveTab('models')} className={`w-full flex items-center gap-4 px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-colors ${activeTab === 'models' ? 'bg-white/5 text-[#D4AF37] border border-white/5' : 'text-zinc-500 hover:text-white'}`}>
            <Video className="h-4 w-4" strokeWidth={1.5} /> AI Models
          </button>
          
          <div className="pt-10 mb-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">System</p>
          </div>
          <button onClick={() => activeEvent && navigate(`/event/${activeEvent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/${activeEvent.id}`)} className="w-full flex items-center gap-4 px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-colors text-zinc-500 hover:text-white">
            <Smartphone className="h-4 w-4" strokeWidth={1.5} /> Guest Demo
          </button>
          <button onClick={() => setActiveTab('configuration')} className={`w-full flex items-center gap-4 px-4 py-3 font-semibold text-xs tracking-wider uppercase transition-colors ${activeTab === 'configuration' ? 'bg-white/5 text-[#D4AF37] border border-white/5' : 'text-zinc-500 hover:text-white'}`}>
            <Settings className="h-4 w-4" strokeWidth={1.5} /> Configuration
          </button>
        </nav>

        {/* Minimal Storage Meter */}
        <div className="mt-auto border-t border-white/10 pt-6">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-xs tracking-widest uppercase text-zinc-400">Database</h4>
            <span className="text-[9px] font-bold bg-[#D4AF37] text-black px-1.5 py-0.5 tracking-wider uppercase">Pro</span>
          </div>
          <div className="w-full bg-white/10 h-1 mb-2">
            <div className="bg-[#D4AF37] h-full w-[28%]"></div>
          </div>
          <p className="text-zinc-500 text-[10px] tracking-widest uppercase">14.2 GB / 50 GB</p>
        </div>
      </div>

      {/* Main Command Workspace */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] relative">
        <div className="max-w-[1600px] mx-auto p-4 md:p-12 min-h-full flex flex-col relative z-10">

          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 border-b border-white/10 pb-6 gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter uppercase mb-2">
                {activeTab === 'events' ? 'Event Matrices' : `${activeTab} Interface`}
              </h2>
              <p className="text-zinc-500 text-sm tracking-widest uppercase">
                {activeTab === 'events' ? 'Select an archive to manage media assets.' : 'System functionality restricted.'}
              </p>
            </div>
            
            {activeTab === 'events' && (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-black px-6 py-3 flex items-center gap-3 hover:bg-[#D4AF37] transition-colors font-bold text-xs tracking-[0.2em] uppercase shrink-0"
              >
                <Plus className="h-4 w-4" strokeWidth={2} /> Initialize Event
              </motion.button>
            )}
          </header>

          {renderContent()}

        </div>
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-[#050505] border border-white/20 p-8 w-full max-w-md relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              
              <h3 className="text-xl font-bold tracking-[0.2em] uppercase mb-8 border-b border-white/10 pb-4">Initialize New Event</h3>
              
              <form onSubmit={handleCreateEvent} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Event Designation</label>
                  <input 
                    type="text" 
                    required
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 p-2 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                    placeholder="e.g. Protocol Alpha Wedding"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-2">Temporal Coordinates (Date)</label>
                  <input 
                    type="date" 
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-transparent border-b border-white/20 p-2 text-white focus:outline-none focus:border-[#D4AF37] transition-colors [color-scheme:dark]"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="w-full bg-white text-black py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[#D4AF37] transition-colors mt-4 disabled:opacity-50"
                >
                  {creating ? 'Processing...' : 'Execute Creation'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedPhoto(null)}
          >
            <button className="absolute top-6 right-6 text-white hover:text-[#D4AF37]"><X className="w-8 h-8" /></button>
            <img 
              src={selectedPhoto.s3_url?.startsWith('http') ? selectedPhoto.s3_url : selectedPhoto.s3_url} 
              className="max-w-full max-h-[90vh] object-contain shadow-[0_0_50px_rgba(212,175,55,0.1)]" 
              alt="Enlarged Media"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
