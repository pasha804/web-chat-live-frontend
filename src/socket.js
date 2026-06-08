import { io } from 'socket.io-client';

const BACKEND_URL = 'https://web-chat-live-backend-production.up.railway.app';

const socket = io(BACKEND_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});

export default socket;
