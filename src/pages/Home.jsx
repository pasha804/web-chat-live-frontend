import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in relative z-10 w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-glow/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card w-full max-w-md p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center"
      >
        <div className="text-center mb-10">
          <motion.div 
            className="text-5xl mb-6"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            💕
          </motion.div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">
            Love Chat
          </h1>
          <p className="text-rose-200/80 font-light text-sm italic">
            Private, ephemeral, real-time connection.
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <Link 
            to="/create"
            className="love-btn w-full py-4 rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg shadow-pink-glow/20"
          >
            <span>❤️ Create Love Room</span>
          </Link>
          
          <Link 
            to="/join"
            className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors shadow-lg"
          >
            <span>💌 Join Love Room</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
