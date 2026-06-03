import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BulkUpload = ({ eventId, token, folderName = "General", onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    
    setUploading(true);
    setProgress(0);
    setMessage('');
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('folder_name', folderName);

    try {
      const response = await axios.post(`/api/media/upload/${eventId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percentCompleted);
        }
      });
      
      setMessage(`Successfully ingested ${files.length} assets into the neural matrix.`);
      setFiles([]);
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error(error);
      setMessage('Ingestion failed. Please check network connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-transparent text-white w-full">
      <div className="relative group">
        <input 
          type="file" 
          multiple 
          onChange={handleFileChange}
          className="hidden" 
          id="file-upload"
          accept="image/*,video/*"
        />
        <label 
          htmlFor="file-upload"
          className="cursor-pointer block border-2 border-dashed border-white/20 p-12 text-center hover:border-[#D4AF37] hover:bg-white/[0.02] transition-colors relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-500"></div>
          <Database className="mx-auto h-12 w-12 text-zinc-600 group-hover:text-[#D4AF37] mb-6 transition-colors" strokeWidth={1} />
          <p className="text-xs tracking-[0.2em] text-zinc-400 mb-2 uppercase">Establish Secure Link</p>
          <p className="text-sm font-bold text-white uppercase tracking-widest">Select Media Assets for Neural Processing</p>
        </label>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="flex justify-between items-end mb-4 border-b border-white/10 pb-2">
               <p className="font-bold text-xs tracking-widest uppercase text-[#D4AF37]">Assets Queued</p>
               <p className="text-zinc-500 text-xs tracking-widest">{files.length} FILES DETECTED</p>
            </div>
            
            <button 
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full py-4 text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 relative overflow-hidden ${
                uploading 
                ? 'bg-transparent border border-white/20 text-white/50 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-[#D4AF37]'
              }`}
            >
              {uploading ? (
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="inline-block h-3 w-3 border border-[#D4AF37] border-t-transparent rounded-full animate-spin"></span>
                  Processing... {progress}%
                </span>
              ) : (
                'Initiate Transfer'
              )}
              {uploading && (
                <div 
                  className="absolute bottom-0 left-0 h-full bg-white/10" 
                  style={{ width: `${progress}%`, transition: 'width 0.3s ease' }}
                ></div>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-6 p-4 text-xs tracking-widest uppercase border flex items-start gap-4 ${
              message.includes('Success') 
              ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5 text-[#D4AF37]' 
              : 'border-red-500/50 bg-red-500/5 text-red-500'
            }`}
          >
            {message.includes('Success') ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.5} /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.5} />}
            <span className="leading-relaxed">{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BulkUpload;
