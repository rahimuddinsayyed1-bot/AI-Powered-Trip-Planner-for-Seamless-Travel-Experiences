"use client";
import React, { useState, useEffect, Fragment } from 'react';
import { useAuth } from '../components/AuthProvider';

export default function BookedTripsPage() {
  const { user } = useAuth();
  const [bookedTrips, setBookedTrips] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    fetch('http://localhost:8000/api/booked-trips')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.data) {
          setBookedTrips(data.data);
          if (data.recently_booked_accuracy) {
            setAccuracy(data.recently_booked_accuracy);
          }
        } else {
          setError(data.error || 'Failed to fetch booked trips.');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to connect to backend.');
        setLoading(false);
      });
  }, []);

  const groupsArray = [];
  const groupMap = {};
  for (const row of bookedTrips) {
    if (!groupMap[row.Group_ID]) {
      const newGroup = {
        bookingTime: row.Booking_Time,
        groupId: row.Group_ID,
        destination: row.Preferred_Destination,
        travelers: []
      };
      groupMap[row.Group_ID] = newGroup;
      groupsArray.push(newGroup);
    }
    groupMap[row.Group_ID].travelers.push(row);
  }

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

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
      
      <main className="container animate-fade-in" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <h1 style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>
          {user?.role === 'admin' ? 'All Booked Trips' : 'Trip Booked Session'}
        </h1>

        <div className="card glass" style={{ overflowX: 'auto', padding: '2rem', backdropFilter: 'blur(16px)', background: 'rgba(15, 23, 42, 0.75)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', margin: 0 }}>
              Recent Bookings
            </h2>
            {accuracy && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                <span style={{ color: '#cbd5e1', marginRight: '0.5rem' }}>Recently Booked Dataset Accuracy:</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>{accuracy}</span>
              </div>
            )}
          </div>
          
          {loading ? (
            <p style={{ textAlign: 'center', color: '#cbd5e1' }}>Loading booked trips...</p>
          ) : error ? (
            <p style={{ textAlign: 'center', color: '#ef4444' }}>{error}</p>
          ) : groupsArray.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px', fontSize: '1.1rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Time Booked</th>
                  <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Group ID</th>
                  <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Destination</th>
                  <th style={{ padding: '1rem', color: 'var(--primary)', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupsArray.map((group, idx) => (
                  <Fragment key={idx}>
                    <tr style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background-color 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => toggleGroup(group.groupId)}
                    >
                      <td style={{ padding: '1rem', color: '#cbd5e1' }}>{group.bookingTime}</td>
                      <td style={{ padding: '1rem', color: '#cbd5e1' }}>{group.groupId}</td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: '#fff' }}>
                        {group.destination}{group.destination.toLowerCase().includes('india') ? '' : ', India'}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--secondary)', fontWeight: 'bold' }}>
                        {expandedGroups[group.groupId] ? '▼ Hide Details' : `▶ View Details (${group.travelers.length})`}
                      </td>
                    </tr>
                    {expandedGroups[group.groupId] && (
                      <tr>
                        <td colSpan="4" style={{ padding: '1rem 2rem', backgroundColor: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: '#cbd5e1' }}>Travelers in {group.groupId}</h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Traveler ID</th>
                                <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Age Group</th>
                                <th style={{ padding: '0.5rem', color: '#94a3b8' }}>Preferences</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.travelers.map((t, tIdx) => (
                                <tr key={tIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <td style={{ padding: '0.5rem', color: '#cbd5e1' }}>{t.Traveler_ID}</td>
                                  <td style={{ padding: '0.5rem', color: '#cbd5e1' }}>{t.Age_Group || 'N/A'}</td>
                                  <td style={{ padding: '0.5rem', color: '#cbd5e1' }}>{[t.Interest_1, t.Interest_2, t.Interest_3].filter(Boolean).join(', ') || 'None'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#cbd5e1' }}>
              <p>No trips have been booked yet. When users book a trip, it will appear here at the top.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
