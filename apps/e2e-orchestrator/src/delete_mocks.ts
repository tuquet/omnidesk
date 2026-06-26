import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Deleting mock apps...');
  const { error: deleteError } = await supabase
    .from('marketplace_apps')
    .delete()
    .in('id', ['lifecycle', 'analytics', 'projects', 'documents', 'showcase', 'error-pages']);
    
  if (deleteError) {
    console.error('Error deleting mock apps:', deleteError);
  } else {
    console.log('Mock apps deleted successfully.');
  }

  console.log('Inserting automa app...');
  const { error: insertError } = await supabase
    .from('marketplace_apps')
    .upsert({
      id: 'automa',
      name: 'Automa E2E',
      description: 'End-to-End Orchestrator and test execution automation.',
      icon_name: 'PlayCircle',
      category: 'Development',
      is_core: false,
      sort_order: 10
    });

  if (insertError) {
    console.error('Error inserting automa app:', insertError);
  } else {
    console.log('Automa app inserted successfully.');
  }
}

run();
