"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

export default function Navbar() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { user } = useAuth();

  const navItems = user?.role === 'admin' 
    ? [
        { name: 'Dashboard', path: '/', icon: '📊' },
        { name: 'Settings', path: '/settings', icon: '⚙️' },
      ]
    : [
        { name: 'Home', path: '/', icon: '🏠' },
        { name: 'Travel', path: '/travel', icon: '✈️' },
        { name: 'Settings', path: '/settings', icon: '⚙️' },
      ];

  if (isMobile) {
    return (
      <nav className="mobile-nav glass">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path} className={`nav-item ${pathname === item.path ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.name}</span>
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="desktop-nav glass">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" className="logo">
          <span style={{ fontSize: '1.5rem', fontWeight: 700, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Trip Planner
          </span>
        </Link>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} className={`desktop-nav-item ${pathname === item.path ? 'active' : ''}`}>
              <span className="nav-icon" style={{ marginRight: '0.5rem' }}>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
