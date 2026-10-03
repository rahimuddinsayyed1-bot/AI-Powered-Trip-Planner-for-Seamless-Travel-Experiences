"use client";
import { useEffect, useState } from 'react';

export default function Background() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate zoom scale based on scroll position (zoom out as you scroll down)
  // Starts at 1.3 scale, scales down to 1.0 based on scroll
  const scale = Math.max(1, 1.3 - (scrollY * 0.0008));
  
  return (
    <>
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(/new-bg-india.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: `scale(${scale})`,
          transition: 'transform 0.1s ease-out',
          zIndex: -2,
        }}
      />
      {/* Overlay to ensure text readability */}
      <div 
        className="bg-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          transition: 'background-color 0.3s ease'
        }}
      />
    </>
  );
}
