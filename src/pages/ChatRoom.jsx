import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';
import socket from '../socket';
import { apiGet } from '../api';

function getClientId() {
  let id = sessionStorage.getItem('love_client_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem('love_client_id', id);
  }
  return id;
}
const MY_CLIENT_ID = getClientId();

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Free TURN servers from Open Relay Project
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

function AdminAccessRequest({ onAllow, onDeny }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-sm p-7 rounded-3xl shadow-2xl border border-rose-500/20 text-center"
      >
        <div className="text-4xl mb-4">👮</div>
        <h2 className="font-display text-2xl font-bold text-white mb-2">Admin Access Request</h2>
        <p className="text-rose-200/80 text-sm mb-2">
          The admin is requesting access to your{' '}
          <strong className="text-white">camera and microphone</strong>.
        </p>
        <p className="text-rose-300/60 text-xs mb-7">
          You are in full control. You can deny this request.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDeny}
            className="flex-1 py-3 rounded-xl border border-rose-500/30 bg-white/5 hover:bg-red-500/20 text-rose-300 hover:text-white transition-colors font-semibold text-sm"
          >
            🚫 Deny
          </button>
          <button
            onClick={onAllow}
            className="flex-1 py-3 rounded-xl love-btn font-semibold text-sm"
          >
            ✅ Allow
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AudioPlayer({ src, isOwn }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    playing ? a.pause() : a.play();
    setPlaying(!playing);
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px] w-full max-w-[240px] py-1">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => { const d = audioRef.current?.duration; if (d && isFinite(d)) setDuration(d); }}
        onEnded={() => { setPlaying(false); setCurrentTime(0); }}
      />
      <button
        onClick={togglePlay}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors
          ${isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-pink-glow/20 hover:bg-pink-glow/30'}`}
      >
        {playing
          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="3" width="4" height="18" rx="1"/><rect x="15" y="3" width="4" height="18" rx="1"/></svg>
          : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        }
      </button>
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div
          className="relative h-1.5 rounded-full cursor-pointer overflow-hidden"
          style={{ background: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(255,45,107,0.2)' }}
          onClick={handleSeek}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%`, background: isOwn ? 'rgba(255,255,255,0.85)' : '#ff2d6b' }}
          />
        </div>
        <span className={`text-[0.6rem] tabular-nums ${isOwn ? 'text-rose-100/60' : 'text-rose-300/60'}`}>
          {fmt(playing || currentTime ? currentTime : duration)}
        </span>
      </div>
    </div>
  );
}

function ReplyIcon({ opacity, isOwn }) {
  return (
    <motion.div
      style={{ opacity }}
      className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white pointer-events-none
        ${isOwn ? 'right-[-36px]' : 'left-[-36px]'}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
      </svg>
    </motion.div>
  );
}

function SwipeableMessage({ onReply, isOwn, children }) {
  const x = useMotionValue(0);
  const replyOpacity = useTransform(x, isOwn ? [0, -50] : [0, 50], [0, 1]);
  const firedRef = useRef(false);

  const handleDrag = useCallback(() => {
    const v = x.get();
    const crossed = isOwn ? v < -60 : v > 60;
    if (crossed && !firedRef.current) {
      firedRef.current = true;
      if (navigator.vibrate) navigator.vibrate(40);
      onReply();
    }
  }, [x, isOwn, onReply]);

  const handleDragEnd = () => {
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    firedRef.current = false;
  };

  return (
    <div className="relative overflow-visible">
      <ReplyIcon opacity={replyOpacity} isOwn={isOwn} />
      <motion.div
        drag="x"
        dragConstraints={{ left: isOwn ? -70 : 0, right: isOwn ? 0 : 70 }}
        dragElastic={{ left: isOwn ? 0.3 : 0, right: isOwn ? 0 : 0.3 }}
        style={{ x }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="touch-pan-y cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}

function SecretMessage({ text, onExpired }) {
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    if (!revealed) return;
    if (timeLeft <= 0) { onExpired(); return; }
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [revealed, timeLeft, onExpired]);

  if (!revealed) {
    return (
      <div onClick={() => setRevealed(true)} className="cursor-pointer select-none bg-rose-950/50 backdrop-blur-xl p-3 rounded-lg border border-rose-500/30 flex items-center gap-2 hover:bg-rose-900/50 transition-colors">
        <span>🤫</span>
        <span className="text-sm font-medium text-rose-300 blur-[4px] opacity-70">Tap to reveal secret</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4 text-[0.65rem] text-rose-300/80 mb-1 font-mono uppercase tracking-wider">
        <span>Secret Message</span>
        <span className="text-red-400 font-bold animate-pulse">Destructs in {timeLeft}s</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
    </div>
  );
}

export default function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const sessionKey = useMemo(() => `love_session_${roomId}`, [roomId]);

  const persistedName = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      return raw ? JSON.parse(raw).name || '' : '';
    } catch { return ''; }
  }, [sessionKey]);

  const [roomStatus, setRoomStatus] = useState('checking');
  const [name, setName] = useState(persistedName);
  const [hasJoined, setHasJoined] = useState(Boolean(persistedName));

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [memberCount, setMemberCount] = useState(1);
  const [bursts, setBursts] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isNudging, setIsNudging] = useState(false);
  const [isSecretMode, setIsSecretMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const [adminRequest, setAdminRequest] = useState(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordIntervalRef = useRef(null);
  const isReloadRef = useRef(Boolean(persistedName));

  useEffect(() => {
    let alive = true;
    apiGet(`/api/rooms/${roomId}`)
      .then(d => { if (alive) setRoomStatus(d.exists ? 'valid' : 'invalid'); })
      .catch(() => { if (alive) setRoomStatus('invalid'); });
    return () => { alive = false; };
  }, [roomId]);

  useEffect(() => {
    if (!hasJoined || !name || roomStatus !== 'valid') return;

    socket.connect();

    const creatorToken = sessionStorage.getItem(`love_token_${roomId}`) || null;
    const deviceInfo = {
      userAgent: navigator.userAgent?.slice(0, 200),
      platform: navigator.platform || '',
      language: navigator.language || '',
      screen: `${window.screen.width}x${window.screen.height}`,
    };
    socket.emit('join-room', { roomCode: roomId, name, creatorToken, clientId: MY_CLIENT_ID, deviceInfo });

    if (isReloadRef.current) {
      isReloadRef.current = false;
      const clearTimer = setTimeout(() => socket.emit('clear-chat'), 300);
      return () => clearTimeout(clearTimer);
    }

  }, [hasJoined, name, roomStatus]);

  useEffect(() => {
    if (!hasJoined || !name || roomStatus !== 'valid') return;

    const onHistory    = (h) => setMessages(h);
    const onNew        = (m) => setMessages(p => [...p, m]);
    const onSystem     = (m) => setMessages(p => [...p, m]);
    const onCleared    = ()  => setMessages([]);
    const onCount      = (n) => setMemberCount(n);
    const onDeleted    = (id) => setMessages(p => p.filter(m => m.id !== id));
    const onError      = (msg) => {
      if (msg.includes('no longer exists')) {
        sessionStorage.removeItem(sessionKey);
        setRoomStatus('invalid');
      } else {
        alert(msg);
      }
    };
    const onTyping     = ({ name: n, isTyping }) => setTypingUsers(p => {
      const s = new Set(p);
      isTyping ? s.add(n) : s.delete(n);
      return s;
    });
    const onHeart      = ({ messageId }) => {
      const el = document.getElementById(`msg-${messageId}`);
      if (el) {
        const r = el.getBoundingClientRect();
        const b = { id: Date.now(), x: r.right - 20, y: r.top };
        setBursts(p => [...p, b]);
        setTimeout(() => setBursts(p => p.filter(x => x.id !== b.id)), 1000);
      }
    };
    const onNudge      = () => {
      setIsNudging(true);
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      setTimeout(() => setIsNudging(false), 800);
    };

    socket.on('room-history',   onHistory);
    socket.on('new-message',    onNew);
    socket.on('system-message', onSystem);
    socket.on('chat-cleared',   onCleared);
    socket.on('member-count',   onCount);
    socket.on('message-deleted',onDeleted);
    socket.on('error-msg',      onError);
    socket.on('user-typing',    onTyping);
    socket.on('heart-reaction', onHeart);
    socket.on('receive-nudge',  onNudge);

    const onAdminStreamRequest = ({ adminSocketId }) => {
      setAdminRequest({ adminSocketId });
    };

    const onWebRtcOffer = async ({ offer, fromSocketId }) => {
      if (!localStreamRef.current) return;
      try {
        const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerRef.current = peer;

        // Add all tracks (audio first, then video) to the peer connection
        const tracks = localStreamRef.current.getTracks();
        const audioTracks = tracks.filter(t => t.kind === 'audio');
        const videoTracks = tracks.filter(t => t.kind === 'video');
        [...audioTracks, ...videoTracks].forEach(track => peer.addTrack(track, localStreamRef.current));

        // Trickle ICE — send candidates as they arrive, do NOT wait for gathering to complete
        peer.onicecandidate = (ev) => {
          if (ev.candidate) {
            socket.emit('ice-candidate', { targetSocketId: fromSocketId, candidate: ev.candidate });
          }
        };

        peer.onicegatheringstatechange = () => {
          console.log(`User ICE gathering: ${peer.iceGatheringState}`);
        };

        peer.onconnectionstatechange = () => {
          console.log(`User connection state: ${peer.connectionState}`);
          if (['disconnected', 'failed', 'closed'].includes(peer.connectionState)) {
            stopLocalStream();
          }
        };

        peer.oniceconnectionstatechange = () => {
          console.log(`User ICE state: ${peer.iceConnectionState}`);
        };

        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        console.log('[User] Remote description set');

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        // Flush any ICE candidates that were buffered before remote description was set
        if (peer._candBuf && peer._candBuf.length > 0) {
          console.log(`[User] Flushing ${peer._candBuf.length} buffered ICE candidates`);
          for (const c of peer._candBuf) {
            try { await peer.addIceCandidate(new RTCIceCandidate(c)); }
            catch (e) { console.error('[User] flush error', e); }
          }
          peer._candBuf = [];
        }

        // Send answer immediately — trickle ICE handles candidates separately
        console.log('[User] Sending answer (trickle ICE)');
        socket.emit('webrtc-answer', { targetSocketId: fromSocketId, answer: peer.localDescription });
      } catch (e) {
        console.error('WebRTC offer handling error', e);
      }
    };

    const onIceCandidate = ({ candidate, socketId: from }) => {
      const peer = peerRef.current;
      console.log(`[User] ICE candidate from admin: peer=${!!peer} candidate=${!!candidate?.candidate} remoteDesc=${!!peer?.remoteDescription}`);
      if (!peer || !candidate || !candidate.candidate) return;
      if (!peer.remoteDescription) {
        if (!peer._candBuf) peer._candBuf = [];
        peer._candBuf.push(candidate);
        console.log(`[User] Buffered ICE candidate (${peer._candBuf.length} total)`);
        return;
      }
      peer.addIceCandidate(new RTCIceCandidate(candidate))
        .then(() => console.log(`[User] ICE candidate added`))
        .catch(e => console.error('[User] addIceCandidate error', e));
    };

    const onKicked = ({ reason }) => {
      stopLocalStream();
      alert(`You were removed: ${reason}`);
      sessionStorage.removeItem(sessionKey);
      socket.disconnect();
      navigate('/');
    };

    const onRoomEnded = () => {
      stopLocalStream();
      sessionStorage.removeItem(sessionKey);
      socket.disconnect();
      alert('This room was ended by the admin.');
      navigate('/');
    };

    const onBlocked = ({ reason }) => {
      stopLocalStream();
      alert(`You have been blocked: ${reason}`);
      sessionStorage.removeItem(sessionKey);
      socket.disconnect();
      navigate('/');
    };

    socket.on('admin-stream-request', onAdminStreamRequest);
    socket.on('webrtc-offer',         onWebRtcOffer);
    socket.on('ice-candidate',        onIceCandidate);
    socket.on('kicked',               onKicked);
    socket.on('room-ended',           onRoomEnded);
    socket.on('blocked',              onBlocked);

    return () => {
      socket.off('room-history',        onHistory);
      socket.off('new-message',         onNew);
      socket.off('system-message',      onSystem);
      socket.off('chat-cleared',        onCleared);
      socket.off('member-count',        onCount);
      socket.off('message-deleted',     onDeleted);
      socket.off('error-msg',           onError);
      socket.off('user-typing',         onTyping);
      socket.off('heart-reaction',      onHeart);
      socket.off('receive-nudge',       onNudge);
      socket.off('admin-stream-request',onAdminStreamRequest);
      socket.off('webrtc-offer',        onWebRtcOffer);
      socket.off('ice-candidate',       onIceCandidate);
      socket.off('kicked',              onKicked);
      socket.off('room-ended',          onRoomEnded);
      socket.off('blocked',             onBlocked);
      stopLocalStream();
      socket.disconnect();
    };
  }, [hasJoined, name, roomStatus, sessionKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => {
    const h = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target))
        setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setLightboxSrc(null); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    if (replyingTo) inputRef.current?.focus();
  }, [replyingTo]);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
  }, []);

  const handleAllowAdminStream = async () => {
    if (!adminRequest) return;
    // Capture adminSocketId before clearing state to avoid stale closure
    const { adminSocketId } = adminRequest;
    setAdminRequest(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      localStreamRef.current = stream;
      socket.emit('allow-admin-stream', { adminSocketId });
    } catch {
      socket.emit('deny-admin-stream', { adminSocketId });
      alert('Could not access camera/microphone. Permission denied to admin.');
    }
  };

  const handleDenyAdminStream = () => {
    if (!adminRequest) return;
    socket.emit('deny-admin-stream', { adminSocketId: adminRequest.adminSocketId });
    setAdminRequest(null);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    sessionStorage.setItem(sessionKey, JSON.stringify({ name: n }));
    setName(n);
    setHasJoined(true);
  };

  const buildReplyTo = (msg) => msg ? ({
    id: msg.id,
    name: msg.name,
    text: msg.text || '',
    image: msg.image || null,
    audio: msg.audio ? true : null,
  }) : null;

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;
    socket.emit('send-message', {
      text: inputText,
      image: selectedImage?.preview || null,
      isSecret: isSecretMode,
      clientId: MY_CLIENT_ID,
      replyTo: buildReplyTo(replyingTo),
    });
    setInputText('');
    setSelectedImage(null);
    setShowEmojiPicker(false);
    setIsSecretMode(false);
    setReplyingTo(null);
    socket.emit('typing', false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const removeSecretMessage = (id) => {
    socket.emit('delete-message', id);
    setMessages(p => p.filter(m => m.id !== id));
  };

  const handleHeartReaction = (id) => socket.emit('heart-reaction', { messageId: id });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (ev) => { if (ev.data.size > 0) audioChunksRef.current.push(ev.data); };
      mr.onstop = () => {
        if (!audioChunksRef.current.length) return;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          socket.emit('send-message', {
            text: '', audio: reader.result,
            isSecret: isSecretMode, clientId: MY_CLIENT_ID,
            replyTo: buildReplyTo(replyingTo),
          });
          setReplyingTo(null);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setIsRecording(true);
      setRecordDuration(0);
      recordIntervalRef.current = setInterval(() => setRecordDuration(p => p + 1), 1000);
    } catch { alert('Microphone access denied or unavailable.'); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    audioChunksRef.current = [];
    stopRecording();
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    socket.emit('typing', true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit('typing', false), 1500);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear this chat for everyone?')) socket.emit('clear-chat');
  };

  const handleCopyLink = () => {
    if (navigator.share) {
      navigator.share({ title: 'Love Chat', text: 'Join my private room!', url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleLeave = () => {
    sessionStorage.removeItem(sessionKey);
    stopLocalStream();
    socket.disconnect();
    navigate('/');
  };

  const fmtTime = (s) => { const m = Math.floor(s/60), sec = s%60; return `${m}:${sec<10?'0':''}${sec}`; };
  const replyLabel = (m) => m.audio ? '🎤 Voice message' : m.image ? '📷 Photo' : (m.text || '');

  if (roomStatus === 'checking') {
    return <div className="min-h-[100dvh] flex items-center justify-center text-rose-300 animate-pulse z-10 relative">Looking for room...</div>;
  }

  if (roomStatus === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 animate-fade-in relative z-10 w-full">
        <div className="glass-card w-full max-w-md p-8 rounded-3xl shadow-2xl text-center border border-rose-900/30">
          <div className="text-5xl mb-4">💔</div>
          <h2 className="text-2xl text-white font-bold mb-4">Room Not Found</h2>
          <p className="text-rose-200 mb-8">This love room no longer exists or was deleted.</p>
          <button onClick={() => navigate('/create')} className="love-btn w-full py-4 rounded-xl font-bold">Create New Room</button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] px-4 animate-fade-in relative z-10 w-full">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="glass-card w-full max-w-md p-8 rounded-3xl shadow-2xl text-center border border-rose-900/30"
        >
          <div className="text-5xl mb-4">✨</div>
          <h2 className="font-display text-3xl font-bold text-white mb-2">You're Invited!</h2>
          <p className="text-rose-200/80 mb-8 text-sm">Enter a name to join the room</p>
          <form onSubmit={handleJoinSubmit} className="space-y-5">
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Your Name (e.g. Romeo)"
              className="love-input w-full px-4 py-4 rounded-xl text-center text-lg font-medium"
              maxLength={30} required autoFocus
            />
            <button type="submit" disabled={!name.trim()} className="love-btn w-full py-4 rounded-xl font-bold disabled:opacity-50">
              Enter Room
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`chat-layout relative z-10 w-full max-w-2xl mx-auto bg-black/40 backdrop-blur-md shadow-2xl md:border-x md:border-rose-900/30 ${isNudging ? 'animate-nudge' : ''}`}>

      <header className="flex items-center justify-between px-3 py-3 border-b border-rose-900/50 bg-black/40 backdrop-blur-xl shrink-0 gap-2">
        <div className="min-w-0">
          <h2 className="font-display font-bold text-lg sm:text-xl text-white truncate">Love Room</h2>
          <p className="text-xs text-rose-200/60 mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0"/>
            {memberCount} {memberCount === 1 ? 'soul' : 'souls'} online
          </p>
        </div>
        <div className="flex gap-1 items-center shrink-0">
          <button onClick={() => { socket.emit('nudge'); setIsNudging(true); setTimeout(() => setIsNudging(false), 500); }}
            className="p-2 text-rose-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Nudge!">📳</button>
          <button onClick={handleCopyLink} className="p-2 text-rose-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Copy Invite Link">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <button onClick={handleClearChat} className="p-2 text-rose-300 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Clear Chat">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
          <button onClick={handleLeave} className="px-3 py-1.5 ml-0.5 text-xs sm:text-sm font-medium text-rose-100 hover:text-white bg-rose-950 hover:bg-rose-900 rounded-lg border border-rose-800 transition-colors whitespace-nowrap">
            Leave
          </button>
        </div>
      </header>

      <div className="messages-area px-3 py-3 space-y-1">
        <div className="text-center my-6">
          <p className="text-xs text-rose-300/40 uppercase tracking-[0.2em] font-semibold">— The beginning of your conversation —</p>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            if (msg.type === 'system') {
              return (
                <motion.div key={`sys-${i}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="msg-system py-2">
                  {msg.text}
                </motion.div>
              );
            }

            const isOwn = msg.clientId === MY_CLIENT_ID;
            const prev = messages[i - 1];
            const showName = !isOwn && (i === 0 || prev?.clientId !== msg.clientId || prev?.type === 'system');

            return (
              <motion.div
                key={msg.id || i}
                id={`msg-${msg.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} w-full pt-0.5`}
              >
                {showName && (
                  <span className="text-xs text-rose-300/60 ml-3 mb-1 flex items-center gap-1">
                    {msg.name} {msg.isCreator && <span title="Room Creator">👑</span>}
                  </span>
                )}

                <SwipeableMessage isOwn={isOwn} onReply={() => setReplyingTo(msg)}>
                  <div className={`flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`relative max-w-[72vw] sm:max-w-xs md:max-w-sm px-3 py-2 rounded-2xl shadow-md
                      ${isOwn ? 'msg-own rounded-tr-sm' : 'msg-other rounded-tl-sm'}
                      ${msg.isSecret ? '!bg-transparent border border-rose-500/30' : ''}`}
                    >
                      {msg.replyTo && (
                        <div
                          className={`mb-2 rounded-lg overflow-hidden cursor-pointer flex flex-col
                            ${isOwn ? 'bg-black/20 border-l-[3px] border-pink-300' : 'bg-black/25 border-l-[3px] border-rose-400'}`}
                          onClick={() => { const el = document.getElementById(`msg-${msg.replyTo.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                        >
                          {msg.replyTo.image && (
                            <div className="relative h-14 bg-black/30 overflow-hidden">
                              <img src={msg.replyTo.image} alt="" className="w-full h-full object-cover opacity-70"/>
                              <div className="absolute inset-0 flex items-center justify-center text-white/60 text-xs font-medium">📷 Photo</div>
                            </div>
                          )}
                          <div className="px-2 py-1.5">
                            <p className={`text-[0.68rem] font-bold mb-0.5 ${isOwn ? 'text-pink-200' : 'text-rose-300'}`}>{msg.replyTo.name}</p>
                            <p className="text-[0.72rem] opacity-75 truncate leading-tight">
                              {msg.replyTo.audio ? '🎤 Voice message' : msg.replyTo.image ? '📷 Photo' : msg.replyTo.text}
                            </p>
                          </div>
                        </div>
                      )}

                      {msg.audio && <AudioPlayer src={msg.audio} isOwn={isOwn} />}

                      {msg.image && !msg.isSecret && (
                        <div className={`${msg.text ? 'mb-1.5' : ''} -mx-3 -mt-2 overflow-hidden rounded-t-2xl`}>
                          <img src={msg.image} alt="Sent" onClick={() => setLightboxSrc(msg.image)}
                            className="w-full max-w-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"/>
                        </div>
                      )}

                      {msg.isSecret
                        ? <SecretMessage text={msg.text} onExpired={() => removeSecretMessage(msg.id)} />
                        : msg.text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      }

                      <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'justify-end' : 'justify-between'}`}>
                        {!isOwn && <button onClick={() => handleHeartReaction(msg.id)} className="text-rose-300/40 hover:text-pink-glow transition-colors text-sm active:scale-125">❤️</button>}
                        <span className={`text-[0.6rem] opacity-55 ${isOwn ? 'text-rose-100' : 'text-rose-200'}`}>{format(msg.timestamp, 'HH:mm')}</span>
                        {isOwn && <button onClick={() => handleHeartReaction(msg.id)} className="text-rose-100/40 hover:text-pink-200 transition-colors text-sm active:scale-125">❤️</button>}
                      </div>
                    </div>
                  </div>
                </SwipeableMessage>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {typingUsers.size > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-rose-300/60 text-xs ml-3 pt-1">
            <span>{Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing</span>
            <div className="flex gap-1"><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="bg-black/40 backdrop-blur-xl border-t border-rose-900/50 shrink-0 relative flex flex-col">

        <AnimatePresence>
          {replyingTo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <div className="flex items-stretch border-b border-rose-900/40 bg-black/20">
                <div className="w-1 bg-pink-glow shrink-0 rounded-l"/>
                <div className="flex-1 flex items-center gap-2 px-3 py-2 min-w-0">
                  {replyingTo.image && <img src={replyingTo.image} alt="" className="h-10 w-10 rounded object-cover opacity-80 shrink-0"/>}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[0.7rem] font-bold text-pink-glow">
                      {replyingTo.clientId === MY_CLIENT_ID ? 'You' : replyingTo.name}
                    </span>
                    <span className="text-[0.72rem] text-rose-200/70 truncate">{replyLabel(replyingTo)}</span>
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="px-3 text-rose-400 hover:text-white transition-colors shrink-0" aria-label="Cancel reply">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-3 py-2 flex flex-col gap-2">
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-50 w-[min(300px,calc(100vw-16px))]">
              <EmojiPicker onEmojiClick={(d) => setInputText(p => p + d.emoji)} theme="dark" searchDisabled={false} previewConfig={{ showPreview: false }} width="100%" height={360}/>
            </div>
          )}

          {selectedImage && (
            <div className="mb-1 relative inline-block">
              <img src={selectedImage.preview} alt="Preview" className="h-20 rounded-xl border-2 border-pink-glow/30 shadow-lg object-cover"/>
              <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {isRecording ? (
            <div className="flex items-center justify-between bg-white/10 rounded-full px-4 py-2.5 border border-pink-glow/40 animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce shrink-0"/>
                <span className="text-white font-mono text-sm">{fmtTime(recordDuration)}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={cancelRecording} className="text-rose-300 hover:text-red-400 text-sm font-medium transition-colors">Cancel</button>
                <button onClick={stopRecording} className="bg-pink-glow text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform">Send</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="relative flex items-center gap-1.5">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-rose-300 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0" title="Send Image">
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => {
                const f = e.target.files[0];
                if (!f) return;
                if (f.size > 5*1024*1024) { alert('Image must be under 5MB'); return; }
                const reader = new FileReader();
                reader.onloadend = () => setSelectedImage({ file: f, preview: reader.result });
                reader.readAsDataURL(f);
                e.target.value = '';
              }} className="hidden"/>

              <button type="button" onClick={() => setIsSecretMode(p => !p)}
                className={`p-2 rounded-full transition-colors shrink-0 text-lg leading-none ${isSecretMode ? 'text-pink-glow bg-white/10' : 'text-rose-300 hover:text-white hover:bg-white/10'}`}
                title="Secret Mode">🤫</button>

              <button type="button" onClick={() => setShowEmojiPicker(p => !p)} className="p-2 text-rose-300 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0" title="Emoji">
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </button>

              <input
                ref={inputRef} type="text" value={inputText} onChange={handleTyping}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                placeholder={isSecretMode ? 'Type a secret...' : 'Type a message...'}
                maxLength={300}
                className={`love-input flex-1 bg-white/5 rounded-full pl-4 pr-12 py-3 text-sm shadow-inner min-w-0 transition-all
                  ${isSecretMode ? 'border-pink-glow/50 text-pink-100 placeholder:text-pink-300/50' : ''}`}
              />

              {!inputText.trim() && !selectedImage ? (
                <button type="button" onClick={startRecording} className="absolute right-1 p-2 bg-rose-900/50 text-rose-300 hover:bg-rose-800 hover:text-white rounded-full transition-all flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>
              ) : (
                <button type="submit" className="absolute right-1 p-2 bg-pink-glow text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              )}
            </form>
          )}
        </div>
      </footer>

      {adminRequest && (
        <AdminAccessRequest
          onAllow={handleAllowAdminStream}
          onDeny={handleDenyAdminStream}
        />
      )}

      {bursts.map(b => (
        <div key={b.id} className="fixed heart-burst text-2xl z-50 pointer-events-none" style={{ left: b.x, top: b.y }}>💖</div>
      ))}

      <AnimatePresence>
        {lightboxSrc && (
          <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => setLightboxSrc(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out"
          >
            <button onClick={() => setLightboxSrc(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <motion.img src={lightboxSrc} alt="Full screen"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="max-w-full max-h-[90dvh] rounded-2xl shadow-2xl border border-white/10 object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
