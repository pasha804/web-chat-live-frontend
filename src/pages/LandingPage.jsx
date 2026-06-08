import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage({ onJoin, error }) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (error) setIsConnecting(false);
  }, [error]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    setIsConnecting(true);
    onJoin(name, roomCode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in relative z-10">
      
      {/* Glow behind card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-glow/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card w-full max-w-md p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="text-center mb-10">
          <motion.div 
            className="text-4xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            💕
          </motion.div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
            Love Chat
          </h1>
          <p className="text-rose-200/80 font-light text-sm md:text-base italic">
            "Enter a shared code to connect with your love"
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-rose-300 uppercase ml-1">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Romeo"
              className="love-input w-full px-4 py-3 rounded-xl text-base"
              maxLength={30}
              disabled={isConnecting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-rose-300 uppercase ml-1">
              Secret Room Code <span className="text-pink-glow">*</span>
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. FOREVER"
              className="love-input glow-ring w-full px-4 py-3 rounded-xl text-base font-bold tracking-widest text-center"
              maxLength={20}
              required
              disabled={isConnecting}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-sm text-center bg-red-900/30 p-3 rounded-lg border border-red-500/20"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={!roomCode.trim() || isConnecting}
            className="love-btn w-full py-4 rounded-xl mt-4 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{isConnecting ? 'CONNECTING...' : 'CONNECT WITH LOVE'}</span>
            {!isConnecting && <span className="text-xl leading-none ml-1">✨</span>}
          </button>
        </form>
      </motion.div>
      
      <p className="mt-8 text-xs text-rose-200/40 font-light">
        Messages disappear when you close the room.
      </p>
    </div>
  );
}
