// Mapping and helper utilities for destination images

export const DESTINATION_METADATA = {
  agra: { name: 'Agra', state: 'Uttar Pradesh', tagline: 'City of the Taj Mahal' },
  ajanta_ellora: { name: 'Ajanta & Ellora', state: 'Maharashtra', tagline: 'Ancient Rock-Cut Caves' },
  amritsar: { name: 'Amritsar', state: 'Punjab', tagline: 'The Golden Temple City' },
  andaman: { name: 'Andaman & Nicobar', state: 'Union Territory', tagline: 'Tropical Island Paradise' },
  bengaluru: { name: 'Bengaluru', state: 'Karnataka', tagline: 'Silicon Valley of India' },
  bodh_gaya: { name: 'Bodh Gaya', state: 'Bihar', tagline: 'Sacred Buddhist Pilgrimage' },
  chennai: { name: 'Chennai', state: 'Tamil Nadu', tagline: 'Cultural Gateway of the South' },
  coorg: { name: 'Coorg', state: 'Karnataka', tagline: 'Scotland of India' },
  darjeeling: { name: 'Darjeeling', state: 'West Bengal', tagline: 'Queen of the Hills' },
  delhi: { name: 'Delhi', state: 'Delhi NCR', tagline: 'Historic Capital City' },
  goa: { name: 'Goa', state: 'Goa', tagline: 'Beaches, Culture & Sunshine' },
  gokarna: { name: 'Gokarna', state: 'Karnataka', tagline: 'Pristine Beaches & Temples' },
  hampi: { name: 'Hampi', state: 'Karnataka', tagline: 'Ruins of Vijayanagara Empire' },
  hyderabad: { name: 'Hyderabad', state: 'Telangana', tagline: 'City of Pearls & Charminar' },
  jaipur: { name: 'Jaipur', state: 'Rajasthan', tagline: 'The Majestic Pink City' },
  jaisalmer: { name: 'Jaisalmer', state: 'Rajasthan', tagline: 'The Golden City in the Thar' },
  jim_corbett: { name: 'Jim Corbett', state: 'Uttarakhand', tagline: 'Wild Tiger Safari & Nature' },
  jodhpur: { name: 'Jodhpur', state: 'Rajasthan', tagline: 'The Enchanting Blue City' },
  kaziranga: { name: 'Kaziranga', state: 'Assam', tagline: 'Home of the One-Horned Rhino' },
  kerala: { name: 'Kerala', state: 'Kerala', tagline: "God's Own Country & Backwaters" },
  khajuraho: { name: 'Khajuraho', state: 'Madhya Pradesh', tagline: 'Intricate Temple Architecture' },
  kodaikanal: { name: 'Kodaikanal', state: 'Tamil Nadu', tagline: 'Princess of Hill Stations' },
  kolkata: { name: 'Kolkata', state: 'West Bengal', tagline: 'City of Joy & Heritage' },
  kutch: { name: 'Kutch', state: 'Gujarat', tagline: 'Land of Art & White Desert' },
  lakshadweep: { name: 'Lakshadweep', state: 'Union Territory', tagline: 'Crystal Coral Atolls' },
  leh: { name: 'Leh Ladakh', state: 'Ladakh', tagline: 'High Passes & Moonscapes' },
  madhya_pradesh: { name: 'Madhya Pradesh', state: 'Central India', tagline: 'The Heart of Incredible India' },
  madurai: { name: 'Madurai', state: 'Tamil Nadu', tagline: 'Meenakshi Amman City' },
  mahabaleshwar: { name: 'Mahabaleshwar', state: 'Maharashtra', tagline: 'Scenic Strawberry Hills' },
  manali: { name: 'Manali', state: 'Himachal Pradesh', tagline: 'Valley of the Gods' },
  meghalaya: { name: 'Meghalaya', state: 'Meghalaya', tagline: 'Abode of the Clouds' },
  mumbai: { name: 'Mumbai', state: 'Maharashtra', tagline: 'The City of Dreams' },
  munnar: { name: 'Munnar', state: 'Kerala', tagline: 'Verdant Rolling Tea Hills' },
  mysuru: { name: 'Mysuru', state: 'Karnataka', tagline: 'City of Palaces & Heritage' },
  nashik: { name: 'Nashik', state: 'Maharashtra', tagline: 'Wine Capital & Holy Ghats' },
  ooty: { name: 'Ooty', state: 'Tamil Nadu', tagline: 'Blue Mountains & Nilgiri Hills' },
  pondicherry: { name: 'Pondicherry', state: 'Union Territory', tagline: 'French Quarter & Seaside' },
  puri: { name: 'Puri', state: 'Odisha', tagline: 'Jagannath Spiritual Beach' },
  rajasthan: { name: 'Rajasthan', state: 'Rajasthan', tagline: 'Land of Kings & Forts' },
  rann_of_Kutch: { name: 'Rann of Kutch', state: 'Gujarat', tagline: 'Vast White Salt Desert' },
  ranthambore: { name: 'Ranthambore', state: 'Rajasthan', tagline: 'Tiger Reserve & Royal Ruins' },
  rishikesh: { name: 'Rishikesh', state: 'Uttarakhand', tagline: 'Yoga Capital & River Ganges' },
  shimla: { name: 'Shimla', state: 'Himachal Pradesh', tagline: 'Colonial Hill Station Retreat' },
  sikkim: { name: 'Sikkim', state: 'Sikkim', tagline: 'Himalayan Peaks & Monasteries' },
  srinagar: { name: 'Srinagar', state: 'Jammu & Kashmir', tagline: 'Dal Lake & Paradise on Earth' },
  tawang: { name: 'Tawang', state: 'Arunachal Pradesh', tagline: 'Monastery & Mystic Mountains' },
  udaipur: { name: 'Udaipur', state: 'Rajasthan', tagline: 'The City of Lakes' },
  varanasi: { name: 'Varanasi', state: 'Uttar Pradesh', tagline: 'Timeless Spiritual Ghats' },
  visakhapatnam: { name: 'Visakhapatnam', state: 'Andhra Pradesh', tagline: 'Jewel of the East Coast' },
  wayanad: { name: 'Wayanad', state: 'Kerala', tagline: 'Lush Forests & Waterfalls' }
};

export function normalizeDestSlug(name) {
  if (!name) return 'goa';
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9_]/g, '');
}

export function getDestinationImageUrl(destName) {
  if (!destName) return '/bg-travel.jpg';
  const slug = normalizeDestSlug(destName);
  return `/destinations/${slug}.jpg`;
}

export function getDestinationMeta(destName) {
  const slug = normalizeDestSlug(destName);
  return DESTINATION_METADATA[slug] || {
    name: destName,
    state: 'India',
    tagline: 'Incredible Travel Destination'
  };
}
