import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export let isSupabaseConfigured = false;

if (supabaseUrl && supabaseAnonKey) {
  try {
    new URL(supabaseUrl);
    isSupabaseConfigured = true;
  } catch (e) {
    console.error('Invalid Supabase URL provided.');
    supabaseUrl = '';
  }
}

// Fallback to placeholder if not configured to prevent createClient from crashing
if (!isSupabaseConfigured) {
  supabaseUrl = 'https://placeholder.supabase.co';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'placeholder');
