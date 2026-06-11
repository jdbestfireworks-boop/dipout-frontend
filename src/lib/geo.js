export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function stepToward(fromLat, fromLng, toLat, toLng, fraction = 0.15) {
  return {
    lat: fromLat + (toLat - fromLat) * fraction,
    lng: fromLng + (toLng - fromLng) * fraction,
  };
}

// Louisiana boundaries (approximate)
const LOUISIANA_BOUNDS = {
  north: 33.0,
  south: 28.8,
  east: -88.8,
  west: -94.0,
};

export function isInLouisiana(lat, lng) {
  return lat >= LOUISIANA_BOUNDS.south && lat <= LOUISIANA_BOUNDS.north && lng >= LOUISIANA_BOUNDS.west && lng <= LOUISIANA_BOUNDS.east;
}

export function checkLouisianaAddress(address) {
  // Check if address contains Louisiana indicators
  const laKeywords = ['louisiana', 'la,', 'new orleans', 'baton rouge', 'shreveport', 'lafayette', 'lake charles'];
  const lowerAddress = address.toLowerCase();
  return laKeywords.some(keyword => lowerAddress.includes(keyword));
}