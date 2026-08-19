const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://lcuzffaxenieuqxbmryc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('=== SWAR-AUTH SUPABASE DATABASE MANAGEMENT DEPLOYMENT ===');
console.log('Target Supabase Project URL:', supabaseUrl);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_KEY missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabaseConnection() {
  try {
    console.log('Connecting to Supabase...');
    const tables = ['users', 'students', 'faculty', 'subjects', 'voice_profiles', 'attendance_sessions', 'attendance'];
    
    let accessibleTables = 0;
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        console.log(` - Table '${table}': Notice / Pending initialization (${error.message})`);
      } else {
        accessibleTables++;
        console.log(` - Table '${table}': CONNECTED & ACCESSIBLE (Status: OK)`);
      }
    }

    console.log(`\nSupabase Database Status Summary: ${accessibleTables}/${tables.length} tables verified.`);
    console.log('\nTo apply the full PostgreSQL DDL schema with RLS policies, execute database/supabase_schema.sql in the Supabase SQL Editor.');
    console.log('Schema File Path: database/supabase_schema.sql');
  } catch (err) {
    console.error('Supabase connection error:', err.message);
  }
}

testSupabaseConnection();
