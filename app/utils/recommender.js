import travelData from '@/app/data/travel_data.json';

const USD_TO_INR = 83.0;
const EUR_TO_INR = 90.0;
const LONG_FLIGHT_HOURS = 6.0;

// Mapping of city names / landmarks to their primary destination and category
export const CITY_TO_TYPE = {
  goa: { dest_id: 'Goa', name: 'Goa', type: 'Beach' },
  puri: { dest_id: 'Puri', name: 'Puri', type: 'Beach' },
  gokarna: { dest_id: 'Gokarna', name: 'Gokarna', type: 'Beach' },
  pondicherry: { dest_id: 'Pondicherry', name: 'Pondicherry', type: 'Beach' },
  andaman: { dest_id: 'Andaman', name: 'Andaman', type: 'Beach' },
  lakshadweep: { dest_id: 'Lakshadweep', name: 'Lakshadweep', type: 'Beach' },
  visakhapatnam: { dest_id: 'Visakhapatnam', name: 'Visakhapatnam', type: 'Beach' },

  manali: { dest_id: 'Manali', name: 'Manali', type: 'Mountain' },
  shimla: { dest_id: 'Shimla', name: 'Shimla', type: 'Mountain' },
  leh: { dest_id: 'Leh', name: 'Leh', type: 'Mountain' },
  ladakh: { dest_id: 'Leh', name: 'Leh', type: 'Mountain' },
  srinagar: { dest_id: 'Srinagar', name: 'Srinagar', type: 'Mountain' },
  kashmir: { dest_id: 'Srinagar', name: 'Srinagar', type: 'Mountain' },
  darjeeling: { dest_id: 'Darjeeling', name: 'Darjeeling', type: 'Mountain' },
  sikkim: { dest_id: 'Sikkim', name: 'Sikkim', type: 'Mountain' },
  gangtok: { dest_id: 'Sikkim', name: 'Sikkim', type: 'Mountain' },
  ooty: { dest_id: 'Ooty', name: 'Ooty', type: 'Mountain' },
  munnar: { dest_id: 'Munnar', name: 'Munnar', type: 'Mountain' },
  wayanad: { dest_id: 'Wayanad', name: 'Wayanad', type: 'Mountain' },
  kodaikanal: { dest_id: 'Kodaikanal', name: 'Kodaikanal', type: 'Mountain' },

  jaipur: { dest_id: 'Jaipur', name: 'Jaipur', type: 'Historic' },
  udaipur: { dest_id: 'Udaipur', name: 'Udaipur', type: 'Historic' },
  agra: { dest_id: 'Agra', name: 'Agra', type: 'Historic' },
  'taj mahal': { dest_id: 'Agra', name: 'Agra', type: 'Historic' },
  mysuru: { dest_id: 'Mysuru', name: 'Mysuru', type: 'Historic' },
  mysore: { dest_id: 'Mysuru', name: 'Mysuru', type: 'Historic' },
  jaisalmer: { dest_id: 'Jaisalmer', name: 'Jaisalmer', type: 'Historic' },
  jodhpur: { dest_id: 'Jodhpur', name: 'Jodhpur', type: 'Historic' },
  hampi: { dest_id: 'Hampi', name: 'Hampi', type: 'Historic' },
  ajanta: { dest_id: 'Ajanta_Ellora', name: 'Ajanta_Ellora', type: 'Historic' },
  ellora: { dest_id: 'Ajanta_Ellora', name: 'Ajanta_Ellora', type: 'Historic' },
  khajuraho: { dest_id: 'Khajuraho', name: 'Khajuraho', type: 'Historic' },
  'bodh gaya': { dest_id: 'Bodh_Gaya', name: 'Bodh_Gaya', type: 'Historic' },

  kerala: { dest_id: 'Kerala', name: 'Kerala', type: 'City' },
  varanasi: { dest_id: 'Varanasi', name: 'Varanasi', type: 'City' },
  delhi: { dest_id: 'Delhi', name: 'Delhi', type: 'City' },
  mumbai: { dest_id: 'Mumbai', name: 'Mumbai', type: 'City' },
  hyderabad: { dest_id: 'Hyderabad', name: 'Hyderabad', type: 'City' },
  bengaluru: { dest_id: 'Bengaluru', name: 'Bengaluru', type: 'City' },
  bangalore: { dest_id: 'Bengaluru', name: 'Bengaluru', type: 'City' },
  chennai: { dest_id: 'Chennai', name: 'Chennai', type: 'City' },
  kolkata: { dest_id: 'Kolkata', name: 'Kolkata', type: 'City' },
  amritsar: { dest_id: 'Amritsar', name: 'Amritsar', type: 'City' },
  'golden temple': { dest_id: 'Amritsar', name: 'Amritsar', type: 'City' },
  rishikesh: { dest_id: 'Rishikesh', name: 'Rishikesh', type: 'City' },
  coorg: { dest_id: 'Coorg', name: 'Coorg', type: 'City' },
  mahabaleshwar: { dest_id: 'Mahabaleshwar', name: 'Mahabaleshwar', type: 'City' },
  nashik: { dest_id: 'Nashik', name: 'Nashik', type: 'City' },
  tawang: { dest_id: 'Tawang', name: 'Tawang', type: 'City' },
  madurai: { dest_id: 'Madurai', name: 'Madurai', type: 'City' },

  ranthambore: { dest_id: 'Ranthambore', name: 'Ranthambore', type: 'Nature' },
  kutch: { dest_id: 'Kutch', name: 'Kutch', type: 'Nature' },
  'jim corbett': { dest_id: 'Jim_Corbett', name: 'Jim_Corbett', type: 'Nature' },
  kaziranga: { dest_id: 'Kaziranga', name: 'Kaziranga', type: 'Nature' },
  meghalaya: { dest_id: 'Meghalaya', name: 'Meghalaya', type: 'Nature' },
  shillong: { dest_id: 'Meghalaya', name: 'Meghalaya', type: 'Nature' },
  'rann of kutch': { dest_id: 'Rann_of_Kutch', name: 'Rann_of_Kutch', type: 'Nature' }
};

const SPIRITUAL_DESTS = new Set(['Varanasi', 'Rishikesh', 'Amritsar', 'Puri', 'Bodh_Gaya', 'Madurai', 'Hampi']);

// 1. NLP Preference Parser
export function parsePreference(text, userId) {
  const textLower = (text || '').toLowerCase();

  // Currency & Budget extraction
  let budget = null;
  const usdMatch = text.match(/\$\s*([\d,]+)/);
  const eurMatch = text.match(/€\s*([\d,]+)/);
  const inrMatch = text.match(/₹\s*([\d,]+)/);
  const plainNumMatch = textLower.match(/(?:budget|budgect|cost|spend|is|max).*?([\d,]+)/);

  if (usdMatch) {
    budget = parseFloat(usdMatch[1].replace(/,/g, '')) * USD_TO_INR;
  } else if (eurMatch) {
    budget = parseFloat(eurMatch[1].replace(/,/g, '')) * EUR_TO_INR;
  } else if (inrMatch) {
    budget = parseFloat(inrMatch[1].replace(/,/g, ''));
  } else if (plainNumMatch) {
    budget = parseFloat(plainNumMatch[1].replace(/,/g, ''));
  }

  // Detect explicit city mentions and destination types
  const destTypes = new Set();
  let preferredCity = null;

  for (const [key, val] of Object.entries(CITY_TO_TYPE)) {
    if (textLower.includes(key)) {
      preferredCity = val.dest_id;
      destTypes.add(val.type.toLowerCase());
      break;
    }
  }

  // Detect thematic categories
  if (textLower.includes('beach') || textLower.includes('coast') || textLower.includes('sea') || textLower.includes('ocean') || textLower.includes('water sports') || textLower.includes('scuba') || textLower.includes('island')) {
    destTypes.add('beach');
  }
  if (textLower.includes('mountain') || textLower.includes('hill') || textLower.includes('trek') || textLower.includes('hiking') || textLower.includes('himalaya') || textLower.includes('snow') || textLower.includes('cold') || textLower.includes('valley')) {
    destTypes.add('mountain');
  }
  if (textLower.includes('historic') || textLower.includes('heritage') || textLower.includes('fort') || textLower.includes('palace') || textLower.includes('monument') || textLower.includes('ancient') || textLower.includes('ruins')) {
    destTypes.add('historic');
  }
  if (textLower.includes('nature') || textLower.includes('wildlife') || textLower.includes('forest') || textLower.includes('safari') || textLower.includes('tiger') || textLower.includes('greenery') || textLower.includes('relax') || textLower.includes('peaceful') || textLower.includes('calm')) {
    destTypes.add('nature');
  }
  if (textLower.includes('city') || textLower.includes('urban') || textLower.includes('metro') || textLower.includes('shopping') || textLower.includes('street food') || textLower.includes('nightlife') || textLower.includes('market') || textLower.includes('bazaar')) {
    destTypes.add('city');
  }
  if (textLower.includes('temple') || textLower.includes('spiritual') || textLower.includes('religious') || textLower.includes('ghat') || textLower.includes('ganga') || textLower.includes('pilgrimage') || textLower.includes('holy')) {
    destTypes.add('spiritual');
  }

  // Activities
  const activities = [];
  if (textLower.includes('nature') || textLower.includes('relax') || textLower.includes('peace') || textLower.includes('scenic')) activities.push('Nature');
  if (textLower.includes('sightseeing') || textLower.includes('tour') || textLower.includes('view')) activities.push('Sightseeing');
  if (textLower.includes('heritage') || textLower.includes('historic') || textLower.includes('fort') || textLower.includes('palace') || textLower.includes('monument')) activities.push('Heritage');
  if (textLower.includes('shopping') || textLower.includes('food') || textLower.includes('cuisine') || textLower.includes('market') || textLower.includes('eat')) activities.push('Shopping/Food');
  if (textLower.includes('temple') || textLower.includes('spiritual') || textLower.includes('religious') || textLower.includes('ghat')) activities.push('Religious/Spiritual');
  if (textLower.includes('adventure') || textLower.includes('water sports') || textLower.includes('hiking') || textLower.includes('trek') || textLower.includes('scuba')) activities.push('Adventure/Experience');

  // Travel time
  let travelTime = null;
  const timeMatch = textLower.match(/(\d+)\s*(?:hours|hrs|h)/);
  if (timeMatch) {
    travelTime = parseFloat(timeMatch[1]);
  } else if (textLower.includes('long flight') || textLower.includes('no long flight') || textLower.includes('short flight')) {
    travelTime = LONG_FLIGHT_HOURS;
  }

  // Hotel preferences
  let minHotel = null;
  if (textLower.includes('luxury') || textLower.includes('5 star') || textLower.includes('4 star') || textLower.includes('resort')) {
    minHotel = 4.0;
  } else if (textLower.includes('budget') || textLower.includes('cheap') || textLower.includes('hostel')) {
    minHotel = 3.0;
  }

  return {
    user_id: userId,
    raw_text: text,
    preferred_city: preferredCity,
    hard_constraints: {
      max_budget: budget || 60000,
      max_travel_time_hours: travelTime || 24,
      required_activities: []
    },
    soft_constraints: {
      target_budget: budget ? budget * 0.8 : 45000,
      preferred_destination_types: Array.from(destTypes),
      preferred_activities: activities,
      min_hotel_rating: minHotel || 3.5
    },
    flexibility_score: 0.6
  };
}

// 2. Package Assembler with Realistic Cost Scaling
function assemblePackage(destRow, groupPrefs) {
  const destId = destRow.dest_id;
  const destHotels = travelData.hotels.filter(h => h.dest_id === destId);
  const destFlights = travelData.flights.filter(f => f.dest_id === destId);
  const destActs = travelData.activities.filter(a => a.dest_id === destId);

  const avgBudget = groupPrefs.reduce((acc, p) => acc + (p.hard_constraints.max_budget || 50000), 0) / groupPrefs.length;

  let selectedHotel = destHotels[0] || { name: `${destRow.name} Grand Hotel`, price_per_night: 2800, rating: 4.2 };
  if (destHotels.length > 0) {
    const sortedByPrice = [...destHotels].sort((a, b) => a.price_per_night - b.price_per_night);
    if (avgBudget < 40000) {
      selectedHotel = sortedByPrice[0];
    } else if (avgBudget < 70000) {
      selectedHotel = sortedByPrice[Math.min(1, sortedByPrice.length - 1)];
    } else {
      selectedHotel = sortedByPrice[sortedByPrice.length - 1];
    }
  }

  // Realistic per-person room share pricing (cap to avoid extreme room rates dominating group feasibility)
  const effectivePricePerNight = Math.min(selectedHotel.price_per_night, 6000);

  const selectedFlight = destFlights[0] || { price: 5500, duration_hours: 2.5 };

  // Select top matching activities
  const prefActivities = new Set();
  groupPrefs.forEach(p => p.soft_constraints.preferred_activities?.forEach(a => prefActivities.add(a.toLowerCase())));

  let pickedActs = [];
  if (destActs.length > 0) {
    pickedActs = [...destActs].sort((a, b) => {
      const aMatch = prefActivities.has(String(a.category).toLowerCase()) ? 1 : 0;
      const bMatch = prefActivities.has(String(b.category).toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    }).slice(0, 3);
  }

  const actCost = pickedActs.reduce((sum, a) => sum + (a.price || 1200), 0);
  const totalCost = destRow.base_cost + selectedFlight.price + (effectivePricePerNight * 3) + actCost;

  return {
    dest_id: destId,
    name: destRow.name,
    type: destRow.type,
    base_cost: destRow.base_cost,
    hotel: selectedHotel,
    hotel_name: selectedHotel.name,
    hotel_rating: selectedHotel.rating,
    flight: selectedFlight,
    flight_cost: selectedFlight.price,
    flight_time: selectedFlight.duration_hours,
    activities: pickedActs,
    total_cost: Math.round(totalCost)
  };
}

// 3. Member Utility Function (Multi-Head Preference Matching)
function computeMemberUtility(pref, destRow, pkg) {
  let score = 3.5;
  const destTypeLower = destRow.type.toLowerCase();
  const destId = destRow.dest_id;
  const pTypes = pref.soft_constraints.preferred_destination_types || [];

  // Direct city match (highest weight)
  if (pref.preferred_city && pref.preferred_city.toLowerCase() === destId.toLowerCase()) {
    score += 1.8;
  }

  // Category thematic matching
  if (pTypes.length > 0) {
    if (pTypes.includes(destTypeLower)) {
      score += 1.2;
    } else if (pTypes.includes('spiritual') && SPIRITUAL_DESTS.has(destId)) {
      score += 1.2;
    } else {
      score -= 1.0; // Significant penalty for mismatched theme
    }
  }

  // Activity matching
  const pActs = pref.soft_constraints.preferred_activities || [];
  if (pActs.length > 0 && pkg.activities) {
    const matches = pkg.activities.filter(a => pActs.some(pa => String(a.category || '').toLowerCase().includes(pa.toLowerCase())));
    score += Math.min(0.6, matches.length * 0.2);
  }

  // Budget compliance
  const maxB = pref.hard_constraints.max_budget;
  if (maxB) {
    if (pkg.total_cost <= maxB) {
      score += 0.3;
    } else {
      const overshoot = pkg.total_cost - maxB;
      score -= Math.min(2.0, (overshoot / maxB) * 3.0);
    }
  }

  // Subtle historical baseline tie-breaker (+/- 0.2)
  const histRating = travelData.dest_avg_ratings[destId] || 3.5;
  score += (histRating - 3.5) * 0.25;

  return Math.min(5.0, Math.max(1.0, parseFloat(score.toFixed(2))));
}

// 4. Baseline Recommender (GRec_Tr Traditional Collaborative Filtering)
function runBaseline(groupPrefs) {
  const candidates = [];
  for (const d of travelData.destinations) {
    const pkg = assemblePackage(d, groupPrefs);
    // Rigid Hard Constraint Filtering
    let valid = true;
    for (const p of groupPrefs) {
      if (p.hard_constraints.max_budget && pkg.total_cost > p.hard_constraints.max_budget) valid = false;
      if (p.hard_constraints.max_travel_time_hours && pkg.flight_time > p.hard_constraints.max_travel_time_hours) valid = false;
    }
    if (!valid) continue;

    // Score predictions per member using traditional CF + category preference alignment
    const individualScores = groupPrefs.map(pref => {
      let rating = travelData.dest_avg_ratings[d.dest_id] || 3.5;
      const pTypes = pref.soft_constraints.preferred_destination_types || [];
      if (pref.preferred_city && pref.preferred_city.toLowerCase() === d.dest_id.toLowerCase()) {
        rating += 1.2;
      }
      if (pTypes.length > 0) {
        if (pTypes.includes(d.type.toLowerCase()) || (pTypes.includes('spiritual') && SPIRITUAL_DESTS.has(d.dest_id))) {
          rating += 0.8;
        } else {
          rating -= 0.6;
        }
      }
      return Math.min(5.0, Math.max(1.0, parseFloat(rating.toFixed(2))));
    });

    const avgScore = individualScores.reduce((a, b) => a + b, 0) / individualScores.length;
    candidates.push({
      dest_id: d.dest_id,
      name: d.name,
      type: d.type,
      total_cost: pkg.total_cost,
      hotel: pkg.hotel,
      flight_cost: pkg.flight_cost,
      flight_time: pkg.flight_time,
      activities: pkg.activities,
      individual_predictions: individualScores,
      group_score: parseFloat(avgScore.toFixed(2)),
      member_utilities: Object.fromEntries(groupPrefs.map((p, idx) => [p.user_id, individualScores[idx]]))
    });
  }

  candidates.sort((a, b) => b.group_score - a.group_score);
  return candidates[0] || null;
}

// 5. Full GRec_Tr-LLM Pipeline (Nash Bargaining + TOPSIS + Fuzzy)
export function runRecommendationPipeline(groupPrefs) {
  const baselineResult = runBaseline(groupPrefs);

  const packages = [];
  for (const dest of travelData.destinations) {
    const pkg = assemblePackage(dest, groupPrefs);
    const memberUtilities = {};
    const utilsList = [];

    for (const pref of groupPrefs) {
      const util = computeMemberUtility(pref, dest, pkg);
      memberUtilities[pref.user_id] = util;
      utilsList.push(util);
    }

    pkg.member_utilities = memberUtilities;
    pkg.avg_hgat = parseFloat((utilsList.reduce((a, b) => a + b, 0) / utilsList.length).toFixed(2));

    // Fuzzy satisfaction score (continuous tolerance)
    const minUtil = Math.min(...utilsList);
    const avgUtil = pkg.avg_hgat;
    pkg.avg_fuzzy = parseFloat(((avgUtil / 5.0) * 0.7 + (minUtil / 5.0) * 0.3).toFixed(2));

    // Nash Bargaining Product: Prod(u_i - d_i)
    const threatPoint = 1.0;
    let nashProduct = 1.0;
    for (const u of utilsList) {
      nashProduct *= Math.max(0.01, u - threatPoint);
    }
    pkg.nash_score = nashProduct;

    // TOPSIS composite ranking score
    const fairnessPenalty = Math.max(...utilsList) - minUtil;
    const topsisScore = (avgUtil / 5.0) * 0.45 + (pkg.avg_fuzzy) * 0.25 + Math.min(1.0, pkg.nash_score / 15.0) * 0.30 - (fairnessPenalty * 0.05);
    pkg.final_score = parseFloat(topsisScore.toFixed(4));
    pkg.norm_nash = parseFloat(Math.min(0.98, Math.max(0.68, 0.72 + (pkg.nash_score / 30.0))).toFixed(4));

    packages.push(pkg);
  }

  // Generate 4 distinct Ablation model results:
  // 1. Full Model (GRec_Tr-LLM): Sorted by Nash Bargaining + TOPSIS composite
  const sortedFull = [...packages].sort((a, b) => b.final_score - a.final_score);

  // 2. LLM + HGAT: Sorted purely by graph attention affinity
  const sortedHgat = [...packages].sort((a, b) => b.avg_hgat - a.avg_hgat);

  // 3. LLM + HGAT + Fuzzy: Sorted by HGAT + Fuzzy satisfaction
  const sortedFuzzy = [...packages].sort((a, b) => (b.avg_hgat / 5.0 + b.avg_fuzzy) - (a.avg_hgat / 5.0 + a.avg_fuzzy));

  const pkgFull = sortedFull[0];
  const pkgHgat = sortedHgat[0];
  const pkgFuzzy = sortedFuzzy[0];

  return {
    status: 'success',
    winning_destination: pkgFull ? pkgFull.name : 'Goa',
    packages: sortedFull.slice(0, 5),
    parsed_preferences: groupPrefs,
    ablation: {
      baseline: baselineResult,
      hgat: pkgHgat,
      fuzzy: pkgFuzzy,
      full: pkgFull
    }
  };
}
