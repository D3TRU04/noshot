#!/usr/bin/env node

/**
 * Database Update Script
 * 
 * This script helps verify that your Supabase database has the required fields.
 * Run this after executing the SQL migration in your Supabase dashboard.
 */

const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Test if we can query the groups table with the new fields
    const { data, error } = await supabase
      .from('groups')
      .select('id, code, name, bet_description, creator_wallet, max_members, bet_duration_hours, created_at')
      .limit(1);

    if (error) {
      console.error('❌ Error querying groups table:', error.message);
      
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\n💡 It looks like the new columns (name, bet_description) don\'t exist yet.');
        console.log('   Please run the SQL migration in your Supabase dashboard first.');
        console.log('   See SUPABASE_UPDATE_GUIDE.md for instructions.');
      }
      
      return false;
    }

    console.log('✅ Database schema is up to date!');
    console.log('   The groups table includes the new fields: name, bet_description');
    
    if (data && data.length > 0) {
      console.log('\n📊 Sample group data:');
      console.log(JSON.stringify(data[0], null, 2));
    }

    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    return false;
  }
}

async function testGroupCreation() {
  console.log('\n🧪 Testing group creation with new fields...\n');

  try {
    const testGroup = {
      code: 'TEST' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      name: 'Test Group - ' + new Date().toISOString(),
      bet_description: 'This is a test bet description',
      creator_wallet: 'test-wallet-address',
      max_members: 4,
      bet_duration_hours: 24
    };

    const { data, error } = await supabase
      .from('groups')
      .insert(testGroup)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test group:', error.message);
      return false;
    }

    console.log('✅ Test group created successfully!');
    console.log('   Group ID:', data.id);
    console.log('   Group Name:', data.name);
    console.log('   Bet Description:', data.bet_description);

    // Clean up the test group
    await supabase.from('groups').delete().eq('id', data.id);
    console.log('🧹 Test group cleaned up.');

    return true;

  } catch (err) {
    console.error('❌ Unexpected error during test:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Supabase Database Update Verification\n');
  console.log('This script will check if your database has the required fields.\n');

  const schemaOk = await checkDatabaseSchema();
  
  if (schemaOk) {
    const creationOk = await testGroupCreation();
    
    if (creationOk) {
      console.log('\n🎉 All checks passed! Your database is ready.');
      console.log('   You can now use the updated application features.');
    } else {
      console.log('\n⚠️  Schema looks good, but group creation failed.');
      console.log('   Check your Supabase permissions and try again.');
    }
  } else {
    console.log('\n❌ Database schema check failed.');
    console.log('   Please run the SQL migration first.');
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkDatabaseSchema, testGroupCreation };
