import { NextResponse } from 'next/server';
import { parsePreference, runRecommendationPipeline } from '@/app/utils/recommender';

export async function POST(request) {
  try {
    const body = await request.json();
    const travelers = body.travelers || [];

    // Check if external FastAPI backend is configured
    const backendUrl = process.env.FASTAPI_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/recommend-nlp`, {
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

    // Run internal GRec_Tr-LLM recommendation engine
    const groupPrefs = travelers.map((t, i) => parsePreference(t.description, `u_${i}`));
    const result = runRecommendationPipeline(groupPrefs);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in recommend-nlp API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
