import { base44 } from '@/api/base44Client';

const BASE_RATE = 2.5; // flag drop
const PER_KM = 1.4;

export async function getDynamicFare({ distanceKm, pickupAddress, dropoffAddress }) {
  const baseFare = BASE_RATE + distanceKm * PER_KM;
  const now = new Date();

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a dynamic pricing engine for a ride-sharing service.
Current time: ${now.toString()}.
Trip: from "${pickupAddress}" to "${dropoffAddress}", distance ${distanceKm.toFixed(1)} km.
Using current local traffic conditions, weather, time of day, day of week, and typical ride demand patterns for this area, determine a surge multiplier between 0.8 and 2.5.
1.0 = normal conditions. Higher = heavy traffic / high demand / bad weather / rush hour / events. Lower = very quiet off-peak.
Give a one-sentence rider-friendly reason.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        surge_multiplier: { type: 'number' },
        reason: { type: 'string' },
      },
    },
  });

  const surge = Math.min(2.5, Math.max(0.8, result.surge_multiplier || 1));
  return {
    baseFare: Math.round(baseFare * 100) / 100,
    surgeMultiplier: Math.round(surge * 100) / 100,
    fare: Math.round(baseFare * surge * 100) / 100,
    reason: result.reason || 'Standard pricing applied.',
  };
}