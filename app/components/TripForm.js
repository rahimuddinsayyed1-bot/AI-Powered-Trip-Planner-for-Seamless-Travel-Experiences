"use client";

import { useState, useEffect } from 'react';

const PREFERENCES_LIST = [
  'Historical Sites', 'Fine Dining', 'Adventure', 
  'Relaxing Beach', 'Nightlife', 'Nature & Hiking', 
  'Shopping', 'Cultural Events'
];

const getCurrencySymbol = (destination) => {
  if (!destination) return '$';
  const dest = destination.toLowerCase();
  if (dest.includes('japan')) return '¥';
  if (dest.includes('india')) return '₹';
  if (dest.includes('france') || dest.includes('italy') || dest.includes('greece')) return '€';
  if (dest.includes('switzerland')) return 'CHF';
  if (dest.includes('egypt')) return 'E£';
  if (dest.includes('thailand')) return '฿';
  if (dest.includes('brazil')) return 'R$';
  if (dest.includes('south africa')) return 'R';
  return '$'; // default
};

export default function TripForm({ defaultDestination = '' }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    budget: '',
    days: 3,
    travelers: 1,
  });
  
  // Array to hold individual traveler objects: { id, destination, preferences: [] }
  const [travelerDetails, setTravelerDetails] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [winningDestination, setWinningDestination] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Initialize traveler details when step changes to 2
  useEffect(() => {
    if (step === 2 && formData.travelers) {
      const details = [];
      for (let i = 0; i < formData.travelers; i++) {
        details.push({
          id: i + 1,
          destination: defaultDestination, // Default to the page's destination
          ageGroup: '',
          preferences: []
        });
      }
      setTravelerDetails(details);
    }
  }, [step, formData.travelers, defaultDestination]);

  const currencySymbol = getCurrencySymbol(winningDestination || defaultDestination);

  const toggleTravelerPreference = (travelerIndex, pref) => {
    const newDetails = [...travelerDetails];
    const currentPrefs = newDetails[travelerIndex].preferences;
    
    if (currentPrefs.includes(pref)) {
      newDetails[travelerIndex].preferences = currentPrefs.filter(p => p !== pref);
    } else {
      if (currentPrefs.length < 3) {
        newDetails[travelerIndex].preferences = [...currentPrefs, pref];
      }
    }
    setTravelerDetails(newDetails);
  };

  const updateTravelerDestination = (travelerIndex, dest) => {
    const newDetails = [...travelerDetails];
    newDetails[travelerIndex].destination = dest;
    setTravelerDetails(newDetails);
  };

  const updateTravelerAgeGroup = (travelerIndex, ageGroup) => {
    const newDetails = [...travelerDetails];
    newDetails[travelerIndex].ageGroup = ageGroup;
    setTravelerDetails(newDetails);
  };

  const handleRecommendSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setItinerary(null);
    setBookingSuccess(false);
    
    try {
      // Ensure all travelers have at least a fallback preference if they selected none
      const processedTravelers = travelerDetails.map(t => ({
        destination: t.destination || defaultDestination || 'India',
        ageGroup: t.ageGroup || '26-35',
        preferences: t.preferences.length > 0 ? t.preferences : ['general tourism']
      }));

      const payload = {
        budget: parseFloat(formData.budget),
        days: formData.days,
        travelers: processedTravelers
      };

      const res = await fetch(`http://localhost:8000/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Backend API Error");

      setWinningDestination(data.winning_destination);
      setItinerary(data.packages);
      setStep(3); // Show results
    } catch (err) {
      console.error(err);
      alert('Failed to generate trip packages from the AI ML backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookPackage = async (pkg) => {
    if (!confirm(`Are you sure you want to book this package for ${currencySymbol}${pkg.total_cost.toFixed(2)}?`)) return;
    
    setLoading(true);
    try {
      const processedTravelers = travelerDetails.map(t => ({
        destination: t.destination || defaultDestination || 'India',
        ageGroup: t.ageGroup || '26-35',
        preferences: t.preferences.length > 0 ? t.preferences : ['general tourism']
      }));

      const payload = {
        package: pkg,
        winning_destination: winningDestination,
        travelers: processedTravelers
      };

      const res = await fetch(`http://localhost:8000/api/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Backend API Error");

      setBookingSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save booking to database.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Base Details
  if (step === 1) {
    return (
      <div className="card animate-fade-in glass" style={{ marginTop: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Plan Your Group Trip</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>Step 1 of 2: Group Basics</p>
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="grid-2">
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Group Budget (Total)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                  {currencySymbol}
                </span>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="2000" 
                  value={formData.budget}
                  onChange={(e) => setFormData({...formData, budget: e.target.value})}
                  style={{ paddingLeft: '2.5rem' }}
                  required
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Number of Days</label>
              <input 
                type="number" 
                className="input-field" 
                min="1" max="30" 
                value={formData.days}
                onChange={(e) => setFormData({...formData, days: e.target.value === '' ? '' : parseInt(e.target.value)})}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Number of Travelers</label>
            <input 
              type="number" 
              className="input-field" 
              min="1" max="20"
              value={formData.travelers}
              onChange={(e) => setFormData({...formData, travelers: e.target.value === '' ? '' : parseInt(e.target.value)})}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
            Next: Individual Preferences
          </button>
        </form>
      </div>
    );
  }

  // Step 2: Individual Traveler Input
  if (step === 2) {
    return (
      <div className="card animate-fade-in glass" style={{ marginTop: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Individual Traveler Voting</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Step 2 of 2: Each person can vote for a different destination! The AI will calculate the winning destination based on group priority.
        </p>
        
        <form onSubmit={handleRecommendSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {travelerDetails.map((traveler, index) => (
            <div key={index} style={{ padding: '1.5rem', background: 'var(--bg-input)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Traveler {index + 1}</h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Preferred Destination</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Goa, India" 
                  value={traveler.destination}
                  onChange={(e) => updateTravelerDestination(index, e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Age Group</label>
                <select 
                  className="input-field" 
                  value={traveler.ageGroup}
                  onChange={(e) => updateTravelerAgeGroup(index, e.target.value)}
                  required
                  style={{ cursor: 'pointer', appearance: 'auto' }}
                >
                  <option value="" disabled>Select Age Group</option>
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-44">35-44</option>
                  <option value="45-54">45-54</option>
                  <option value="55-64">55-64</option>
                  <option value="65+">65+</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: 500 }}>Interests (Up to 3)</label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {PREFERENCES_LIST.map(pref => {
                    const isSelected = traveler.preferences.includes(pref);
                    const isDisabled = !isSelected && traveler.preferences.length >= 3;
                    return (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => toggleTravelerPreference(index, pref)}
                        disabled={isDisabled}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '999px',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                          background: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                          color: isSelected ? 'var(--primary)' : (isDisabled ? 'var(--text-muted)' : 'var(--text-main)'),
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: isDisabled ? 0.5 : 1
                        }}
                      >
                        {pref}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary glass" style={{ flex: 1, padding: '1rem' }}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2, fontSize: '1.1rem', padding: '1rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'AI is calculating winning destination & packages...' : 'Generate Group Packages ✨'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Step 3: Results & Booking
  if (step === 3 && itinerary && Array.isArray(itinerary)) {
    if (bookingSuccess) {
      return (
        <div className="card animate-fade-in glass" style={{ marginTop: '2rem', textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 style={{ fontSize: '2rem', color: '#10b981', marginBottom: '1rem' }}>🎉 Booking Confirmed!</h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
            Your group trip to <strong>{winningDestination}</strong> has been successfully booked. 
            The data has been saved to the Admin Dataset.
          </p>
          <button onClick={() => { setStep(1); setBookingSuccess(false); setItinerary(null); }} className="btn btn-primary">
            Plan Another Trip
          </button>
        </div>
      );
    }

    return (
      <div className="card animate-fade-in glass" style={{ marginTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem', background: 'rgba(14, 165, 233, 0.1)', padding: '2rem', borderRadius: 'var(--border-radius-sm)', border: '1px dashed var(--primary)' }}>
          <h3 style={{ color: 'var(--text-muted)', margin: 0 }}>Winner of Group Vote</h3>
          <h1 style={{ margin: '0.5rem 0', fontSize: '2.5rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {winningDestination}
          </h1>
          <p>Based on your {formData.travelers} travelers' highest priorities, the AI has selected <strong>{winningDestination}</strong> as the optimal group destination.</p>
        </div>
        
        <h2 style={{ marginBottom: '1.5rem' }}>Top ML Package Deals</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {itinerary.map((pkg, idx) => (
            <div key={idx} style={{ 
              padding: '1.5rem', 
              background: 'var(--bg-input)', 
              borderRadius: 'var(--border-radius-sm)', 
              border: '1px solid var(--border-color)',
              boxShadow: idx === 0 ? '0 0 15px rgba(14, 165, 233, 0.3)' : 'none',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {idx === 0 && (
                <span style={{ position: 'absolute', top: '-12px', right: '1rem', background: 'var(--primary)', color: '#fff', padding: '0.2rem 1rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Highest Group Utility ⭐
                </span>
              )}
              <h3 style={{ marginBottom: '1rem', fontSize: '1.3rem' }}>Package Option #{idx + 1}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Hotel Accommodation</p>
                  <p style={{ fontWeight: 600 }}>🏨 {pkg.hotel} <span style={{color:'gold'}}>{pkg.hotel_rating > 0 ? `(${pkg.hotel_rating}★)` : ''}</span></p>
                </div>
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Total Group Cost</p>
                  <p style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.2rem' }}>{currencySymbol}{pkg.total_cost.toFixed(2)}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Activities Included</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {pkg.activities.map((act, i) => (
                    <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.8rem', borderRadius: '1rem', fontSize: '0.85rem' }}>🎯 {act}</span>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
                <span><strong>ML Score:</strong> {(pkg.final_score * 100).toFixed(1)}%</span>
                <span><strong>Nash Fairness:</strong> {(pkg.norm_nash * 100).toFixed(1)}%</span>
                <span><strong>GNN Score:</strong> {(pkg.avg_hgat / 5.0 * 100).toFixed(1)}%</span>
              </div>
              
              <button 
                onClick={() => handleBookPackage(pkg)} 
                className="btn btn-primary" 
                disabled={loading}
                style={{ width: '100%', fontWeight: 'bold' }}
              >
                {loading ? 'Booking...' : 'Book This Package ➔'}
              </button>
            </div>
          ))}
        </div>
        
        <button onClick={() => setStep(2)} className="btn btn-secondary glass" style={{ marginTop: '2rem', width: '100%' }}>
          Re-vote Destinations
        </button>
      </div>
    );
  }

  return null;
}
