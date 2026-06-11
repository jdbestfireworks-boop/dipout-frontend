import { base44 } from '@/api/base44Client';

const BASE_FARE = 3.0; // flag drop
const PER_MILE = 2.5; // realistic per-mile rate

export async function getDynamicFare({ distanceMiles, pickupAddress, dropoffAddress }) {
  const baseFare = BASE_FARE + distanceMiles * PER_MILE;
  const now = new Date();

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a dynamic pricing engine for a ride-sharing service in Louisiana.
Current time: ${now.toString()}.
Trip: from "${pickupAddress}" to "${dropoffAddress}", distance ${distanceMiles.toFixed(1)} miles.
Determine a surge multiplier between 0.8 and 2.5 based on: time of day, day of week, rush hour patterns, weather, and local events.
1.0 = normal, >1.0 = high demand (rush hour, bad weather, events), <1.0 = slow period.
Return a brief rider-friendly reason (max 8 words).`,
      add_context_from_internet: false,
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
  } catch (error) {
    console.error('Dynamic pricing error:', error);
    // Fallback to standard pricing (no surge)
    return {
      baseFare: Math.round(baseFare * 100) / 100,
      surgeMultiplier: 1.0,
      fare: Math.round(baseFare * 100) / 100,
      reason: 'Standard pricing applied.',
    };
  }
}