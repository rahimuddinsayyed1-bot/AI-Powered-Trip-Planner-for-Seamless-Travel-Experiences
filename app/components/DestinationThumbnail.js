"use client";

import { useState } from 'react';
import { getDestinationImageUrl, getDestinationMeta } from '../utils/destinationImages';

export default function DestinationThumbnail({ name, size = 'large' }) {
  const [imgSrc, setImgSrc] = useState(getDestinationImageUrl(name));
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const meta = getDestinationMeta(name);

  // Fallback handler
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc('/bg-travel.jpg');
    }
  };

  // Dimensions based on requested size
  let dimensions = { width: '230px', height: '145px', borderRadius: '16px' };
  if (size === 'small') {
    dimensions = { width: '84px', height: '56px', borderRadius: '10px' };
  } else if (size === 'medium') {
    dimensions = { width: '150px', height: '100px', borderRadius: '12px' };
  }

  const isLarge = size === 'large';

  return (
    <>
      <div 
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          position: 'relative',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          onClick={() => setShowModal(true)}
          style={{
            position: 'relative',
            width: dimensions.width,
            height: dimensions.height,
            borderRadius: dimensions.borderRadius,
            overflow: 'hidden',
            border: isHovered ? '2px solid #38bdf8' : '2px solid var(--primary)',
            boxShadow: isHovered 
              ? '0 12px 30px rgba(14, 165, 233, 0.45)' 
              : '0 6px 20px rgba(0, 0, 0, 0.4)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease',
            transform: isHovered ? 'scale(1.04) translateY(-2px)' : 'scale(1)',
            cursor: 'pointer',
            background: 'rgba(15, 23, 42, 0.6)'
          }}
          title={`Click to view full photo of ${meta.name}`}
        >
          <img
            src={imgSrc}
            alt={name || 'Destination'}
            onError={handleError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.4s ease',
              transform: isHovered ? 'scale(1.08)' : 'scale(1)'
            }}
          />
          
          {/* Subtle dark gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: isLarge 
              ? 'linear-gradient(to top, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.1) 45%, transparent 100%)'
              : 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
            pointerEvents: 'none'
          }} />

          {/* Large showcase badges on bottom */}
          {isLarge ? (
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '8px',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              pointerEvents: 'none'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                📍 {meta.name}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: '500' }}>
                {meta.state}
              </span>
            </div>
          ) : (
            <span style={{
              position: 'absolute',
              bottom: '4px',
              right: '6px',
              fontSize: '11px',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))'
            }}>
              📍
            </span>
          )}

          {/* Quick Enlarge Hint on Hover */}
          {isLarge && isHovered && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              color: '#fff',
              fontSize: '0.7rem',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              🔍 Click to enlarge
            </div>
          )}
        </div>

        {/* Small subtitle tag below large image */}
        {isLarge && (
          <div style={{ 
            marginTop: '0.4rem', 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)', 
            textAlign: 'right',
            maxWidth: '230px'
          }}>
            {meta.tagline}
          </div>
        )}
      </div>

      {/* Full Size Modal Preview when clicked */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '750px',
              width: '100%',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxHeight: '480px', overflow: 'hidden' }}>
              <img 
                src={imgSrc} 
                alt={meta.name} 
                style={{ width: '100%', height: '100%', maxHeight: '480px', objectFit: 'cover' }} 
              />
              <button
                onClick={() => setShowModal(false)}
                style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'rgba(0,0,0,0.7)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#fff' }}>📍 {meta.name}, {meta.state}</h3>
                <p style={{ margin: '0.3rem 0 0 0', color: 'var(--primary)', fontSize: '0.95rem' }}>{meta.tagline}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="btn btn-secondary glass" 
                style={{ padding: '0.5rem 1.2rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
