import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Utility to import sensor readings from a JSON file to the database
 * 
 * Usage:
 * node bulkImport.js [filepath] [batchSize] [serverUrl]
 * 
 * Arguments:
 * - filepath: Path to the JSON file containing the readings array
 * - batchSize: (Optional) Number of records to send in each batch (default: 100)
 * - serverUrl: (Optional) URL of the server API (default: http://localhost:3000)
 * 
 * Environment Variables:
 * - API_TOKEN: Admin JWT token for authentication
 */

// Parse command line arguments
const args = process.argv.slice(2);
const filePath = args[0];
const batchSize = parseInt(args[1]) || 100;
const serverUrl = args[2] || process.env.API_URL || 'http://localhost:3000';
const apiToken = process.env.API_TOKEN;

if (!filePath) {
  console.error('Error: JSON file path is required');
  console.log('Usage: node bulkImport.js [filepath] [batchSize] [serverUrl]');
  process.exit(1);
}

if (!apiToken) {
  console.error('Error: API_TOKEN environment variable is required');
  console.log('Please set the API_TOKEN environment variable with a valid admin JWT token');
  process.exit(1);
}

async function importData() {
  try {
    // Read and parse JSON file
    const fullPath = path.resolve(filePath);
    console.log(`Reading file: ${fullPath}`);
    
    const fileData = fs.readFileSync(fullPath, 'utf8');
    let readings;
    
    try {
      const jsonData = JSON.parse(fileData);
      readings = Array.isArray(jsonData) ? jsonData : jsonData.readings || jsonData.data;
      
      if (!Array.isArray(readings)) {
        throw new Error('JSON file must contain an array of readings (either directly or under a "readings" or "data" property)');
      }
    } catch (parseError) {
      console.error('Error parsing JSON file:', parseError.message);
      process.exit(1);
    }
    
    console.log(`Found ${readings.length} readings in the file`);
    
    // Configure API request
    const apiUrl = `${serverUrl}/api/readings/bulk`;
    console.log(`Sending data to: ${apiUrl}`);
    
    const response = await axios.post(
      apiUrl,
      {
        readings,
        options: {
          batchSize,
          emitEvents: false // Set to true if you want to emit Socket.io events
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `token=${apiToken}`
        }
      }
    );
    
    console.log('Import successful:');
    console.log(`Total processed: ${response.data.result.totalDocuments}`);
    console.log(`Successfully inserted: ${response.data.result.insertedCount}`);
    console.log(`Failed: ${response.data.result.failedCount}`);
    
    if (response.data.result.errors.length > 0) {
      console.log(`Errors: ${response.data.result.errors.length}`);
      console.log('First few errors:', response.data.result.errors.slice(0, 3));
    }
    
  } catch (error) {
    console.error('Import failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Run the import
importData(); 