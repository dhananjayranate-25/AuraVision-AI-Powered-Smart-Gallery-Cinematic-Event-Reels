import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, ScanFace, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const GuestPortal = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      stopCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setFile(null);
      setError('');
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], "webcam_capture.jpg", { type: "image/jpeg" });
          setFile(newFile);
          stopCamera();
        }
      }, 'image/jpeg');
    }
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('selfie', file);

      // Call the real Python backend AI API
      const response = await axios.post(`/api/guest/match-face/${eventId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      // Navigate to gallery and pass the matched photos array from the backend
      navigate(`/gallery/${eventId}`, { state: { matchedPhotos: response.data.media } });
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Neural scan failed. Please upload a clearer portrait.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/admin')} 
        className="absolute top-6 left-6 z-50 hidden md:flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-zinc-500 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Cinematic Lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#D4AF37]/5 blur-[150px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-4">
          <div className="text-sm md:text-lg tracking-[0.1em] md:tracking-[0.2em] uppercase mb-2 font-bold max-w-xs mx-auto md:max-w-none text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 drop-shadow-sm">
            SmartEvent: AI Gallery & Cinematic Reel Generator
          </div>
          <h2 className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-[#D4AF37] mb-2">Identity Verification</h2>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-white uppercase mb-4">Initialize Scan</h1>
          
          {/* Simple Process Instructions */}
          <div className="flex justify-center gap-2 md:gap-4 text-left max-w-sm mx-auto mb-4 md:mb-6">
            <div className="flex-1 bg-white/5 border border-white/10 p-3 rounded-sm">
              <div className="text-[#D4AF37] font-bold text-xs mb-1">01</div>
              <div className="text-[9px] text-zinc-400 tracking-wider uppercase">Take Selfie</div>
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 p-3 rounded-sm">
              <div className="text-[#D4AF37] font-bold text-xs mb-1">02</div>
              <div className="text-[9px] text-zinc-400 tracking-wider uppercase">Scan Face</div>
            </div>
            <div className="flex-1 bg-white/5 border border-white/10 p-3 rounded-sm">
              <div className="text-[#D4AF37] font-bold text-xs mb-1">03</div>
              <div className="text-[9px] text-zinc-400 tracking-wider uppercase">Get Photos</div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          
          {/* Futuristic Scanner Frame */}
          <div className="relative group mx-auto w-64 h-80 mb-8">
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37] transition-all duration-500 group-hover:w-12 group-hover:h-12 z-20"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37] transition-all duration-500 group-hover:w-12 group-hover:h-12 z-20"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37] transition-all duration-500 group-hover:w-12 group-hover:h-12 z-20"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37] transition-all duration-500 group-hover:w-12 group-hover:h-12 z-20"></div>

            <div className="absolute inset-0 bg-white/[0.02] border border-white/5 backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden z-10">
              <AnimatePresence mode="wait">
                {cameraActive ? (
                  <motion.div 
                    key="camera-active"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-full h-full relative"
                  >
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover filter grayscale sepia-[0.3]" 
                    />
                    <div className="absolute inset-0 bg-[#D4AF37]/20 flex items-center justify-center backdrop-blur-sm">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#D4AF37] shadow-[0_0_15px_#D4AF37] animate-[scan_2s_linear_infinite]"></div>
                    </div>
                  </motion.div>
                ) : file ? (
                  <motion.div 
                    key="file-selected"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-full h-full relative group/img"
                  >
                    <img src={URL.createObjectURL(file)} alt="Subject" className="w-full h-full object-cover filter grayscale sepia-[0.3]" />
                    <button 
                      type="button"
                      onClick={() => setFile(null)}
                      className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white hover:text-[#D4AF37] backdrop-blur-md opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {loading && (
                      <div className="absolute inset-0 bg-[#D4AF37]/20 flex items-center justify-center backdrop-blur-sm">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#D4AF37] shadow-[0_0_15px_#D4AF37] animate-[scan_2s_linear_infinite]"></div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-file"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-zinc-500 w-full px-6"
                  >
                    <ScanFace className="h-10 w-10 mb-6 text-zinc-600" strokeWidth={1} />
                    
                    <button 
                      type="button" 
                      onClick={startCamera}
                      className="w-full py-3 mb-3 border border-white/10 text-[10px] tracking-widest hover:text-[#D4AF37] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors uppercase"
                    >
                      Open Camera
                    </button>
                    
                    <div className="relative w-full">
                      <input 
                        type="file" 
                        id="selfie-upload" 
                        accept="image/*" 
                        capture="user"
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                      <label 
                        htmlFor="selfie-upload"
                        className="block w-full text-center py-3 border border-white/10 text-[10px] tracking-widest cursor-pointer hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors uppercase bg-[#D4AF37]/10 text-[#D4AF37]"
                      >
                        Take Photo (Mobile) / Upload
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Hidden canvas for capturing video frames */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-red-500 text-xs tracking-widest text-center uppercase mb-6 px-4"
              >
                [ ERROR: {error} ]
              </motion.div>
            )}
          </AnimatePresence>

          {cameraActive ? (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={capturePhoto}
              className="w-full py-5 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-500 bg-white text-black hover:bg-[#D4AF37]"
            >
              Capture Frame
            </motion.button>
          ) : (
            <motion.button 
              whileHover={!file || loading ? {} : { scale: 1.02 }}
              whileTap={!file || loading ? {} : { scale: 0.98 }}
              type="submit"
              disabled={!file || loading}
              className={`w-full py-5 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-500 ${
                !file || loading 
                ? 'bg-transparent border border-white/10 text-white/20 cursor-not-allowed' 
                : 'bg-[#D4AF37] text-black hover:bg-white'
              }`}
            >
              {loading ? 'Processing Neural Data...' : 'Authenticate Identity'}
            </motion.button>
          )}
        </form>
      </motion.div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(320px); }
        }
      `}} />
    </div>
  );
};

export default GuestPortal;
