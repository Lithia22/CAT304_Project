const config = {
  // Server Configuration
  server: {
    host: 'YOUR_SERVER_HOST', // replace this too
    port: 3001,
    listenAddress: '0.0.0.0'
  },
  // API Configuration
  API_BASE_URL: 'http://YOUR_SERVER_HOST:3001',
  POLLING_INTERVAL: 30000, // 30 seconds
  // Database Configuration
  database: {
    // i used mysql for database so replace everything within '' with the necessary informations
    host: 'YOUR_DB_HOST', 
    user: 'YOUR_DB_USER',
    password: 'YOUR_DB_PASSWORD',
    database: 'YOUR_DB_NAME'
  }
};

// Helper function for API URLs
const buildApiUrl = (endpoint) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${config.API_BASE_URL}${normalizedEndpoint}`;
};

module.exports = { config, buildApiUrl };