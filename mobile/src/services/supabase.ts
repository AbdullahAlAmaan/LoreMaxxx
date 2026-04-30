import { createClient } from '@supabase/supabase-js';

// ============================================
// Supabase Client — Realtime + Storage
// ============================================

const SUPABASE_URL = 'https://nvuyjhnpcoktontlpgce.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'dummy_anon_key_replace_me_in_env';

/**
 * Supabase client for the mobile app.
 * Used for:
 *   - Realtime subscriptions (leaderboard live updates)
 *   - Storage (future image uploads)
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
});

export default supabase;
