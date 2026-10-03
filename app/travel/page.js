"use client";

import { useState, useEffect } from 'react';
import TripForm from '../components/TripForm';

const COUNTRIES = [
  { name: 'Agra, India', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800', description: 'Home to the iconic Taj Mahal, a mausoleum built for the Mughal ruler Shah Jahan’s wife, Mumtaz Mahal.' },
  { name: 'New Delhi, India', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', description: 'The capital of India, known for its historic monuments, bustling markets, and grand government buildings.' },
  { name: 'Goa, India', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800', description: 'A state in western India with coastlines stretching along the Arabian Sea, famous for its beaches and nightlife.' },
  { name: 'Kerala, India', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800', description: 'A state on India\'s tropical Malabar Coast, known for its palm-lined beaches and tranquil backwaters.' },
  { name: 'Kolkata, India', image: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=800', description: 'The capital of the Indian state of West Bengal, known for its grand colonial architecture and cultural festivals.' },
  { name: 'Chennai, India', image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800', description: 'On the Bay of Bengal in eastern India, the capital of Tamil Nadu is famous for its temples and Marina Beach.' },
  { name: 'Hyderabad, India', image: 'https://images.unsplash.com/photo-1588653205731-bfb8f10255c2?w=800', description: 'The capital of southern India\'s Telangana state, known for its technology industry and historical sites like Charminar.' },
  { name: 'Bengaluru, India', image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800', description: 'The center of India\'s high-tech industry, known for its parks and nightlife.' },
  { name: 'Pune, India', image: 'https://images.unsplash.com/photo-1625501861036-7c919d45be31?w=800', description: 'A sprawling city in the western Indian state of Maharashtra, known for the Aga Khan Palace.' },
  { name: 'Amritsar, India', image: 'https://images.unsplash.com/photo-1603511116231-7bc7c26cc808?w=800', description: 'Home to the spectacular Golden Temple, the holiest gurdwara of the Sikh religion.' },
  { name: 'Rishikesh, India', image: 'https://images.unsplash.com/photo-1601058269785-5b87198bb6c3?w=800', description: 'A city in India’s northern state of Uttarakhand, in the Himalayan foothills beside the Ganges River.' },
  { name: 'Shimla, India', image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=800', description: 'The capital of the northern Indian state of Himachal Pradesh, a former British summer capital.' },
  { name: 'Darjeeling, India', image: 'https://images.unsplash.com/photo-1543477169-b1d55f569b36?w=800', description: 'A town in India\'s West Bengal state, in the Himalayan foothills, famous for its tea industry.' },
  { name: 'Manali, India', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Manali_City.jpg/960px-Manali_City.jpg', description: 'A high-altitude Himalayan resort town in India’s northern Himachal Pradesh state, known for backpacking and honeymooning.' },
  { name: 'Ooty, India', image: 'https://images.unsplash.com/photo-1615833215881-2292f3cb0752?w=800', description: 'A resort town in the Western Ghats mountains, in southern India\'s Tamil Nadu state.' },
  { name: 'Mysore, India', image: 'https://images.unsplash.com/photo-1600100397608-f010f41cb8e1?w=800', description: 'A city in India\'s southwestern Karnataka state, known for its magnificent palaces.' },
  { name: 'Hampi, India', image: 'https://images.unsplash.com/photo-1600096194534-95cf5ece04cf?w=800', description: 'An ancient village in the south Indian state of Karnataka, dotted with numerous ruined temple complexes.' },
  { name: 'Andaman Islands, India', image: 'https://images.unsplash.com/photo-1589136195603-911d33190fc8?w=800', description: 'A vibrant archipelago in the Bay of Bengal, famous for its white-sand beaches, mangroves, and coral reefs.' },
  { name: 'Leh Ladakh, India', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Road_Padum_Zanskar_Range_Jun24_A7CR_00818.jpg/960px-Road_Padum_Zanskar_Range_Jun24_A7CR_00818.jpg', description: 'Known for its stunning mountainous landscapes, high-altitude passes, and serene Buddhist monasteries.' },
  { name: 'Pondicherry, India', image: 'https://images.unsplash.com/photo-1620021666355-6b3a0cc33db3?w=800', description: 'A charming coastal town with a strong French colonial heritage, offering tranquil beaches and ashrams.' },
  { name: 'Kochi, India', image: 'https://images.unsplash.com/photo-1601662973169-d3e9c403360f?w=800', description: 'Also known as Cochin, a vibrant city in Kerala famous for its historic spice trade and Chinese fishing nets.' },
  { name: 'Jaisalmer, India', image: 'https://images.unsplash.com/photo-1589839930773-630e6981fae6?w=800', description: 'The Golden City, known for its yellow sandstone architecture and the massive Jaisalmer Fort in the Thar Desert.' },
  { name: 'Srinagar, India', image: 'https://images.unsplash.com/photo-1609121659929-26d1bf0a2c0f?w=800', description: 'The summer capital of Jammu and Kashmir, celebrated for its serene Dal Lake, houseboats, and beautiful gardens.' },
  { name: 'Munnar, India', image: 'https://images.unsplash.com/photo-1593693397690-362cb9666c6b?w=800', description: 'A peaceful hill station in Kerala, surrounded by rolling hills dotted with tea plantations.' },
  { name: 'Khajuraho, India', image: 'https://images.unsplash.com/photo-1604928669147-195f171050e5?w=800', description: 'Famous for its group of Hindu and Jain temples adorned with intricate, centuries-old carvings.' },
  { name: 'Jaipur, India', image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80', description: 'The Pink City, known for its majestic palaces, historic forts like Amer Fort, and vibrant bazaars.' },
  { name: 'Varanasi, India', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&q=80', description: 'One of the world\'s oldest continually inhabited cities, offering a profound spiritual experience on the banks of the Ganges.' },
  { name: 'Mumbai, India', image: '/mumbai.jpg', description: 'The bustling metropolis and financial capital, home to the Gateway of India and the heart of Bollywood.' },
  { name: 'Udaipur, India', image: '/udaipur.jpg', description: 'The City of Lakes, famous for its lavish royal residences and breathtaking sunsets over Lake Pichola.' },
  { name: 'Jodhpur, India', image: 'https://images.unsplash.com/photo-1596883737604-3747bb654157?w=800', description: 'The Blue City of Rajasthan, famous for the magnificent Mehrangarh Fort towering over the city.' },
  { name: 'Gokarna, India', image: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Delight_india.jpg', description: 'A coastal town in Karnataka, known for its pristine beaches like Om Beach and Mahabaleshwar Temple.' },
  { name: 'Meghalaya, India', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Dawki_River%2C_Meghalaya%2C_India.jpg/960px-Dawki_River%2C_Meghalaya%2C_India.jpg', description: 'The abode of clouds, famous for its living root bridges, stunning waterfalls, and lush green landscapes.' },
  { name: 'Ranthambore, India', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Ranthambore_National_Park.JPG/960px-Ranthambore_National_Park.JPG', description: 'One of the largest national parks in northern India, renowned for its majestic Bengal tigers.' },
  { name: 'Auli, India', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Auli_Himalayas.jpg/960px-Auli_Himalayas.jpg', description: 'A premier ski destination in Uttarakhand, offering panoramic views of the Himalayan peaks.' },
  { name: 'Spiti Valley, India', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Spiti_River_Kaza_Himachal_Jun18_D72_7232.jpg/960px-Spiti_River_Kaza_Himachal_Jun18_D72_7232.jpg', description: 'A cold desert mountain valley in the Himalayas, famous for its stark landscapes and ancient monasteries.' }
];

export default function TravelPage() {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(9);

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedCountries = filteredCountries.slice(0, visibleCount);

  const handleImageError = async (e, countryName) => {
    const imgElement = e.target;
    if (imgElement.dataset.retried) {
      imgElement.src = '/bg-travel.jpg';
      return;
    }
    imgElement.dataset.retried = 'true';
    
    try {
      const cleanQuery = countryName.split(',')[0].trim();
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cleanQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.originalimage && data.originalimage.source) {
          imgElement.src = data.originalimage.source;
          return;
        } else if (data.thumbnail && data.thumbnail.source) {
          imgElement.src = data.thumbnail.source;
          return;
        }
      }
    } catch (err) {
      // Silently fail and fallback to default image
    }
    imgElement.src = '/bg-travel.jpg';
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (filteredCountries.length === 1) {
      handleSelectCountry(filteredCountries[0]);
    } else if (filteredCountries.length === 0 && searchQuery.trim() !== '') {
      // If it's a completely custom country not in the list, just create a mock object
      handleSelectCountry({ name: searchQuery, description: `Custom destination: ${searchQuery}` });
    }
  };

  const handleSelectCountry = async (country) => {
    setSelectedCountry(country);
    setWeatherData(null);
    setWeatherLoading(true);

    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(country.name)}&appid=${apiKey}&units=metric`);
        if (res.ok) {
          const data = await res.json();
          setWeatherData(data);
        } else {
          // Mock weather if the API key is invalid or request fails
          setWeatherData({ main: { temp: 26 }, weather: [{ main: 'Clear', description: 'sunny sky', icon: '01d' }] });
        }
      } catch (err) {
        console.error("Failed to fetch weather", err);
        setWeatherData({ main: { temp: 26 }, weather: [{ main: 'Clear', description: 'sunny sky', icon: '01d' }] });
      }
    } else {
      // Mock weather if no API key is provided
      setWeatherData({ main: { temp: 26 }, weather: [{ main: 'Clear', description: 'sunny sky', icon: '01d' }] });
    }
    setWeatherLoading(false);
  };

  const getWeatherRecommendation = (weather) => {
    if (!weather) return null;
    const condition = weather.weather[0].main.toLowerCase();
    const tempC = weather.main.temp;
    
    if (condition.includes('rain') || condition.includes('storm')) {
      return "It's currently raining. If you travel now, make sure to pack an umbrella!";
    } else if (tempC < 10) {
      return "It's quite chilly right now. Bring some warm clothes!";
    } else if (tempC > 30) {
      return "It's very hot! Perfect for beaches, but stay hydrated.";
    } else {
      return "The weather looks pleasant! A great time to visit.";
    }
  };

  if (selectedCountry) {
    // Using a generic maps embed URL so it doesn't require specific Maps Embed API activation
    // It queries for tourist attractions and restaurants in the selected location
    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent('tourist attractions and restaurants in ' + selectedCountry.name)}&t=&z=10&ie=UTF8&iwloc=&output=embed`;

    return (
      <main className="container animate-fade-in" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <button 
          onClick={() => setSelectedCountry(null)} 
          className="btn btn-secondary glass" 
          style={{ marginBottom: '1.5rem' }}
        >
          ← Back to Destinations
        </button>

        <div className="card glass" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                {selectedCountry.name}
              </h1>
              {selectedCountry.description && <p style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>{selectedCountry.description}</p>}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>

              {/* Weather Widget */}
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', minWidth: '250px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>Current Weather</h3>
                {weatherLoading ? (
                  <p style={{ margin: 0 }}>Loading weather...</p>
                ) : weatherData ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <img src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`} alt="weather icon" style={{ width: '40px', height: '40px' }} />
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.round(weatherData.main.temp)}°C</span>
                      <span style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>({weatherData.weather[0].description})</span>
                    </div>
                    <p style={{ margin: 0, marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 500 }}>
                      💡 {getWeatherRecommendation(weatherData)}
                    </p>
                  </div>
                ) : (
                  <p style={{ margin: 0, color: 'var(--secondary)' }}>Weather data unavailable.</p>
                )}
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '300px', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden' }}>
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={mapUrl}
            ></iframe>
          </div>
        </div>

        <TripForm defaultDestination={selectedCountry.name} />
      </main>
    );
  }

  return (
    <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', marginBottom: '2rem' }}>
        <h1 className="animate-fade-in">Explore the World</h1>
        <p className="animate-fade-in" style={{ fontSize: '1.25rem', marginTop: '1rem' }}>
          Search for a destination or select from our popular choices to book your personalized trip.
        </p>
      </div>

      <div className="card glass animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto 3rem auto', padding: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search for a country... (e.g. Japan)" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleCount(9); // Reset visible count on search
            }}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      <div className="grid-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {displayedCountries.map((country) => (
          <div key={country.name} className="card glass" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '200px', width: '100%', overflow: 'hidden', background: 'var(--bg-input)' }}>
              <img 
                src={country.image} 
                alt={country.name} 
                onError={(e) => handleImageError(e, country.name)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h2 style={{ marginBottom: '0.5rem' }}>{country.name}</h2>
              <p style={{ flex: 1, fontSize: '0.9rem' }}>{country.description}</p>
              
              <div style={{ display: 'flex', marginTop: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                  onClick={() => handleSelectCountry(country)}
                >
                  Book
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredCountries.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>No popular destinations found for "{searchQuery}". Hit Search to book it anyway!</p>
          </div>
        )}
      </div>

      {visibleCount < filteredCountries.length && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
          <button 
            className="btn btn-secondary glass animate-fade-in" 
            onClick={() => setVisibleCount(prev => prev + 9)}
            style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
          >
            Load More Destinations ↓
          </button>
        </div>
      )}
    </main>
  );
}
