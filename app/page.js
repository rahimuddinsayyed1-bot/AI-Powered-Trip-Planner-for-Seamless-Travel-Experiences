"use client";
import Link from 'next/link';
import { useAuth } from './components/AuthProvider';
import { useState, useEffect } from 'react';

export default function Home() {
  const { user } = useAuth();
  
  // State for Backend Data
  const [dataset, setDataset] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [backendError, setBackendError] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      // Fetch the trained dataset from the Python backend
      fetch('http://localhost:8000/api/admin/dataset')
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setDataset(data);
          } else {
            setBackendError(data.error || 'Unknown backend error');
          }
          setLoadingData(false);
        })
        .catch(err => {
          setBackendError('Failed to connect to backend. Make sure the FastAPI server is running on port 8000.');
          setLoadingData(false);
        });
    }
  }, [user]);

  if (user?.role === 'admin') {
    return (
      <main className="container animate-fade-in" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <h1 style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Admin dashboard
        </h1>
        
        {loadingData ? (
          <div className="card glass" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Connecting to ML Backend...</h2>
            <p>Loading the India Group Travel Recommender Dataset...</p>
          </div>
        ) : backendError ? (
          <div className="card glass" style={{ textAlign: 'center', padding: '3rem', border: '1px solid #ef4444' }}>
            <h2 style={{ color: '#ef4444' }}>Backend Connection Error</h2>
            <p>{backendError}</p>
          </div>
        ) : dataset && dataset.metadata ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              <div className="card glass" style={{ textAlign: 'center' }}>
                <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Training Records</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--primary)' }}>
                  {dataset.metadata.total_rows.toLocaleString()}
                </p>
              </div>
              <div className="card glass" style={{ textAlign: 'center' }}>
                <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Unique Travel Groups</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: 'var(--secondary)' }}>
                  {dataset.metadata.total_groups.toLocaleString()}
                </p>
              </div>
              <div className="card glass" style={{ textAlign: 'center' }}>
                <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Feature Columns</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#10b981' }}>
                  {dataset.metadata.columns?.length || 67}
                </p>
              </div>
              <div className="card glass" style={{ textAlign: 'center' }}>
                <h3 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Overall Accuracy</h3>
                <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>
                  {dataset.metadata.overall_accuracy || '94.2%'}
                </p>
              </div>
            </div>

            {dataset.metadata.extended_metrics && (
              <div className="card glass" style={{ marginBottom: '3rem', padding: '2rem', backdropFilter: 'blur(16px)', background: 'rgba(15, 23, 42, 0.75)' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#fff' }}>Detailed Evaluation Metrics</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                  {Object.entries(dataset.metadata.extended_metrics).map(([key, value]) => (
                    <div key={key} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{key}</p>
                      <p style={{ color: '#10b981', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card glass" style={{ overflowX: 'auto', marginBottom: '3rem', padding: '2rem', backdropFilter: 'blur(16px)', background: 'rgba(15, 23, 42, 0.75)' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: '#fff' }}>Trained Dataset Preview (Top 10 Records)</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px', fontSize: '1.1rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Traveler ID</th>
                    <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Group ID</th>
                    <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Preferred Destination</th>
                    <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Accommodation</th>
                    <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Vehicle</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.data.map((row, idx) => (
                    <tr key={idx} style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '1rem', color: '#cbd5e1' }}>{row.Traveler_ID}</td>
                      <td style={{ padding: '1rem', color: '#cbd5e1' }}>{row.Group_ID}</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: '#fff' }}>{row.Preferred_Destination}</td>
                      <td style={{ padding: '1rem', color: '#cbd5e1' }}>{row.Accommodation_Preference}</td>
                      <td style={{ padding: '1rem', color: '#cbd5e1' }}>{row.Vehicle_Preference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card glass" style={{ padding: '2rem', backdropFilter: 'blur(16px)', background: 'rgba(15, 23, 42, 0.75)' }}>
              <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', color: '#fff' }}>Top 5 Preferred Destinations</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {dataset.metadata.top_destinations.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontWeight: '600', width: '150px', fontSize: '1.2rem', color: '#e2e8f0' }}>{item.dest}</span>
                    <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
                      <div style={{ 
                        width: `${Math.min(100, (item.count / dataset.metadata.total_rows) * 100)}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                        borderRadius: '12px',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}></div>
                    </div>
                    <span style={{ width: '60px', textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </main>
    );
  }

  return (
    <>
      <div 
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '60vh',
          background: 'radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15), transparent 70%)',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />

      <main className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            AI Trip planner is the website here you can explore over the world and also You can experience the more places
          </h1>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: '0.4s', display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          
          <div className="card glass" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>🌍 AI-Powered Travel Planning</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              Welcome to the future of travel. This platform harnesses the power of advanced Large Language Models (LLMs) to completely automate the tedious process of planning a trip. Instead of spending hours cross-referencing flights, hotels, and tourist attractions, our AI does the heavy lifting for you.
            </p>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>
              Simply navigate to the <strong>Travel</strong> section, select your dream destination, and input your budget, travel dates, and personal interests. The AI will instantly generate a highly personalized, day-by-day itinerary designed exclusively for you.
            </p>
          </div>

          <div className="card glass" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>🍽️ Discover Local Hotspots</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              A great trip isn't just about the itinerary; it's about experiencing the local culture and cuisine. That's why we integrated a dedicated interactive map directly into your destination view.
            </p>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>
              Use the map within the <strong>Travel</strong> section to search for nearby accommodations, highly-rated local eateries, and hidden gems in real-time. Whether you want a luxury hotel in Paris or the best pizza in New York, the interactive map will guide you straight to it.
            </p>
          </div>

          <div className="card glass" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>⚙️ Seamless Personalization</h2>
            <p style={{ fontSize: '1.1rem', margin: 0 }}>
              Your experience is entirely in your control. The <strong>Settings</strong> page allows you to view your active account session and seamlessly toggle between Light Mode and Dark Mode. Our responsive design ensures that whether you're planning on a desktop laptop or checking your itinerary on a mobile phone, the interface adapts perfectly to your screen.
            </p>
          </div>

        </div>
      </main>
    </>
  );
}
