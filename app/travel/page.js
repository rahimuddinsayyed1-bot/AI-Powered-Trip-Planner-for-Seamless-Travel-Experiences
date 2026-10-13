"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SatisfactionChart from '../components/SatisfactionChart';
import DestinationThumbnail from '../components/DestinationThumbnail';

export default function TravelPage() {
  const router = useRouter();
  const [numUsers, setNumUsers] = useState('');
  const [showForms, setShowForms] = useState(false);
  const [userDescriptions, setUserDescriptions] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('full');

  const handleSetUsers = (e) => {
    e.preventDefault();
    const count = parseInt(numUsers);
    if (count > 0 && count <= 10) {
      setUserDescriptions(Array(count).fill(''));
      setShowForms(true);
      setItinerary(null);
    }
  };

  const handleDescriptionChange = (index, value) => {
    const newDesc = [...userDescriptions];
    newDesc[index] = value;
    setUserDescriptions(newDesc);
  };

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);
    setItinerary(null);
    
    try {
      // Build request payload for backend
      const payload = {
        travelers: userDescriptions.map((desc, i) => ({
          description: desc,
        }))
      };

      const res = await fetch('http://localhost:8000/api/recommend-nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to generate recommendation. Make sure the Python backend is running.');
      }

      const data = await res.json();
      if (data.status === 'success') {
        setItinerary(data);
      } else {
        throw new Error(data.error || 'Failed to generate recommendations');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container animate-fade-in" style={{ paddingTop: '4rem', paddingBottom: '4rem', minHeight: '80vh' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Group Travel Planner
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          Enter the number of travelers and tell us exactly what everyone wants!
        </p>
      </div>

      {!showForms ? (
        <form onSubmit={handleSetUsers} className="card glass" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>How many people are traveling?</h2>
          <input 
            type="number" 
            min="1" 
            max="10" 
            value={numUsers} 
            onChange={(e) => setNumUsers(e.target.value)} 
            placeholder="e.g. 3"
            required
            className="form-control"
            style={{ fontSize: '1.5rem', textAlign: 'center', padding: '1rem', marginBottom: '1.5rem' }}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Continue</button>
        </form>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button 
            onClick={() => setShowForms(false)} 
            className="btn btn-secondary glass" 
            style={{ marginBottom: '2rem' }}
          >
            ← Change Number of Users
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {userDescriptions.map((desc, index) => (
              <div key={index} className="card glass" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--primary)' }}>
                  Traveler {index + 1}
                </h3>
                <textarea
                  value={desc}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  placeholder='Example: "I want a relaxing beach holiday. My budget is $1500 max."'
                  className="form-control"
                  rows="4"
                  required
                  style={{ width: '100%', resize: 'vertical' }}
                ></textarea>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <button 
              onClick={generateRecommendations} 
              disabled={loading || userDescriptions.some(d => d.trim() === '')}
              className="btn btn-primary" 
              style={{ fontSize: '1.2rem', padding: '1rem 2rem', width: '100%' }}
            >
              {loading ? 'Analyzing Preferences (AI)...' : 'Generate Group Travel Recommendation'}
            </button>
          </div>
          
          {error && (
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#ff5252', color: 'white', borderRadius: '8px', textAlign: 'center' }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Results Section */}
      {itinerary && itinerary.ablation && (
        <div style={{ marginTop: '4rem', paddingBottom: '4rem' }} className="animate-fade-in">
          
          {itinerary.parsed_preferences && (
            <div style={{ marginBottom: '4rem' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                Extracted Constraints (NLP Processing)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {itinerary.parsed_preferences.map((pref, i) => (
                  <div key={i} className="card glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Traveler {i+1} ({pref.user_id})</h4>
                    <div style={{ fontSize: '0.85rem' }}>
                      <p><strong>Budget:</strong> {pref.hard_constraints?.max_budget ? `₹${pref.hard_constraints.max_budget}` : 'Unlimited'}</p>
                      <p><strong>Max Travel Time:</strong> {pref.hard_constraints?.max_travel_time_hours || 'Unlimited'} hours</p>
                      <p><strong>Hotel Preference:</strong> {pref.soft_constraints?.min_hotel_rating || 'Any'}★</p>
                      <p><strong>Dest Types:</strong> {(pref.soft_constraints?.preferred_destination_types && pref.soft_constraints.preferred_destination_types.length > 0) ? pref.soft_constraints.preferred_destination_types.join(', ') : 'Any'}</p>
                      <p><strong>Activities:</strong> {(pref.soft_constraints?.preferred_activities && pref.soft_constraints.preferred_activities.length > 0) ? pref.soft_constraints.preferred_activities.join(', ') : 'Any'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Ablation Analysis: How the Models Refine Recommendations
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            {['baseline', 'hgat', 'fuzzy', 'full'].map((tabKey) => (
              <button 
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`btn ${activeTab === tabKey ? 'btn-primary' : 'btn-secondary glass'}`}
                style={{ padding: '0.8rem 1.5rem', fontWeight: activeTab === tabKey ? 'bold' : 'normal' }}
              >
                {tabKey === 'baseline' && '1. Baseline (Standard CF)'}
                {tabKey === 'hgat' && '2. LLM + HGAT'}
                {tabKey === 'fuzzy' && '3. LLM + HGAT + Fuzzy'}
                {tabKey === 'full' && '4. Full Model (Nash)'}
              </button>
            ))}
          </div>

          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {(() => {
              const pkg = itinerary.ablation[activeTab];
              
              if (!pkg) {
                return (
                  <div className="card glass" style={{ padding: '2rem', textAlign: 'center', color: '#ff5252' }}>
                    <h3>No package found! Constraints were too strict.</h3>
                  </div>
                );
              }

              return (
                <div className="card glass" style={{ borderTop: activeTab === 'full' ? '4px solid var(--primary)' : 'none', padding: '2.5rem' }}>
                  
                  {/* Header Row: Title on Left and Large Image in Right-most Corner */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    flexWrap: 'wrap', 
                    gap: '1.5rem',
                    marginBottom: '1.2rem' 
                  }}>
                    {/* Left: Badge & Destination Name */}
                    <div style={{ flex: '1 1 300px' }}>
                      {activeTab === 'full' && (
                        <div style={{ 
                          background: 'var(--primary)', 
                          color: '#fff', 
                          padding: '0.4rem 1.2rem', 
                          borderRadius: '1rem', 
                          display: 'inline-block', 
                          marginBottom: '1.2rem', 
                          fontSize: '0.9rem', 
                          fontWeight: 'bold',
                          boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)'
                        }}>
                          🏆 Optimal Fair Package (GRec_Tr-LLM)
                        </div>
                      )}
                      
                      <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text)', fontSize: '2.4rem', lineHeight: 1.2 }}>
                        Destination: <span style={{ color: 'var(--primary)' }}>{pkg.name}</span>
                      </h2>
                    </div>

                    {/* Right-most Corner: Large Showcase Destination Image */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                      <DestinationThumbnail key={pkg.name} name={pkg.name} size="large" />
                    </div>
                  </div>

                  {activeTab === 'baseline' ? (
                    <div style={{ marginTop: '2rem' }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                        Note: The baseline ignores fuzzy logic and HGAT exploration, picking purely average historical destinations based on basic collaborative filtering.
                      </p>
                      {pkg.member_utilities && (
                        <SatisfactionChart memberUtilities={pkg.member_utilities} />
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: '2rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Hotel Accommodation</div>
                          <div style={{ fontWeight: '500', fontSize: '1.1rem' }}>🏨 {typeof pkg.hotel === 'string' ? pkg.hotel : (pkg.hotel?.name || 'N/A')} <span style={{ color: '#ffb300' }}>({pkg.hotel_rating || pkg.hotel?.rating || 'N/A'}★)</span></div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Flight</div>
                          <div style={{ fontWeight: '500', fontSize: '1.1rem' }}>✈️ ₹{Math.round(pkg.flight_cost || 0)} ({pkg.flight_time}h)</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cost Per Traveler</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--text)' }}>₹{Math.round(pkg.total_cost || pkg.package_total_cost || 0)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Group Cost</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--primary)' }}>₹{Math.round((pkg.total_cost || pkg.package_total_cost || 0) * (itinerary.parsed_preferences?.length || 1))}</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '2.5rem' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Activities Included</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                          {pkg.activities?.map((act, i) => (
                            <span key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.9rem' }}>
                              🎯 {typeof act === 'string' ? act : act.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>HGAT Prediction</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{pkg.avg_hgat ? pkg.avg_hgat.toFixed(2) : '0.00'} / 5.0</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nash Fairness</div>
                          <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{pkg.norm_nash ? pkg.norm_nash.toFixed(4) : (pkg.nash_score ? pkg.nash_score.toFixed(4) : 'N/A')}</div>
                        </div>
                      </div>
                      
                      {pkg.member_utilities && (
                        <SatisfactionChart memberUtilities={pkg.member_utilities} />
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}
