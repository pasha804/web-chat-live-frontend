import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../api';

export default function CreateRoom() {
  const [roomId, setRoomId] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    const createRoom = async () => {
      try {
        const data = await apiPost('/api/rooms/create');
        
        if (isMounted) {
          setRoomId(data.roomId);
          sessionStorage.setItem(`love_token_${data.roomId}`, data.creatorToken);
        }
      } catch (err) {
        if (isMounted) {
          setError('Could not connect to the server. Is it running?');
        }
      }
    };

    createRoom();
    return () => { isMounted = false; };
  }, []);

  const inviteLink = roomId ? `${window.location.origin}/room/${roomId}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Love Room',
          text: 'Come chat with me in our private Love Room ❤️',
          url: inviteLink,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopy();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center z-10 relative">
        <h2 className="text-2xl text-red-400 mb-4">Oops!</h2>
        <p className="text-rose-200">{error}</p>
        <button onClick={() => navigate('/')} className="mt-6 love-btn px-6 py-2 rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 animate-fade-in relative z-10 w-full">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-glow/20 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-md p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center text-center"
      >
        {!roomId ? (
          <div className="animate-pulse text-rose-300">Creating your private room...</div>
        ) : (
          <>
            <div className="text-5xl mb-4">❤️</div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">Room Created</h1>
            <p className="text-rose-200/80 mb-8 text-sm">
              Share this private link with your partner
            </p>

            <div className="w-full bg-black/40 border border-rose-900/50 rounded-xl p-4 mb-6 break-all shadow-inner">
              <p className="text-pink-glow font-medium text-sm sm:text-base selection:bg-pink-glow/30">
                {inviteLink}
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <div className="flex gap-3">
                <button 
                  onClick={handleCopy}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <><span className="text-green-400">✓</span> Copied!</>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      Copy Link
                    </>
                  )}
                </button>
                
                {navigator.share && (
                  <button 
                    onClick={handleShare}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                    Share
                  </button>
                )}
              </div>

              <button 
                onClick={() => navigate(`/room/${roomId}`)}
                className="love-btn w-full py-4 rounded-xl font-bold mt-2 shadow-lg"
              >
                Join Room Now
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
