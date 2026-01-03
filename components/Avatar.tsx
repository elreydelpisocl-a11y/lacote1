
import React from 'react';
import { Mood } from '../types';

interface AvatarProps {
  mood: Mood;
  isTalking: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ mood, isTalking }) => {
  return (
    <div className={`relative w-72 h-72 md:w-96 md:h-96 transition-transform duration-300 ${isTalking ? 'scale-110' : 'scale-100'}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_20px_40px_rgba(255,105,180,0.4)]">
        <style>
          {`
            @keyframes blink { 0%, 90%, 100% { opacity: 1; } 95% { opacity: 0; } }
            @keyframes sway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
            @keyframes dance { 0%, 100% { transform: translateY(0) rotate(-3deg); } 50% { transform: translateY(-10px) rotate(3deg); } }
            @keyframes talk { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.8); } }
            .eye { animation: blink 3s infinite; }
            .sway-body { animation: sway 2s ease-in-out infinite; transform-origin: bottom center; }
            .dance-body { animation: dance 0.4s ease-in-out infinite; }
            .mouth-talk { animation: talk 0.15s infinite; }
          `}
        </style>
        
        {/* Hair Back */}
        <path d="M40,100 Q40,40 100,40 Q160,40 160,100 L170,180 Q100,190 30,180 Z" fill="#F4D03F" className={isTalking || mood === 'excited' ? 'dance-body' : 'sway-body'} />
        
        {/* Neck */}
        <rect x="90" y="145" width="20" height="20" fill="#FFDBAC" />
        
        {/* Face */}
        <path d="M60,100 Q60,50 100,50 Q140,50 140,100 Q140,160 100,160 Q60,160 60,100" fill="#FFE4C4" className={isTalking || mood === 'excited' ? 'dance-body' : 'sway-body'} />
        
        {/* Hair Front / Fringe */}
        <path d="M60,80 Q100,30 140,80 Q145,50 100,45 Q55,50 60,80" fill="#FFEB3B" />
        
        {/* Eyes */}
        <g className="eye">
          <circle cx="85" cy="100" r="4.5" fill="#333" />
          <circle cx="115" cy="100" r="4.5" fill="#333" />
        </g>
        
        {/* Eyebrows */}
        <g transform={mood === 'angry' ? 'translate(0, 3) rotate(15 100 100)' : mood === 'excited' ? 'translate(0, -3)' : ''}>
           <path d="M75,88 Q85,82 95,88" fill="none" stroke="#8B4513" strokeWidth="2.5" />
           <path d="M105,88 Q115,82 125,88" fill="none" stroke="#8B4513" strokeWidth="2.5" />
        </g>

        {/* Mouth */}
        <g transform="translate(100, 135)">
          {isTalking ? (
            <ellipse cx="0" cy="0" rx="12" ry="7" fill="#C0392B" className="mouth-talk" />
          ) : mood === 'angry' ? (
            <path d="M-12,6 Q0,-4 12,6" fill="none" stroke="#C0392B" strokeWidth="4" strokeLinecap="round" />
          ) : mood === 'gossiping' ? (
            <path d="M-10,0 Q0,10 10,0" fill="none" stroke="#C0392B" strokeWidth="4" strokeLinecap="round" />
          ) : (
            <path d="M-12,-2 Q0,10 12,-2" fill="none" stroke="#C0392B" strokeWidth="4" strokeLinecap="round" />
          )}
        </g>

        {/* Blush */}
        <circle cx="75" cy="120" r="6" fill="#FFB6C1" opacity="0.7" />
        <circle cx="125" cy="120" r="6" fill="#FFB6C1" opacity="0.7" />
        
        {/* Accessories - Extra Shiny Trendy Earrings */}
        <circle cx="62" cy="125" r="4" fill="#FFD700" className="animate-pulse" />
        <circle cx="138" cy="125" r="4" fill="#FFD700" className="animate-pulse" />
      </svg>
    </div>
  );
};

export default Avatar;
