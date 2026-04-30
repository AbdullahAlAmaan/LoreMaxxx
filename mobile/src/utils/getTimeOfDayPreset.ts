// ============================================
// Time-of-Day → Mapbox Standard lightPreset
// ============================================

export type LightPreset = 'dawn' | 'day' | 'dusk' | 'night';

/**
 * Returns the Mapbox Standard style lightPreset based on the current local hour.
 *
 *   5 AM – 7 AM  → 'dawn'   (warm golden light)
 *   7 AM – 5 PM  → 'day'    (bright, full color)
 *   5 PM – 7 PM  → 'dusk'   (sunset tones)
 *   7 PM – 5 AM  → 'night'  (dark blue, city lights)
 */
export function getTimeOfDayPreset(): LightPreset {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}
