import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Film, CheckCircle2, Music, Download, Loader2, ArrowLeft, Search } from 'lucide-react';

const CinematicStudio = () => {
  const { eventId, eventName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [photos, setPhotos] = useState((location.state?.matchedPhotos || []).filter(p => !p.s3_url?.match(/\.(mp4|mov|webm)$/i)));
  const [selectedIds, setSelectedIds] = useState(() => {
    const initial = location.state?.matchedPhotos || [];
    const photoOnly = initial.filter(p => !p.s3_url?.match(/\.(mp4|mov|webm)$/i));
    return new Set(photoOnly.map(p => p.id));
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reelUrl, setReelUrl] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedYoutubeId, setSelectedYoutubeId] = useState(null);
  const [selectedSongName, setSelectedSongName] = useState(null);
  const [isFetchingStream, setIsFetchingStream] = useState(false);

  const [reelDuration, setReelDuration] = useState(15);
  const [audioStartTime, setAudioStartTime] = useState(0);

  const audioRef = useRef(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [quality, setQuality] = useState('720p');
  const [style, setStyle] = useState('beat_sync');
  const [progress, setProgress] = useState(0);
  const [audioSourceUrl, setAudioSourceUrl] = useState(null);

  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioSourceUrl(url);
      setAudioStartTime(0);
      return () => URL.revokeObjectURL(url);
    } else if (!selectedYoutubeId) {
      setAudioSourceUrl(null);
    }
  }, [audioFile, selectedYoutubeId]);

  // If no photos were passed, we could optionally redirect back or show an empty state.
  useEffect(() => {
    if (photos.length === 0) {
      alert("No photos available for reel generation.");
      navigate(-1);
    }
  }, [photos, navigate]);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleAudioChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
      setSelectedYoutubeId(null);
      setSelectedSongName(null);
    }
  };

  const handleSearchSong = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await axios.get(`/api/reels/search_music?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.results);
    } catch (err) {
      console.error("Error searching song", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSong = async (song) => {
    setSelectedYoutubeId(song.videoId);
    setSelectedSongName(`${song.title} - ${song.artist}`);
    setAudioFile(null);
    setAudioSourceUrl(null);
    setIsFetchingStream(true);
    setAudioStartTime(0);
    
    // Auto scroll down to the settings section
    setTimeout(() => {
      document.getElementById('audio-trim-settings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    try {
      const res = await axios.get(`/api/reels/stream_music/${song.videoId}`);
      setAudioSourceUrl(res.data.url);
      if (res.data.duration) setAudioDuration(res.data.duration);
    } catch (err) {
      console.error("Error fetching stream", err);
      alert("Could not load full song stream.");
    } finally {
      setIsFetchingStream(false);
    }
  };

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return alert("Please select at least one photo.");
    if (!audioFile && !selectedYoutubeId) return alert("Please upload or select a song.");

    setGenerating(true);
    setProgress(0);
    
    // Simulate fast initial upload progress, real encoding progress will come from polling
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 10) return prev + 1;
        clearInterval(progressInterval);
        return prev;
      });
    }, 100);

    const formData = new FormData();
    formData.append('media_ids', Array.from(selectedIds).join(','));
    if (audioFile) formData.append('audio', audioFile);
    if (selectedYoutubeId) formData.append('youtube_id', selectedYoutubeId);
    formData.append('audio_start_time', audioStartTime);
    formData.append('reel_duration', reelDuration);
    formData.append('quality', quality);
    formData.append('style', style);

    try {
      const response = await axios.post('/api/reels/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const taskId = response.data.task_id;
      
      // Poll for progress
      const pollInterval = setInterval(async () => {
        try {
          const progRes = await axios.get(`/api/reels/progress/${taskId}`);
          const statusData = progRes.data;
          
          if (statusData.status === 'processing') {
            setProgress(statusData.progress || 0);
          } else if (statusData.status === 'completed') {
            clearInterval(pollInterval);
            setProgress(100);
            setTimeout(() => {
              setReelUrl(statusData.reel_url);
              setGenerating(false);
            }, 600);
          } else if (statusData.status === 'error') {
            clearInterval(pollInterval);
            alert("Error: " + statusData.error);
            setProgress(0);
            setGenerating(false);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 500);

    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || "Failed to start generation.";
      alert(errorMsg);
      setProgress(0);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
        <p className="text-xs tracking-widest uppercase text-zinc-500">Loading Studio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden pb-32">
      {/* Header */}
      <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] tracking-widest uppercase">Back</span>
        </button>
        <div className="text-[#D4AF37] font-bold tracking-[0.3em] uppercase text-xs flex items-center gap-2">
          <Film className="w-4 h-4" />
          Cinematic Studio
        </div>
      </nav>

      <div className="pt-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col items-center justify-center text-center w-full">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase mb-4 text-center w-full">
            Create Your <br/> <span className="text-[#D4AF37]">Cinematic Reel</span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-5xl mx-auto mb-8 text-center w-full">
            Select your favorite photos, add a song, and our AI will automatically generate a beat-synced cinematic video for you.
          </p>
        </div>

        {!reelUrl && (
          <div className="mb-12 p-6 bg-white/5 border border-white/10 rounded-xl">
            <h2 className="text-lg font-bold tracking-widest uppercase mb-6 text-white" style={{ color: "white" }}>1. Choose Soundtrack</h2>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Search API */}
              <div className="flex-1">
                <form onSubmit={handleSearchSong} className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Search any song or artist..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-black border border-white/20 px-4 py-3 text-sm focus:border-[#D4AF37] outline-none tracking-wider placeholder-zinc-600"
                  />
                  <button type="submit" disabled={isSearching} className="bg-[#D4AF37] text-black px-6 py-3 font-bold hover:bg-white transition-colors">
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                </form>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {searchResults.map(song => (
                    <div 
                      key={song.videoId} 
                      onClick={() => selectSong(song)} 
                      className={`flex items-center gap-4 p-3 cursor-pointer transition-all ${selectedYoutubeId === song.videoId ? 'bg-[#D4AF37]/20 border border-[#D4AF37]' : 'bg-black/50 hover:bg-white/5 border border-transparent'}`}
                    >
                      <img src={song.thumbnail || "https://via.placeholder.com/100"} alt="art" className="w-12 h-12 object-cover rounded-sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-white">{song.title}</p>
                        <p className="text-xs text-zinc-400 truncate tracking-wider">{song.artist}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {selectedYoutubeId === song.videoId && (
                          isFetchingStream ? <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin shrink-0" /> 
                          : <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                  {searchResults.length === 0 && !isSearching && (
                    <p className="text-xs text-zinc-500 tracking-widest uppercase py-4">Search results will appear here</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-center font-bold text-zinc-600 uppercase text-[10px] tracking-widest md:flex-col">
                <span className="md:h-12 w-12 md:w-[1px] bg-white/10 block"></span>
                <span className="py-2 px-2">OR</span>
                <span className="md:h-12 w-12 md:w-[1px] bg-white/10 block"></span>
              </div>
              
              {/* Manual Upload */}
              <div className="flex-1 flex flex-col justify-center">
                <input 
                  type="file" 
                  id="audio-upload-main" 
                  accept="audio/mp3,audio/wav,audio/*" 
                  className="hidden" 
                  onChange={handleAudioChange}
                />
                <label 
                  htmlFor="audio-upload-main"
                  className={`flex flex-col items-center justify-center gap-4 h-full min-h-[160px] p-8 border-2 border-dashed transition-all cursor-pointer ${audioFile ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}
                >
                  <Music className={`w-8 h-8 ${audioFile ? 'text-[#D4AF37]' : 'text-zinc-500'}`} />
                  <div className="text-xs tracking-widest uppercase text-center text-zinc-300">
                    {audioFile ? audioFile.name : 'Upload Your Own MP3/WAV'}
                  </div>
                </label>
              </div>
            </div>

            {(audioFile || selectedYoutubeId) && (
              <div id="audio-trim-settings" className="mt-8 pt-8 border-t border-white/10">
                <h3 className="text-sm font-bold tracking-widest uppercase mb-4 text-zinc-300">Audio Trim Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">
                      Reel Duration: <span className="text-[#D4AF37] font-bold">{reelDuration.toFixed(1)} sec</span>
                    </label>
                    <input 
                      type="range" 
                      min="5" 
                      max="60" 
                      step="1"
                      value={reelDuration}
                      onChange={(e) => setReelDuration(Number(e.target.value))}
                      className="w-full accent-[#D4AF37] h-1 bg-white/20 rounded-lg appearance-none cursor-pointer mb-6"
                    />
                    
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2 mt-4">
                      Video Style: <span className="text-white font-bold">{style === 'basic' ? 'Basic Cinematic' : 'Best Cinematic'}</span>
                    </label>
                    <select 
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full bg-black border border-white/20 px-4 py-2 text-sm text-white focus:border-[#D4AF37] outline-none mb-6"
                    >
                      <option value="beat_sync">Best Cinematic (Fast & Beat Sync)</option>
                      <option value="basic">Basic Cinematic (Smooth & Professional)</option>
                    </select>

                    <label className="block text-xs uppercase tracking-widest text-zinc-400 mb-2">
                      Video Quality: <span className="text-white font-bold">{quality}</span>
                    </label>
                    <select 
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full bg-black border border-white/20 px-4 py-2 text-sm text-white focus:border-[#D4AF37] outline-none"
                    >
                      <option value="480p">480p (Fastest)</option>
                      <option value="720p">720p (High Quality)</option>
                      <option value="1080p">1080p (Ultra Quality - Slow)</option>
                    </select>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    {(isFetchingStream || audioSourceUrl) && (
                      <div className="bg-black/50 p-4 border border-white/10 rounded-xl mb-4">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4 text-center">1. Play song and mark your exact section</p>
                        
                        {isFetchingStream ? (
                          <div className="w-full mb-6 h-10 flex items-center justify-center border border-white/5 bg-white/5 rounded-full">
                            <div className="flex gap-2 items-center">
                              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{animationDelay: "0ms"}}></div>
                              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{animationDelay: "150ms"}}></div>
                              <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-bounce" style={{animationDelay: "300ms"}}></div>
                              <span className="text-xs ml-2 text-[#D4AF37] font-bold tracking-widest uppercase">Loading High-Quality Audio...</span>
                            </div>
                          </div>
                        ) : (
                          <audio 
                            ref={audioRef}
                            src={audioSourceUrl}
                            controls
                            controlsList="nodownload"
                            onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                            className="w-full mb-6 outline-none h-10"
                          />
                        )}

                        <div className={`transition-opacity duration-500 ${isFetchingStream ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              if (audioRef.current) {
                                setAudioStartTime(audioRef.current.currentTime);
                              }
                            }}
                            className="flex-1 py-3 bg-white/5 hover:bg-[#D4AF37] hover:text-black text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-md border border-[#D4AF37]/50 hover:border-[#D4AF37]"
                          >
                            Mark Start
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (audioRef.current) {
                                const end = audioRef.current.currentTime;
                                if (end > audioStartTime) {
                                  setReelDuration(end - audioStartTime);
                                } else {
                                  alert("End time must be after the Start time!");
                                }
                              }
                            }}
                            className="flex-1 py-3 bg-white/5 hover:bg-[#D4AF37] hover:text-black text-white text-[10px] font-bold uppercase tracking-widest transition-all rounded-md border border-[#D4AF37]/50 hover:border-[#D4AF37]"
                          >
                            Mark End
                          </button>
                        </div>
                        <div className="mt-6 flex justify-between text-xs font-mono text-[#D4AF37] bg-black/40 p-3 rounded-md border border-white/5">
                          <div className="text-center"><div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Start</div>{formatTime(audioStartTime)}</div>
                          <div className="text-center"><div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">Duration</div>{reelDuration.toFixed(1)}s</div>
                          <div className="text-center"><div className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1">End</div>{formatTime(audioStartTime + reelDuration)}</div>
                        </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!reelUrl && (
          <h2 className="text-lg font-bold tracking-widest uppercase mb-6 text-[#D4AF37]">2. Select Photos</h2>
        )}

        {reelUrl ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center max-w-md mx-auto"
          >
            <div className="relative w-full aspect-[9/16] bg-black border border-white/10 shadow-[0_0_50px_rgba(212,175,55,0.1)] rounded-lg overflow-hidden mb-8">
              <video 
                src={reelUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-cover"
              />
            </div>
            <a 
              href={reelUrl}
              download="Cinematic_Reel.mp4"
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#D4AF37] text-black font-bold tracking-widest uppercase text-xs hover:bg-white transition-all"
            >
              <Download className="w-4 h-4" />
              Download Reel
            </a>
            <button 
              onClick={() => setReelUrl(null)}
              className="mt-4 text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors"
            >
              Create Another
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {photos.map((photo) => {
                const isSelected = selectedIds.has(photo.id);
                const mediaUrl = photo.s3_url?.startsWith('http') ? photo.s3_url : (photo.s3_url?.startsWith('/') ? photo.s3_url : `/${photo.s3_url}`);
                return (
                  <motion.div 
                    key={photo.id}
                    whileHover={{ scale: 0.98 }}
                    onClick={() => toggleSelection(photo.id)}
                    className={`relative aspect-square cursor-pointer overflow-hidden rounded-sm transition-all duration-300 ${isSelected ? 'ring-2 ring-[#D4AF37] scale-95 opacity-100' : 'opacity-60 hover:opacity-100'}`}
                  >
                    <img src={mediaUrl} alt="Event" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-[#D4AF37] text-black rounded-full p-1 shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {photos.length === 0 && (
              <div className="text-center text-zinc-500 py-20 uppercase tracking-widest text-xs">
                No photos available for this event yet.
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {!reelUrl && selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 w-full bg-zinc-900/90 backdrop-blur-lg border-t border-white/10 p-4 md:p-6 z-50"
          >
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-white text-sm tracking-widest uppercase font-bold">
                <span className="text-[#D4AF37] text-xl">{selectedIds.size}</span> Photos Selected
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto"><div className="relative w-full md:w-64 flex items-center justify-center md:justify-end min-w-0"><div className="text-[10px] tracking-widest uppercase truncate text-zinc-400 text-center md:text-right w-full md:pr-4 md:border-r border-white/10">
                    {audioFile ? audioFile.name : (selectedSongName ? selectedSongName : 'No Song Selected')}
                  </div>
                </div>
                
                <button 
                  onClick={handleGenerate}
                  disabled={generating || (!audioFile && !selectedYoutubeId)}
                  className={`w-full md:w-64 py-3 flex flex-col items-center justify-center gap-1 text-[10px] tracking-[0.2em] uppercase font-bold transition-all relative overflow-hidden ${
                    generating || (!audioFile && !selectedYoutubeId)
                    ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-white/5' 
                    : 'bg-[#D4AF37] text-black hover:bg-white'
                  }`}
                >
                  {generating ? (
                    <>
                      <div 
                        className="absolute top-0 left-0 h-full bg-[#D4AF37]/20 transition-all duration-300 ease-linear" 
                        style={{ width: `${progress}%` }} 
                      />
                      <div className="flex items-center gap-2 relative z-10">
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                        <span className="text-[#D4AF37]">Processing {Math.round(progress)}%</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 relative z-10">
                      <Film className="w-4 h-4" />
                      Generate Reel
                    </div>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CinematicStudio;


