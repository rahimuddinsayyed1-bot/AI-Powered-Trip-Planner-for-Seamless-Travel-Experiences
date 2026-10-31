// Shared in-memory storage for booked trips during application runtime
let bookedTripsCache = [
  {
    Traveler_ID: 'TRV_BK_001',
    Group_ID: 'GRP_AURORA',
    Group_Size: 4,
    Preferred_Destination: 'Sikkim',
    Age_Group: '26-35',
    Gender: 'Mixed',
    Travel_Type: 'Group',
    Country: 'India',
    Booking_Time: new Date(Date.now() - 3600000 * 2).toISOString().replace('T', ' ').substring(0, 19),
    Interest_1: 'Mountain',
    Interest_2: 'Nature',
    Interest_3: 'Hiking'
  },
  {
    Traveler_ID: 'TRV_BK_002',
    Group_ID: 'GRP_SOLARIS',
    Group_Size: 3,
    Preferred_Destination: 'Goa',
    Age_Group: '18-25',
    Gender: 'Mixed',
    Travel_Type: 'Group',
    Country: 'India',
    Booking_Time: new Date(Date.now() - 3600000 * 5).toISOString().replace('T', ' ').substring(0, 19),
    Interest_1: 'Beach',
    Interest_2: 'Water Sports',
    Interest_3: 'Food Tour'
  }
];

export function getBookedTrips() {
  return bookedTripsCache;
}

export function addBookedTrip(newTripRows) {
  bookedTripsCache = [...newTripRows, ...bookedTripsCache];
  return bookedTripsCache;
}
