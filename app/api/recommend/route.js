import { NextResponse } from 'next/server';
import { runRecommendationPipeline } from '@/app/utils/recommender';

export async function POST(request) {
  try {
    const body = await request.json();
    const { budget, days, travelers } = body;

    const backendUrl = process.env.FASTAPI_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch (e) {
        // Fallback to internal engine
      }
    }

    const groupPrefs = (travelers || []).map((t, i) => ({
      user_id: `u_${i}`,
      raw_text: `Traveler wants ${t.destination} with ${t.preferences?.join(', ')}`,
      hard_constraints: {
        max_budget: budget || 75000,
        max_travel_time_hours: 24,
        required_activities: []
      },
      soft_constraints: {
        target_budget: budget ? budget * 0.8 : 60000,
        preferred_destination_types: [t.destination],
        preferred_activities: t.preferences || [],
        min_hotel_rating: 3.5
      },
      flexibility_score: 0.5
    }));

    const result = runRecommendationPipeline(groupPrefs);

    return NextResponse.json({
      status: 'success',
      winning_destination: result.winning_destination,
      packages: result.packages
    });
  } catch (error) {
    console.error('Error in recommend API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
