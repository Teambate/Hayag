import fs from 'fs';

// Get all environment variables that start with VITE_
const viteEnvVars = Object.entries(process.env)
  .filter(([key]) => key.startsWith('VITE_'))
  .map(([key, val]) => `${key}=${val}`)
  .join('\n');

// Write to frontend/.env
try {
  fs.writeFileSync('./frontend/.env', viteEnvVars);
  console.log('Successfully created frontend/.env with VITE_ environment variables');
} catch (error) {
  console.error('Error writing frontend/.env file:', error);
  process.exit(1);
} 