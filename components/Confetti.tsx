'use client';

import { useEffect, useState } from 'react';

interface ConfettiProps {
  active?: boolean;
  duration?: number;
}

/**
 * Pure CSS confetti animation component
 * Triggers on mount and animates confetti particles
 */
export default function Confetti({ active = true, duration = 3000 }: ConfettiProps) {
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    if (active) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!isActive) {
    return null;
  }

  // Generate confetti particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'][
      Math.floor(Math.random() * 7)
    ],
  }));

  return (
    <div
      className="confetti-container"
      role="presentation"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="confetti-particle"
          style={{
            position: 'absolute',
            left: `${particle.left}%`,
            top: '-10px',
            width: '10px',
            height: '10px',
            backgroundColor: particle.color,
            borderRadius: '50%',
            animation: `confetti-fall ${particle.duration}s ${particle.delay}s ease-in forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

