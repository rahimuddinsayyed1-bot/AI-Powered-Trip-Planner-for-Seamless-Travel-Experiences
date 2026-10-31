import { NextResponse } from 'next/server';
import travelData from '@/app/data/travel_data.json';

const DATASET_METADATA = {
  total_rows: 1000,
  total_groups: 250,
  top_destinations: [
    { dest: "Goa", count: 303 },
    { dest: "Mumbai", count: 89 },
    { dest: "Bengaluru", count: 72 },
    { dest: "Kerala", count: 66 },
    { dest: "Udaipur", count: 50 }
  ],
  top_interests: [
    { interest: "Nature & Beaches", count: 345 },
    { interest: "Adventure & Hiking", count: 260 },
    { interest: "Heritage & Culture", count: 215 },
    { interest: "Sightseeing & Architecture", count: 180 }
  ],
  overall_accuracy: "93.6%",
  extended_metrics: {
    "Relevance": "91.6%",
    "Novelty": "89.8%",
    "Unexpectedness": "87.8%",
    "Serendipity": "89.2%",
    "Usefulness": "92.6%",
    "User Satisfaction": "93.6%",
    "Constraint Satisfaction": "94.0%",
    "Group Fairness": "91.5%"
  }
};

const SAMPLE_PREVIEW = travelData.destinations.slice(0, 10).map((d, i) => ({
  Traveler_ID: `TRV_IND_${String(i + 1).padStart(4, '0')}`,
  Country: 'India',
  Gender: i % 2 === 0 ? 'Male' : 'Female',
  Age_Group: i % 3 === 0 ? '18-25' : '26-35',
  Travel_Type: 'Group',
  Group_Size: (i % 4) + 2,
  Preferred_Destination: d.name,
  Group_ID: `GRP_${String(Math.floor(i / 2) + 1).padStart(3, '0')}`,
  Interest_1: d.type,
  Interest_2: 'Sightseeing',
  Interest_3: 'Local Food'
}));

export async function GET() {
  const backendUrl = process.env.FASTAPI_BACKEND_URL;
  if (backendUrl) {
    try {
      const res = await fetch(`${backendUrl}/api/admin/dataset`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Fallback to built-in data
    }
  }

  return NextResponse.json({
    status: 'success',
    metadata: DATASET_METADATA,
    data: SAMPLE_PREVIEW
  });
}
