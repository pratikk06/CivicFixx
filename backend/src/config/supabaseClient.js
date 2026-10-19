// server/src/config/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Supabase configuration missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  } else {
    // Use dummy values for test environment
    console.warn('⚠️ Supabase config missing – using mock client in test mode');
    // Provide fallback empty strings to allow client creation (will fail on real calls)
    // but tests that mock Supabase can proceed.
    // No process exit.
    // eslint-disable-next-line no-var
    var supabaseUrl = '';
    var supabaseServiceKey = '';
  }
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
