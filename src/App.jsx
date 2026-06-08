import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import ChatRoom from './pages/ChatRoom';
import HeartBackground from './components/HeartBackground';

export default function App() {
  return (
    <Router>
      <main className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
        <HeartBackground />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateRoom />} />
          <Route path="/join" element={<JoinRoom />} />
          <Route path="/room/:roomId" element={<ChatRoom />} />
        </Routes>
      </main>
    </Router>
  );
}
