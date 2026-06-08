import React from 'react';

export default function HeartBackground() {
  const hearts = Array.from({ length: 15 }).map((_, i) => {
    const left = Math.floor(Math.random() * 100);
    const duration = 15 + Math.random() * 15; // 15s to 30s
    const delay = Math.random() * 20;

    return (
      <div
        key={i}
        className="heart-particle"
        style={{
          left: `${left}%`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
        }}
      >
        ❤️
      </div>
    );
  });

  return <div className="hearts-bg">{hearts}</div>;
}
