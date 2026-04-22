import pool from './config/database';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

async function runTests() {
  console.log('🔍 Running Connection Tests...\n');

  // 1. Database Connection
  try {
    process.stdout.write('Testing Database Connection... ');
    const res = await pool.query('SELECT current_database(), current_user;');
    console.log('✅ Connected!');
    console.log(`   Database: ${res.rows[0].current_database}`);
    console.log(`   User: ${res.rows[0].current_user}`);
    
    // Check PostGIS
    process.stdout.write('Testing PostGIS Extension... ');
    const postgis = await pool.query('SELECT PostGIS_version();');
    console.log('✅ Active!');
    console.log(`   Version: ${postgis.rows[0].postgis_version}`);
  } catch (err: any) {
    console.log('\n❌ Database connection failed: ' + err.message);
    console.log('   (If testing Supabase, ensure your .env has the Supabase connection string)');
  }

  console.log('\n----------------------------------------\n');

  // 2. Local API Server
  try {
    process.stdout.write('Testing Local Backend API (http://localhost:3001/health)... ');
    
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3001/health', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log('✅ Running!');
            console.log(`   Response: ${data}`);
            resolve(true);
          } else {
            console.log(`❌ Failed with status code: ${res.statusCode}`);
            reject(new Error(`Status: ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', (err) => {
        console.log('\n❌ API Server is unreachable: ' + err.message);
        console.log('   (Make sure you are running `npm run dev` in the backend folder)');
        resolve(false);
      });
    });
  } catch (e) {
    // Handled above
  }

  process.exit(0);
}

runTests();
