import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Substitua pelas chaves do seu projeto Supabase
const supabaseUrl = 'https://ghuohawiorrweygergkh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdodW9oYXdpb3Jyd2V5Z2VyZ2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNzkwNjQsImV4cCI6MjEwNjk1NTA2NH0.y8WO4CgNC8nlb_VFm0oxsfILS6NkfhDh1zLLSOQxH40';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
