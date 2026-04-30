import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://nvuyjhnpcoktontlpgce.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'dummy_service_key_replace_me_in_env';

/**
 * Supabase client for backend operations (Storage, Admin).
 * Uses the service_role key for full access.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
