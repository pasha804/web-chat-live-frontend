import { io } from 'socket.io-client';

const BACKEND_URL = 'https://web-chat-live-backend-production.up.railway.app';

const socket = io(BACKEND_URL, {
  autoConnect: false,
  // Reconnection — critical for backgrounded/minimized browsers
  reconnection: true,
  reconnectionAttempts: Infinity,   // keep trying forever
  reconnectionDelay: 1000,          // start at 1s
  reconnectionDelayMax: 10000,      // cap at 10s
  // Match server-side ping settings so we don't time out when app is backgrounded
  timeout: 60000,
  transports: ['websocket', 'polling'],
});

export default socket;
