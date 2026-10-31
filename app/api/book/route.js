import { NextResponse } from 'next/server';
import { addBookedTrip } from '@/app/utils/bookingsStore';

export async function POST(request) {
  try {
    const body = await request.json();
    const { package: pkg, winning_destination, travelers } = body;

    const backendUrl = process.env.FASTAPI_BACKEND_URL;
    if (backendUrl) {
      try {
        const res = await fetch(`${backendUrl}/api/book`, {
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
        // Fallback to internal storage
      }
    }

    const groupId = `GRP_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newRows = (travelers || []).map((t, idx) => ({
      Traveler_ID: `TRV_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      Group_ID: groupId,
      Group_Size: travelers.length,
      Preferred_Destination: winning_destination || pkg?.name || 'India',
      Age_Group: t.ageGroup || '26-35',
      Gender: 'Unknown',
      Travel_Type: 'Group',
      Country: 'India',
      Booking_Time: nowStr,
      Interest_1: t.preferences?.[0] || 'General',
      Interest_2: t.preferences?.[1] || 'Sightseeing',
      Interest_3: t.preferences?.[2] || 'Culture'
    }));

    addBookedTrip(newRows);

    return NextResponse.json({
      status: 'success',
      group_id: groupId,
      message: 'Booking successfully saved!'
    });
  } catch (error) {
    console.error('Error in book API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
