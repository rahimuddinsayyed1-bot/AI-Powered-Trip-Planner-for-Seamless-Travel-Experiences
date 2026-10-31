import travelData from '@/app/data/travel_data.json';

const USD_TO_INR = 83.0;
const EUR_TO_INR = 90.0;
const LONG_FLIGHT_HOURS = 6.0;

// 1. NLP Preference Parser
export function parsePreference(text, userId) {
  const textLower = (text || '').toLowerCase();

  // Budget extraction
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

  // Destination Types
  const destTypes = [];
  if (textLower.includes('beach') || textLower.includes('coast') || textLower.includes('sea') || textLower.includes('ocean')) destTypes.push('beach');
  if (textLower.includes('mountain') || textLower.includes('hill') || textLower.includes('trek') || textLower.includes('himalaya') || textLower.includes('snow')) destTypes.push('mountain');
  if (textLower.includes('city') || textLower.includes('urban') || textLower.includes('metro') || textLower.includes('market')) destTypes.push('city');
  if (textLower.includes('historic') || textLower.includes('heritage') || textLower.includes('fort') || textLower.includes('monument') || textLower.includes('temple') || textLower.includes('ancient')) destTypes.push('historic');
  if (textLower.includes('nature') || textLower.includes('wildlife') || textLower.includes('forest') || textLower.includes('safari') || textLower.includes('greenery')) destTypes.push('nature');

  // Activities
  const activities = [];
  if (textLower.includes('nature') || textLower.includes('relax') || textLower.includes('peace') || textLower.includes('calm') || textLower.includes('scenic')) activities.push('Nature');
  if (textLower.includes('sightseeing') || textLower.includes('tour') || textLower.includes('view') || textLower.includes('attraction')) activities.push('Sightseeing');
  if (textLower.includes('heritage') || textLower.includes('historic') || textLower.includes('fort') || textLower.includes('palace') || textLower.includes('culture')) activities.push('Heritage');
  if (textLower.includes('shopping') || textLower.includes('food') || textLower.includes('cuisine') || textLower.includes('market') || textLower.includes('eat')) activities.push('Shopping/Food');
  if (textLower.includes('temple') || textLower.includes('religious') || textLower.includes('spiritual') || textLower.includes('ghat') || textLower.includes('shrine')) activities.push('Religious/Spiritual');
  if (textLower.includes('adventure') || textLower.includes('water sports') || textLower.includes('hiking') || textLower.includes('rafting') || textLower.includes('trekking')) activities.push('Adventure/Experience');

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
  if (textLower.includes('luxury') || textLower.includes('5 star') || textLower.includes('4 star') || textLower.includes('resort') || textLower.includes('best hotel')) {
    minHotel = 4.0;
  } else if (textLower.includes('budget hotel') || textLower.includes('cheap') || textLower.includes('hostel') || textLower.includes('low cost')) {
    minHotel = 3.0;
  }

  return {
    user_id: userId,
    raw_text: text,
    hard_constraints: {
      max_budget: budget,
      max_travel_time_hours: travelTime,
      required_activities: []
    },
    soft_constraints: {
      target_budget: budget ? budget * 0.8 : null,
      preferred_destination_types: destTypes,
      preferred_activities: activities,
      min_hotel_rating: minHotel
    },
    flexibility_score: 0.6
  };
}

// 2. Continuous Gaussian Membership
function gaussianSatisfaction(actual, limit, isMax = true, flexibility = 0.5) {
  if (limit === null || limit === undefined) return 1.0;
  if (isMax) {
    if (actual <= limit) return 1.0;
    const overshoot = actual - limit;
    const sigma = limit * (0.2 + flexibility * 0.3);
    return Math.exp(-Math.pow(overshoot, 2) / (2 * Math.pow(sigma, 2)));
  } else {
    if (actual >= limit) return 1.0;
    const shortfall = limit - actual;
    const sigma = limit * (0.15 + flexibility * 0.25);
    return Math.exp(-Math.pow(shortfall, 2) / (2 * Math.pow(sigma, 2)));
  }
}

// 3. Package Assembler
function assemblePackage(destRow, groupPrefs) {
  const destId = destRow.dest_id;
  const destHotels = travelData.hotels.filter(h => h.dest_id === destId);
  const destFlights = travelData.flights.filter(f => f.dest_id === destId);
  const destActs = travelData.activities.filter(a => a.dest_id === destId);

  // Pick suitable hotel
  let selectedHotel = destHotels[0] || { name: `${destRow.name} Grand Hotel`, price_per_night: 3500, rating: 4.2 };
  if (destHotels.length > 1) {
    const avgBudget = groupPrefs.reduce((acc, p) => acc + (p.hard_constraints.max_budget || 50000), 0) / groupPrefs.length;
    if (avgBudget > 60000) {
      selectedHotel = destHotels.reduce((prev, curr) => (curr.price_per_night > prev.price_per_night ? curr : prev), destHotels[0]);
    } else {
      selectedHotel = destHotels.reduce((prev, curr) => (curr.price_per_night < prev.price_per_night ? curr : prev), destHotels[0]);
    }
  }

  // Pick flight
  const selectedFlight = destFlights[0] || { price: 6500, duration_hours: 2.5 };

  // Pick top 3 activities aligned with preferences
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
  const totalCost = destRow.base_cost + selectedFlight.price + (selectedHotel.price_per_night * 3) + actCost;

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

// 4. HGAT Prediction Simulation
function predictHgat(pref, destRow, pkg) {
  const baseRating = travelData.dest_avg_ratings[destRow.dest_id] || 3.8;
  let score = baseRating;

  // Category match
  const prefTypes = pref.soft_constraints.preferred_destination_types || [];
  if (prefTypes.length > 0) {
    if (prefTypes.some(t => destRow.type.toLowerCase().includes(t.toLowerCase()))) {
      score += 0.8;
    } else {
      score -= 0.5;
    }
  }

  // Activity match
  const prefActs = pref.soft_constraints.preferred_activities || [];
  if (prefActs.length > 0 && pkg.activities) {
    const matches = pkg.activities.filter(a => prefActs.some(pa => String(a.category || '').toLowerCase().includes(pa.toLowerCase())));
    score += Math.min(0.6, matches.length * 0.2);
  }

  return Math.min(5.0, Math.max(1.0, parseFloat(score.toFixed(2))));
}

// 5. Baseline Recommender (matches our improved baseline.py)
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

    // Score predictions per member
    const individualScores = groupPrefs.map(pref => {
      let rating = travelData.dest_avg_ratings[d.dest_id] || 3.8;
      const prefTypes = pref.soft_constraints.preferred_destination_types || [];
      if (prefTypes.length > 0) {
        if (prefTypes.some(t => d.type.toLowerCase().includes(t.toLowerCase()))) {
          rating += 0.7;
        } else {
          rating -= 0.4;
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

// 6. Full GRec_Tr-LLM Pipeline (Nash Bargaining + TOPSIS + Fuzzy)
export function runRecommendationPipeline(groupPrefs) {
  const baselineResult = runBaseline(groupPrefs);

  const packages = [];
  for (const dest of travelData.destinations) {
    const pkg = assemblePackage(dest, groupPrefs);
    const memberUtilities = {};
    const hgatScores = [];
    const fuzzyScores = [];

    for (const pref of groupPrefs) {
      const hgat = predictHgat(pref, dest, pkg);
      hgatScores.append ? hgatScores.append(hgat) : hgatScores.push(hgat);

      const bSat = gaussianSatisfaction(pkg.total_cost, pref.hard_constraints.max_budget, true, pref.flexibility_score);
      const tSat = gaussianSatisfaction(pkg.flight_time, pref.hard_constraints.max_travel_time_hours, true, pref.flexibility_score);
      const hSat = gaussianSatisfaction(pkg.hotel_rating, pref.soft_constraints.min_hotel_rating, false, pref.flexibility_score);
      const overallFuzzy = (bSat * 0.45 + tSat * 0.35 + hSat * 0.20);
      fuzzyScores.push(overallFuzzy);

      // Utility = 50% normalized HGAT + 50% Fuzzy satisfaction (scale 0-5)
      const util = ((hgat / 5.0) * 0.5 + overallFuzzy * 0.5) * 5.0;
      memberUtilities[pref.user_id] = parseFloat(util.toFixed(2));
    }

    pkg.member_utilities = memberUtilities;
    pkg.avg_hgat = parseFloat((hgatScores.reduce((a, b) => a + b, 0) / hgatScores.length).toFixed(2));
    pkg.avg_fuzzy = parseFloat((fuzzyScores.reduce((a, b) => a + b, 0) / fuzzyScores.length).toFixed(2));

    // Nash Bargaining Product: Prod(u_i - d_i)
    const threatPoint = 1.0;
    let nashProduct = 1.0;
    for (const u of Object.values(memberUtilities)) {
      nashProduct *= Math.max(0.01, u - threatPoint);
    }
    pkg.nash_score = nashProduct;

    // TOPSIS composite
    const topsisScore = (pkg.avg_hgat / 5.0) * 0.35 + pkg.avg_fuzzy * 0.35 + Math.min(1.0, pkg.nash_score / 15.0) * 0.30;
    pkg.final_score = topsisScore;
    pkg.norm_nash = parseFloat(Math.min(0.98, Math.max(0.65, 0.70 + (pkg.nash_score / 35.0))).toFixed(4));

    packages.push(pkg);
  }

  // Sortings for Ablations
  const sortedFull = [...packages].sort((a, b) => b.final_score - a.final_score);
  const sortedHgat = [...packages].sort((a, b) => b.avg_hgat - a.avg_hgat);
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
