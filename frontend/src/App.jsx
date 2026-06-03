import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import AdminDashboard from './pages/AdminDashboard';
import GuestPortal from './pages/GuestPortal';
import GuestGallery from './pages/GuestGallery';
import LandingPage from './pages/LandingPage';
import CinematicStudio from './pages/CinematicStudio';

// A wrapper component to handle route transitions
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route 
          path="/" 
          element={
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <LandingPage />
            </motion.div>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <AdminDashboard />
            </motion.div>
          } 
        />
        <Route 
          path="/event/:eventId" 
          element={
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.5 }}>
              <GuestPortal />
            </motion.div>
          } 
        />
        <Route 
          path="/event/:eventName/:eventId" 
          element={
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.5 }}>
              <GuestPortal />
            </motion.div>
          } 
        />
        <Route 
          path="/gallery/:eventId" 
          element={
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <GuestGallery />
            </motion.div>
          } 
        />
        <Route 
          path="/cinematic/:eventName/:eventId" 
          element={
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
              <CinematicStudio />
            </motion.div>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-[#D4AF37] selection:text-black">
      <Router>
        <AnimatedRoutes />
      </Router>
    </div>
  );
}

export default App;
