import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gyaaxdxffrybericpeoy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YWF4ZHhmZnJ5YmVyaWNwZW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NDg1MjIsImV4cCI6MjA3NjEyNDUyMn0.JK0KDvJi9EN4US3RX2mesqPx_rMfgC4A1_-9eCaX5Lo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
