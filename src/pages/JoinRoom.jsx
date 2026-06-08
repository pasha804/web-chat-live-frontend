import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function JoinRoom() {
  const [inputValue, setInputValue] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let roomId = inputValue.trim();
    
    // If they pasted the full link, extract the ID
    try {
      if (roomId.startsWith('http')) {
        const url = new URL(roomId);
        const parts = url.pathname.split('/');
        roomId = parts[parts.length - 1];
      }
    } catch (e) {
      // Not a valid URL, just use the string as-is
    }

    if (roomId) {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in relative z-10 w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-glow/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card w-full max-w-md p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">💌</div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Join Love Room
          </h1>
          <p className="text-rose-200/80 text-sm">
            Paste the invite link to enter
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="https://lovechat.app/room/love-..."
              className="love-input w-full px-4 py-4 rounded-xl text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="love-btn w-full py-4 rounded-xl font-bold disabled:opacity-50"
            >
              Join Room
            </button>
            
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-3 text-rose-300 hover:text-white transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
